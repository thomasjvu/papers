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

export function extractTopLevelTitle(docPath, content) {
  const { body, frontmatter } = parseFrontmatter(content);
  const titleMatch = body.match(/^#\s+(.+)$/m);
  return titleMatch
    ? titleMatch[1].trim()
    : frontmatter.title || docPath.split('/').pop() || docPath;
}

export function createDocsArtifacts(docsByPath, generatedAt = new Date().toISOString()) {
  const documents = {};
  const paths = Object.keys(docsByPath);

  for (const docPath of paths) {
    const { body, frontmatter } = parseFrontmatter(docsByPath[docPath]);
    const content = stripUtf8Bom(body);
    documents[docPath] = {
      path: docPath,
      title: extractTopLevelTitle(docPath, docsByPath[docPath]),
      description: frontmatter.description,
      frontmatter,
      content,
    };
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
