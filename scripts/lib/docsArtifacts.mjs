import { extractDescriptionFromMarkdown } from '../../shared/seo.js';

function stripUtf8Bom(content) {
  return content.replace(/^\uFEFF/, '');
}

function parseFrontmatter(content) {
  const normalized = stripUtf8Bom(content);
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    return {
      body: normalized,
      frontmatter: {},
    };
  }

  const body = normalized.slice(match[0].length).replace(/^\r?\n/, '');
  const frontmatter = {};

  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (key) {
      frontmatter[key] = value;
    }
  }

  return {
    body,
    frontmatter,
  };
}

function normalizeIndex(index) {
  if (!index || !Array.isArray(index.paths) || typeof index.titles !== 'object' || index.titles === null) {
    return null;
  }

  return {
    paths: index.paths,
    count: index.count,
    titles: index.titles,
  };
}

export function extractTopLevelTitle(docPath, content) {
  const { body, frontmatter } = parseFrontmatter(content);
  const titleMatch = body.match(/^#\s+(.+)$/m);
  return titleMatch
    ? titleMatch[1].trim()
    : frontmatter.title || docPath.split('/').pop() || docPath;
}

export function createDocumentArtifact(docPath, rawContent, sourcePath) {
  const { body, frontmatter } = parseFrontmatter(rawContent);
  const content = stripUtf8Bom(body);
  const description = frontmatter.description || extractDescriptionFromMarkdown(content);

  return {
    path: docPath,
    title: extractTopLevelTitle(docPath, rawContent),
    description: description || undefined,
    frontmatter,
    content,
    ...(sourcePath
      ? {
          sourcePath,
        }
      : {}),
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