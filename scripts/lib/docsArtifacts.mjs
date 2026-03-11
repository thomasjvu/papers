function stripUtf8Bom(content) {
  return content.replace(/^\uFEFF/, '');
}

export function extractTopLevelTitle(docPath, content) {
  const titleMatch = stripUtf8Bom(content).match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : docPath.split('/').pop() ?? docPath;
}

export function createDocsArtifacts(docsByPath, generatedAt = new Date().toISOString()) {
  const documents = {};
  const paths = Object.keys(docsByPath);

  for (const docPath of paths) {
    const content = stripUtf8Bom(docsByPath[docPath]);
    documents[docPath] = {
      path: docPath,
      title: extractTopLevelTitle(docPath, content),
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