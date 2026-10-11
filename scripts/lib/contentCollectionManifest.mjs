import {
  DOCUMENT_FRONTMATTER_SCHEMA_VERSION,
  documentFrontmatterSchema,
  getContentSchemaFields,
  getContentSchemaVersion,
} from '../../shared/contentSchema.js';
import {
  getCollectionArtifactPaths,
  getCollectionVariants,
} from '../../shared/content-collections.js';

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
    contractVersion: 1,
    schemaVersion:
      collection?.schemaVersion ||
      getContentSchemaVersion(collection?.schemaAdapter) ||
      DOCUMENT_FRONTMATTER_SCHEMA_VERSION,
    collection: collection?.id || 'docs',
    label: collection?.label || 'Documentation',
    routePrefix: collection?.routePrefix || '/docs',
    artifactNamespace: collection?.artifactNamespace || collection?.id || 'docs',
    artifacts: getCollectionArtifactPaths(collection),
    generated: index?.generated || null,
    count: entries.length,
    schema: getContentSchemaFields(
      collection?.schemaAdapter || collection?.frontmatterSchema || documentFrontmatterSchema
    ),
    variants: getCollectionVariants(collection),
    navigation: collection?.tree || [],
    entries,
  };
}

export function createContentCollectionsManifest({ collections, manifests }) {
  return {
    contractVersion: 1,
    schemaVersion: 1,
    generated:
      collections
        .map((collection) => manifests?.[collection.id]?.generated || null)
        .filter(Boolean)
        .sort()
        .at(-1) || null,
    collections: collections.map((collection) => ({
      id: collection.id,
      label: collection.label,
      routePrefix: collection.routePrefix,
      artifactNamespace: collection.artifactNamespace || collection.id,
      artifacts: getCollectionArtifactPaths(collection),
      schemaVersion: manifests?.[collection.id]?.schemaVersion || collection.schemaVersion,
      count: manifests?.[collection.id]?.count || 0,
    })),
  };
}
