import { buildCanonicalDocsPath } from '../../shared/docsRouting.js';
import { extractDescriptionFromMarkdown } from '../../shared/seo.js';
import { compileMdxToHtml, isMdxSourcePath } from './mdxCompile.mjs';

/**
 * Document artifact contract.
 *
 * A generated document is the build output of one source file, never an
 * independent content source. Every record contains `path`, `title`,
 * `description`, `frontmatter`, `content`, and `contentFormat`; it also
 * contains `sourcePath` whenever the source file is known. Markdown sources
 * keep their body as `contentFormat: 'markdown'`. MDX sources are compiled
 * with the repository's remark/rehype pipeline and stored as sanitized HTML
 * with `contentFormat: 'html'`, so the runtime must use the matching HTML
 * renderer. Frontmatter is a small explicit schema: quoted or unquoted
 * `title`/`description` scalars and an inline `tags` string array. `toc`,
 * `metadata`, and `references` are derived from the same source body and are
 * part of every generated record. Generated JSON is a build artifact, not an
 * independent source of truth.
 */

function stripUtf8Bom(content) {
  return content.replace(/^\uFEFF/, '');
}

const FRONTMATTER_KEYS = new Set(['title', 'description', 'tags']);

function getFrontmatterError(message, lineNumber) {
  const error = new Error(`Frontmatter line ${lineNumber}: ${message}`);
  error.lineNumber = lineNumber;
  return error;
}

function parseQuotedScalar(value, lineNumber) {
  const quote = value[0];

  if (value.length < 2 || value[value.length - 1] !== quote) {
    throw getFrontmatterError('quoted scalar is not closed.', lineNumber);
  }

  if (quote === '"') {
    try {
      return JSON.parse(value);
    } catch {
      throw getFrontmatterError('quoted scalar is not valid JSON.', lineNumber);
    }
  }

  return value.slice(1, -1).replace(/''/g, "'");
}

function parseStringScalar(value, lineNumber, key) {
  const normalized = value.trim();

  if (!normalized) {
    throw getFrontmatterError(`${key} must be a non-empty string.`, lineNumber);
  }

  if (normalized.startsWith('[') || normalized.startsWith('{')) {
    throw getFrontmatterError(`${key} must be a string, not a nested value.`, lineNumber);
  }

  if (normalized.startsWith('"') || normalized.startsWith("'")) {
    return parseQuotedScalar(normalized, lineNumber);
  }

  if (/["']$/.test(normalized)) {
    throw getFrontmatterError(`${key} has an unmatched quote.`, lineNumber);
  }

  if (/^(?:true|false|null|~|[-+]?\d+(?:\.\d+)?)$/i.test(normalized)) {
    throw getFrontmatterError(
      `${key} must be a string; quote scalar values of other YAML types.`,
      lineNumber
    );
  }

  return normalized;
}

function splitArrayValues(value, lineNumber) {
  const normalized = value.trim();

  if (!normalized.startsWith('[') || !normalized.endsWith(']')) {
    throw getFrontmatterError('tags must be an inline array of strings.', lineNumber);
  }

  const inner = normalized.slice(1, -1).trim();
  if (!inner) {
    return [];
  }

  const values = [];
  let current = '';
  let quote = null;

  const pushValue = () => {
    const item = current.trim();
    if (!item) {
      throw getFrontmatterError('tags cannot contain an empty item.', lineNumber);
    }

    const parsed = item.startsWith('"') || item.startsWith("'")
      ? parseQuotedScalar(item, lineNumber)
      : item;

    if (!parsed || /^(?:true|false|null|~|[-+]?\d+(?:\.\d+)?)$/i.test(parsed)) {
      throw getFrontmatterError('tags must contain only string values.', lineNumber);
    }

    if (!item.startsWith('\u0022') && !item.startsWith("'") && /[\u0022']/.test(item)) {
      throw getFrontmatterError('tags contains an unmatched quote.', lineNumber);
    }

    values.push(parsed);
    current = '';
  };

  for (let index = 0; index < inner.length; index += 1) {
    const character = inner[index];

    if (quote) {
      current += character;
      if (character === quote) {
        if (quote === "'" && inner[index + 1] === "'") {
          current += inner[index + 1];
          index += 1;
        } else if (inner[index - 1] !== '\\' || quote === "'") {
          quote = null;
        }
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }

    if (character === ',') {
      pushValue();
      continue;
    }

    current += character;
  }

  if (quote) {
    throw getFrontmatterError('tags contains an unclosed quote.', lineNumber);
  }

  pushValue();
  return values;
}

export function parseFrontmatter(content) {
  const normalized = stripUtf8Bom(content);
  const startsWithFrontmatter = /^---\r?\n/.test(normalized);

  if (!startsWithFrontmatter) {
    return {
      body: normalized,
      frontmatter: {},
    };
  }

  const lines = normalized.split(/\r?\n/);
  const closingIndex = lines.slice(1).findIndex((line) => line.trim() === '---') + 1;

  if (closingIndex === 0) {
    throw getFrontmatterError('frontmatter is missing its closing --- delimiter.', lines.length);
  }

  const body = lines.slice(closingIndex + 1).join('\n').replace(/^\r?\n/, '');
  const frontmatter = {};

  for (let index = 1; index < closingIndex; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (line !== line.trimStart()) {
      throw getFrontmatterError('nested frontmatter values are not supported.', index + 1);
    }

    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:[ \t]*(.*))?$/);
    if (!match) {
      throw getFrontmatterError('expected a top-level key: value field.', index + 1);
    }

    const [, key, rawValue = ''] = match;
    if (!FRONTMATTER_KEYS.has(key)) {
      throw getFrontmatterError(
        `unsupported key "${key}"; supported keys are title, description, and tags.`,
        index + 1
      );
    }

    if (Object.hasOwn(frontmatter, key)) {
      throw getFrontmatterError(`duplicate key "${key}".`, index + 1);
    }

    frontmatter[key] = key === 'tags'
      ? splitArrayValues(rawValue, index + 1)
      : parseStringScalar(rawValue, index + 1, key);
  }

  if (typeof frontmatter.title !== 'undefined' && typeof frontmatter.title !== 'string') {
    throw getFrontmatterError('title must be a string.', 1);
  }

  if (typeof frontmatter.description !== 'undefined' && typeof frontmatter.description !== 'string') {
    throw getFrontmatterError('description must be a string.', 1);
  }

  if (typeof frontmatter.tags !== 'undefined' && !Array.isArray(frontmatter.tags)) {
    throw getFrontmatterError('tags must be an array of strings.', 1);
  }

  return {
    body,
    frontmatter,
  };
}

const MARKDOWN_LINK_PATTERN =
  /!?(?:\[[^\]]*\])\(\s*(<[^>\n]+>|[^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;
const HTML_LINK_PATTERN = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
const EXTERNAL_LINK_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function classifyDocumentLink(target) {
  if (target === '#') {
    return 'action';
  }

  if (EXTERNAL_LINK_PATTERN.test(target) || target.startsWith('mailto:')) {
    return 'external';
  }

  return 'internal';
}

function lineNumberAt(content, offset) {
  return content.slice(0, offset).split(/\r?\n/).length;
}

function isInsideCodeFence(content, offset) {
  const lines = content.slice(0, offset).split(/\r?\n/);
  let fenceCharacter = null;

  for (const line of lines) {
    const match = line.match(/^\s*(`{3,}|~{3,})/);
    if (!match) {
      continue;
    }

    const nextFenceCharacter = match[1][0];
    fenceCharacter = fenceCharacter === nextFenceCharacter ? null : nextFenceCharacter;
  }

  return fenceCharacter !== null;
}

function normalizeReferenceTarget(target) {
  return target.trim().replace(/^<|>$/g, '');
}

/**
 * Return all author-written link and asset references with source line
 * numbers. Code fences are excluded because their examples are not runtime
 * links. The validator consumes this same extraction so generated metadata
 * and validation cannot drift apart.
 */
export function extractDocumentLinks(content) {
  const references = [];

  for (const pattern of [MARKDOWN_LINK_PATTERN, HTML_LINK_PATTERN]) {
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      if (isInsideCodeFence(content, match.index)) {
        continue;
      }

      const target = normalizeReferenceTarget(match[1]);
      if (!target) {
        continue;
      }

      references.push({
        target,
        line: lineNumberAt(content, match.index),
        type: classifyDocumentLink(target),
      });
    }
  }

  return references.sort(
    (left, right) => left.line - right.line || left.target.localeCompare(right.target)
  );
}

export function extractDocumentReferences(content) {
  return extractDocumentLinks(content)
    .filter((reference) => reference.type === 'internal')
    .map(({ target, line }) => ({ target, line }));
}

function normalizeHeadingText(value) {
  return value
    .replace(/\s+#+\s*$/, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifyHeading(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
}

/** Build the stable heading TOC used by route/link validation and page UI. */
export function createDocumentToc(content) {
  const { body } = parseFrontmatter(content);
  const lines = body.split(/\r?\n/);
  const seenIds = new Map();
  const toc = [];
  let fenceCharacter = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);

    if (fenceMatch) {
      const nextFenceCharacter = fenceMatch[1][0];
      fenceCharacter = fenceCharacter === nextFenceCharacter ? null : nextFenceCharacter;
      continue;
    }

    if (fenceCharacter !== null) {
      continue;
    }

    const atxMatch = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*$/);
    if (atxMatch) {
      const text = normalizeHeadingText(atxMatch[2]);
      if (text) {
        const baseId = slugifyHeading(text);
        const occurrence = seenIds.get(baseId) || 0;
        seenIds.set(baseId, occurrence + 1);
        toc.push({
          depth: atxMatch[1].length,
          id: occurrence === 0 ? baseId : `${baseId}-${occurrence + 1}`,
          text,
        });
      }
      continue;
    }

    const setextMatch = lines[index + 1]?.match(/^\s{0,3}(=+|-+)\s*$/);
    if (line.trim() && setextMatch) {
      const text = normalizeHeadingText(line.trim());
      const baseId = slugifyHeading(text);
      const occurrence = seenIds.get(baseId) || 0;
      seenIds.set(baseId, occurrence + 1);
      toc.push({
        depth: setextMatch[1][0] === '=' ? 1 : 2,
        id: occurrence === 0 ? baseId : `${baseId}-${occurrence + 1}`,
        text,
      });
      index += 1;
    }
  }

  return toc;
}

function createDocumentMetadata({
  docPath,
  title,
  description,
  contentFormat,
  sourcePath,
  version,
  locale,
  versionConfig,
  i18nConfig,
}) {
  const metadata = {
    title,
    description: description || '',
    canonicalPath: buildCanonicalDocsPath(docPath, {
      version,
      locale,
      versionConfig,
      i18nConfig,
    }),
    contentFormat,
  };

  if (sourcePath) {
    metadata.sourcePath = sourcePath;
  }
  if (version) {
    metadata.version = version;
  }
  if (locale) {
    metadata.locale = locale;
  }

  return metadata;
}

function getTitleFromBody(docPath, body) {
  const titleMatch = body.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : docPath.split('/').pop() || docPath;
}

export function extractTopLevelTitle(docPath, content) {
  const { body, frontmatter } = parseFrontmatter(content);
  return frontmatter.title || getTitleFromBody(docPath, body);
}

export function createDocumentArtifact(docPath, rawContent, sourcePath, options = {}) {
  const { body, frontmatter } = parseFrontmatter(rawContent);
  const content = stripUtf8Bom(body);
  const description = frontmatter.description || extractDescriptionFromMarkdown(content);
  const title = frontmatter.title || getTitleFromBody(docPath, content);
  const contentFormat = 'markdown';

  return {
    path: docPath,
    title,
    description: description || undefined,
    frontmatter,
    content,
    contentFormat,
    toc: createDocumentToc(rawContent),
    metadata: createDocumentMetadata({
      docPath,
      title,
      description,
      contentFormat,
      sourcePath,
      ...options,
    }),
    references: extractDocumentReferences(rawContent),
    ...(sourcePath
      ? {
          sourcePath,
        }
      : {}),
  };
}

export async function enrichDocumentArtifact(document) {
  if (!document?.sourcePath || !isMdxSourcePath(document.sourcePath)) {
    return document;
  }

  const html = await compileMdxToHtml(document.content);

  return {
    ...document,
    content: html,
    contentFormat: 'html',
    metadata: {
      ...(document.metadata ||
        createDocumentMetadata({
          docPath: document.path,
          title: document.title,
          description: document.description,
          contentFormat: document.contentFormat || 'markdown',
          sourcePath: document.sourcePath,
        })),
      contentFormat: 'html',
    },
  };
}

function normalizeIndex(index) {
  if (
    !index ||
    !Array.isArray(index.paths) ||
    typeof index.titles !== 'object' ||
    index.titles === null
  ) {
    return null;
  }

  return {
    paths: index.paths,
    count: index.count,
    titles: index.titles,
  };
}

export function createDocsArtifacts(
  docsByPath,
  generatedAt = new Date().toISOString(),
  sourcePathsByPath = {}
) {
  const documents = {};
  const paths = Object.keys(docsByPath);

  for (const docPath of paths) {
    documents[docPath] = createDocumentArtifact(
      docPath,
      docsByPath[docPath],
      sourcePathsByPath[docPath]
    );
  }

  return {
    index: {
      generated: generatedAt,
      paths,
      count: paths.length,
      titles: Object.fromEntries(paths.map((docPath) => [docPath, documents[docPath].title])),
    },
    documents,
  };
}

export function stabilizeIndexGeneration(previousIndex, nextIndex, fallbackGeneratedAt = new Date().toISOString()) {
  const comparablePrevious = normalizeIndex(previousIndex);
  const comparableNext = normalizeIndex(nextIndex);

  if (
    comparablePrevious &&
    comparableNext &&
    JSON.stringify(comparablePrevious) === JSON.stringify(comparableNext) &&
    typeof previousIndex.generated === 'string'
  ) {
    return {
      ...nextIndex,
      generated: previousIndex.generated,
    };
  }

  return {
    ...nextIndex,
    generated: fallbackGeneratedAt,
  };
}

export function serializeArtifactJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
