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
  // ISO 8601 date that overrides the git-derived "Last updated" time.
  lastUpdated: { type: 'string' },
});

export const DOCUMENT_FRONTMATTER_SCHEMA_VERSION = 1;

export const CONTENT_SCHEMA_ADAPTER_KIND = 'papers-content-schema';

/**
 * Create a declarative schema adapter. Adapters contain no executable
 * consumer hooks; the shared parser owns parsing, diagnostics, defaults, and
 * serialization so the build remains bounded and deterministic.
 */
export function createContentSchemaAdapter({
  version = DOCUMENT_FRONTMATTER_SCHEMA_VERSION,
  fields = documentFrontmatterSchema,
  unknownFields = 'reject',
} = {}) {
  if (!Number.isInteger(version) || version < 1) {
    throw new Error('Content schema adapter version must be a positive integer.');
  }

  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    throw new Error('Content schema adapter fields must be an object.');
  }

  if (unknownFields !== 'reject') {
    throw new Error('Content schema adapters currently support only unknownFields: reject.');
  }

  return Object.freeze({
    kind: CONTENT_SCHEMA_ADAPTER_KIND,
    version,
    fields: Object.freeze({ ...fields }),
    unknownFields,
  });
}

export const documentContentSchema = createContentSchemaAdapter();

export function getContentSchemaFields(schema = documentFrontmatterSchema) {
  if (schema?.kind === CONTENT_SCHEMA_ADAPTER_KIND) {
    return schema.fields;
  }

  return schema || documentFrontmatterSchema;
}

export function getContentSchemaVersion(schema = documentContentSchema) {
  return schema?.kind === CONTENT_SCHEMA_ADAPTER_KIND
    ? schema.version
    : DOCUMENT_FRONTMATTER_SCHEMA_VERSION;
}

export function getFrontmatterSchemaKeys(schema = documentFrontmatterSchema) {
  return Object.keys(getContentSchemaFields(schema));
}
