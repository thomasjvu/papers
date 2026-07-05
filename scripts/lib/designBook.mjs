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

function parseScalar(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  return trimmed;
}

function parseYamlBlock(raw) {
  const root = {};
  const stack = [{ indent: -1, value: root }];
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    const indent = line.search(/\S/);
    const trimmed = line.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].value;

    if (trimmed.startsWith('- ')) {
      const itemValue = trimmed.slice(2).trim();
      const key = stack[stack.length - 1].key;
      if (!key) {
        continue;
      }
      if (!Array.isArray(parent[key])) {
        parent[key] = [];
      }
      if (itemValue.includes(':')) {
        const obj = {};
        const colon = itemValue.indexOf(':');
        const itemKey = itemValue.slice(0, colon).trim();
        const itemRaw = itemValue.slice(colon + 1).trim();
        obj[itemKey] = parseScalar(itemRaw);
        parent[key].push(obj);
      } else {
        parent[key].push(parseScalar(itemValue));
      }
      continue;
    }

    const colon = trimmed.indexOf(':');
    if (colon === -1) {
      continue;
    }

    const key = trimmed.slice(0, colon).trim();
    const rawValue = trimmed.slice(colon + 1).trim();

    if (!rawValue) {
      parent[key] = {};
      stack.push({ indent, key, value: parent[key] });
      continue;
    }

    parent[key] = parseScalar(rawValue);
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