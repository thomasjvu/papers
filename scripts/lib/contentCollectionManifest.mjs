import { DOCUMENT_FRONTMATTER_SCHEMA_VERSION, documentFrontmatterSchema } from '../../shared/contentSchema.js';

/**
 * Build a stable, typed collection manifest for tooling and runtime consumers.
 * The existing docs-index.json remains intentionally small and backwards
 * compatible; this manifest is the richer native-collection contract.
 */
export function createContentCollectionManifest({ collection, index, documents }) {
  const entries = (index?.paths || []).map((path) => {
    const document = documents?.[path];

    return {
      path,
      title: document?.title || index?.titles?.[path] || path,
      description: document?.description || '',
      frontmatter: document?.frontmatter || {},
      metadata: document?.metadata || {},
      ...(document?.sourcePath ? { sourcePath: document.sourcePath } : {}),
    };
  });

  return {
    schemaVersion: collection?.schemaVersion || DOCUMENT_FRONTMATTER_SCHEMA_VERSION,
    collection: collection?.id || 'docs',
    generated: index?.generated || null,
    count: entries.length,
    schema: collection?.frontmatterSchema || documentFrontmatterSchema,
    navigation: collection?.tree || [],
    entries,
  };
}
