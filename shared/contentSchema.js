/**
 * The deliberately small, typed frontmatter contract shared by every native
 * documentation collection. Keeping this schema in shared/ means generators,
 * validation, and future collection adapters agree on the same boundary.
 */

/** @typedef {'string' | 'string[]' | 'boolean' | 'number'} FrontmatterFieldType */

/**
 * @typedef {Object} FrontmatterField
 * @property {FrontmatterFieldType} type
 * @property {boolean} [integer]
 */

/** @type {Record<string, FrontmatterField>} */
export const documentFrontmatterSchema = Object.freeze({
  title: { type: 'string' },
  description: { type: 'string' },
  tags: { type: 'string[]' },
  keywords: { type: 'string[]' },
  icon: { type: 'string' },
  order: { type: 'number', integer: true },
  draft: { type: 'boolean' },
  toc: { type: 'boolean' },
  full: { type: 'boolean' },
  sidebar: { type: 'boolean' },
});

export const DOCUMENT_FRONTMATTER_SCHEMA_VERSION = 1;

export function getFrontmatterSchemaKeys(schema = documentFrontmatterSchema) {
  return Object.keys(schema);
}
