/**
 * Content collections — multi-tree docs support.
 * Default install uses a single `docs` collection mapped to /docs routes.
 */

import { documentationTree } from './documentation-config.js';
import { documentFrontmatterSchema, DOCUMENT_FRONTMATTER_SCHEMA_VERSION } from './contentSchema.js';

/** @type {import('./docsRouting.js').ContentCollection[]} */
export const contentCollections = [
  {
    id: 'docs',
    label: 'Documentation',
    routePrefix: '/docs',
    contentDir: 'src/docs/content',
    tree: documentationTree,
    description: 'Primary documentation tree',
    schemaVersion: DOCUMENT_FRONTMATTER_SCHEMA_VERSION,
    frontmatterSchema: documentFrontmatterSchema,
  },
];

/** @param {string} id */
export function getContentCollection(id) {
  const collection = contentCollections.find((entry) => entry.id === id);
  if (!collection) {
    throw new Error(`Unknown content collection: ${id}`);
  }
  return collection;
}
