/**
 * Content collections — multi-tree docs support.
 * Default install uses a single `docs` collection mapped to /docs routes.
 */

import {
  documentationTree,
  frameworkDocPaths,
  i18nConfig,
  versionConfig,
} from './documentation-config.js';
import {
  createContentSchemaAdapter,
  documentContentSchema,
  documentFrontmatterSchema,
  DOCUMENT_FRONTMATTER_SCHEMA_VERSION,
} from './contentSchema.js';
import { normalizeMdxComponentNames, SUPPORTED_MDX_COMPONENT_NAMES } from './mdxComponents.js';

export const CONTENT_COLLECTION_CONTRACT_VERSION = 1;

const COLLECTION_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

function normalizeRoutePrefix(value) {
  const raw = String(value || '').trim();
  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const normalized = withLeadingSlash.replace(/\/+/g, '/').replace(/\/+$|^\/+/g, '');

  return normalized ? `/${normalized}` : '';
}

function normalizeRelativePath(value) {
  return String(value || '')
    .trim()
    .replaceAll('\\', '/')
    .replace(/^\.\//, '')
    .replace(/\/+$/, '');
}

function isSafeRelativePath(value) {
  const normalized = normalizeRelativePath(value);
  return Boolean(
    normalized &&
      !normalized.startsWith('/') &&
      normalized !== '..' &&
      !normalized.startsWith('../') &&
      !normalized.split('/').includes('..')
  );
}

function normalizeArtifactNamespace(value, fallback) {
  const normalized = normalizeRelativePath(value || fallback);
  return normalized;
}

export function getCollectionSchemaAdapter(collection) {
  return collection?.schemaAdapter || collection?.schema || documentContentSchema;
}

export function getCollectionFrontmatterSchema(collection) {
  const adapter = getCollectionSchemaAdapter(collection);
  return adapter?.kind === 'papers-content-schema'
    ? adapter.fields
    : adapter || documentFrontmatterSchema;
}

export function getCollectionVariants(collection) {
  return {
    versionConfig: collection?.variants?.versionConfig || versionConfig,
    i18nConfig: collection?.variants?.i18nConfig || i18nConfig,
  };
}

export function getCollectionArtifactPaths(collection) {
  const namespace = collection?.artifactNamespace || collection?.id || 'docs';
  return Object.freeze({
    index: `/${namespace}-index.json`,
    content: `/${namespace}-content`,
    manifest: `/${namespace}-collection.json`,
    references: `/${namespace}-references.json`,
  });
}

export function getCollectionRoutePrefix(collection) {
  return normalizeRoutePrefix(collection?.routePrefix || '/docs');
}

function validateSchemaAdapter(collection, issues) {
  const adapter = getCollectionSchemaAdapter(collection);
  if (!adapter || typeof adapter !== 'object' || Array.isArray(adapter)) {
    issues.push('schemaAdapter must be a declarative object.');
    return;
  }

  if (adapter.kind !== 'papers-content-schema') {
    issues.push('schemaAdapter.kind must be "papers-content-schema".');
  }

  if (!Number.isInteger(adapter.version) || adapter.version < 1) {
    issues.push('schemaAdapter.version must be a positive integer.');
  }

  if (!adapter.fields || typeof adapter.fields !== 'object' || Array.isArray(adapter.fields)) {
    issues.push('schemaAdapter.fields must be an object.');
  }

  if (adapter.unknownFields !== 'reject') {
    issues.push('schemaAdapter.unknownFields must be "reject".');
  }
}

export function validateContentCollection(collection, { rootDir } = {}) {
  const issues = [];
  const id = String(collection?.id || '').trim();
  const label = String(collection?.label || '').trim();
  const routePrefix = getCollectionRoutePrefix(collection);
  const contentDir = normalizeRelativePath(collection?.contentDir || 'src/docs/content');
  const artifactNamespace = normalizeArtifactNamespace(collection?.artifactNamespace, id || 'docs');

  if (!COLLECTION_ID_PATTERN.test(id)) {
    issues.push('id must match /^[a-z][a-z0-9-]*$/.');
  }
  if (!label) {
    issues.push('label must be a non-empty string.');
  }
  if (!routePrefix || routePrefix.includes('?') || routePrefix.includes('#')) {
    issues.push('routePrefix must be a clean non-empty URL path.');
  }
  if (!isSafeRelativePath(contentDir)) {
    issues.push('contentDir must be a repository-relative path that cannot escape the root.');
  }
  if (!COLLECTION_ID_PATTERN.test(artifactNamespace)) {
    issues.push('artifactNamespace must match /^[a-z][a-z0-9-]*$/.');
  }
  if (!Array.isArray(collection?.tree)) {
    issues.push('tree must be an array of navigation items.');
  }
  if (!Number.isInteger(collection?.schemaVersion) || collection.schemaVersion < 1) {
    issues.push('schemaVersion must be a positive integer.');
  }

  try {
    const mdxComponents = normalizeMdxComponentNames(collection?.mdxComponents);
    for (const name of mdxComponents) {
      if (!SUPPORTED_MDX_COMPONENT_NAMES.includes(name)) {
        issues.push(`mdxComponents contains unsupported component "${name}".`);
      }
    }
  } catch (error) {
    issues.push(error.message);
  }

  validateSchemaAdapter(collection, issues);

  if (rootDir && !isSafeRelativePath(contentDir)) {
    issues.push(`contentDir for collection "${id || '<missing>'}" is outside ${rootDir}.`);
  }

  return issues;
}

export function validateContentCollections(collections = contentCollections, options = {}) {
  const entries = Array.isArray(collections) ? collections : [];
  const issues = [];
  const ids = new Map();
  const namespaces = new Map();

  for (const collection of entries) {
    const collectionId = collection?.id || '<missing>';
    for (const issue of validateContentCollection(collection, options)) {
      issues.push(`Collection "${collectionId}": ${issue}`);
    }

    if (ids.has(collection?.id)) {
      issues.push(
        `Duplicate collection id "${collection?.id}" for collections "${ids.get(collection?.id)}" and "${collectionId}".`
      );
    } else {
      ids.set(collection?.id, collectionId);
    }

    const namespace = collection?.artifactNamespace || collection?.id;
    if (namespaces.has(namespace)) {
      issues.push(
        `Duplicate artifact namespace "${namespace}" for collections "${namespaces.get(namespace)}" and "${collectionId}".`
      );
    } else {
      namespaces.set(namespace, collectionId);
    }
  }

  for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
    const left = entries[leftIndex];
    const leftPrefix = getCollectionRoutePrefix(left);
    const leftRoot = normalizeRelativePath(left?.contentDir || 'src/docs/content');

    for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
      const right = entries[rightIndex];
      const rightPrefix = getCollectionRoutePrefix(right);
      const rightRoot = normalizeRelativePath(right?.contentDir || 'src/docs/content');
      const prefixesOverlap =
        leftPrefix === rightPrefix ||
        leftPrefix.startsWith(`${rightPrefix}/`) ||
        rightPrefix.startsWith(`${leftPrefix}/`);

      if (prefixesOverlap) {
        issues.push(
          `Overlapping route prefixes "${left.id}" (${leftPrefix}) and "${right.id}" (${rightPrefix}).`
        );
      }

      if (
        leftRoot === rightRoot ||
        leftRoot.startsWith(`${rightRoot}/`) ||
        rightRoot.startsWith(`${leftRoot}/`)
      ) {
        issues.push(
          `Ambiguous content roots "${left.id}" (${leftRoot}) and "${right.id}" (${rightRoot}).`
        );
      }
    }
  }

  if (issues.length > 0) {
    throw new Error(
      ['Invalid content collection config:', ...issues.map((issue) => `- ${issue}`)].join('\n')
    );
  }

  return [...entries].sort((left, right) => left.id.localeCompare(right.id));
}

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
    schemaAdapter: documentContentSchema,
    frontmatterSchema: documentFrontmatterSchema,
    variants: { versionConfig, i18nConfig },
    artifactNamespace: 'docs',
    frameworkDocPaths,
    frameworkContentDir: 'src/docs/content',
    mdxComponents: [...SUPPORTED_MDX_COMPONENT_NAMES],
  },
];

validateContentCollections(contentCollections);

/** @param {string} id */
export function getContentCollection(id) {
  const collection = contentCollections.find((entry) => entry.id === id);
  if (!collection) {
    throw new Error(`Unknown content collection: ${id}`);
  }
  return collection;
}
