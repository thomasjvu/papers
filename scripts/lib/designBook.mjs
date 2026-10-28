import fs from 'node:fs';
import path from 'node:path';

function stripUtf8Bom(content) {
  return content.replace(/^\uFEFF/, '');
}

function splitFrontmatter(content) {
  const normalized = stripUtf8Bom(content);
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatterRaw: '', body: normalized };
  }
  return {
    frontmatterRaw: match[1],
    body: normalized.slice(match[0].length).replace(/^\r?\n/, ''),
  };
}

function isQuoted(value) {
  return ['"', "'"].some((quote) => value.startsWith(quote) && value.endsWith(quote));
}

const BOOLEAN_SCALARS = { true: true, false: false };

function parseScalar(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (isQuoted(trimmed)) {
    return trimmed.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  return Object.hasOwn(BOOLEAN_SCALARS, trimmed) ? BOOLEAN_SCALARS[trimmed] : trimmed;
}

function splitKeyValue(text) {
  const colon = text.indexOf(':');
  if (colon === -1) {
    return null;
  }
  return { key: text.slice(0, colon).trim(), rawValue: text.slice(colon + 1).trim() };
}

function parseListItem(itemValue) {
  const pair = itemValue.includes(':') ? splitKeyValue(itemValue) : null;
  return pair ? { [pair.key]: parseScalar(pair.rawValue) } : parseScalar(itemValue);
}

/**
 * Appends a `- item` line. Note: items land on `frame.value[frame.key]`, i.e.
 * nested one level under their own key (`a: {a: [...]}`); pinned by tests.
 */
function appendListItem(frame, itemValue) {
  const { key, value: parent } = frame;
  if (!key) {
    return;
  }
  if (!Array.isArray(parent[key])) {
    parent[key] = [];
  }
  parent[key].push(parseListItem(itemValue));
}

/** Minimal YAML subset: nested maps by indentation, scalars, and `- ` lists. */
function parseYamlBlock(raw) {
  const root = {};
  const stack = [{ indent: -1, value: root }];

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const indent = line.search(/\S/);
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const frame = stack[stack.length - 1];
    if (trimmed.startsWith('- ')) {
      appendListItem(frame, trimmed.slice(2).trim());
      continue;
    }

    const pair = splitKeyValue(trimmed);
    if (!pair) {
      continue;
    }

    if (pair.rawValue) {
      frame.value[pair.key] = parseScalar(pair.rawValue);
    } else {
      frame.value[pair.key] = {};
      stack.push({ indent, key: pair.key, value: frame.value[pair.key] });
    }
  }

  return root;
}

function rgbFromHex(hex) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return null;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function parseDesignBook(content) {
  const { frontmatterRaw, body } = splitFrontmatter(content);
  const tokens = parseYamlBlock(frontmatterRaw);

  const colors = Object.entries(tokens.colors || {}).map(([name, hex]) => ({
    name,
    hex: String(hex),
    rgb: rgbFromHex(String(hex)) || '0, 0, 0',
    usage: `Token: colors.${name}`,
  }));

  const typography = Object.entries(tokens.typography || {}).map(([name, value]) => ({
    name,
    ...(typeof value === 'object' && value !== null ? value : { fontFamily: String(value) }),
  }));

  const rounded = tokens.rounded || {};
  const spacing = tokens.spacing || {};
  const components = tokens.components || {};

  return {
    name: tokens.name || 'Design System',
    description: tokens.description || '',
    version: tokens.version || 'alpha',
    tokens: {
      colors,
      typography,
      rounded,
      spacing,
      components,
    },
    body,
    rawFrontmatter: tokens,
  };
}

export function resolveDesignBookSource(projectRoot, config) {
  const configured = process.env.PAPERS_DESIGN_BOOK_SOURCE || config?.sourcePath || 'DESIGN.md';
  return path.isAbsolute(configured) ? configured : path.join(projectRoot, configured);
}

export function loadDesignBook(projectRoot, config) {
  const sourcePath = resolveDesignBookSource(projectRoot, config);
  if (!fs.existsSync(sourcePath)) {
    return null;
  }
  const content = fs.readFileSync(sourcePath, 'utf8');
  return {
    sourcePath,
    ...parseDesignBook(content),
  };
}
