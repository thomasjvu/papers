import {
  buildCanonicalCollectionPath,
  buildCollectionContentPath,
  getCollectionVariantContexts,
} from '../../shared/docsRouting.js';

function stripUtf8Bom(content) {
  return content.replace(/^\uFEFF/, '');
}

function getTitle(docPath, content) {
  const titleMatch = stripUtf8Bom(content).match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : docPath;
}

export function stripSearchMarkdown(content = '') {
  return stripUtf8Bom(String(content))
    .replace(/^```[\s\S]*?^```$/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#+\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r?\n{2,}/g, '\n\n')
    .trim();
}

function createDocumentationRecord(collection, context, docPath, document, index) {
  const title =
    document.title || index.titles?.[docPath] || getTitle(docPath, document.content || '');
  const description = document.description || '';
  const searchableContent = stripSearchMarkdown(document.content || '');
  const variantParts = [context.version, context.locale].filter(Boolean);
  const collectionLabel = collection.label || collection.id;
  const content = [
    collectionLabel,
    collection.id,
    ...variantParts,
    title,
    description,
    searchableContent,
  ]
    .filter(Boolean)
    .join('\n\n');
  const meta = {
    title,
    kind: 'documentation',
    collection: collection.id,
    collectionLabel,
  };

  if (context.version) {
    meta.version = context.version;
  }

  if (context.locale) {
    meta.locale = context.locale;
  }

  return {
    key: `${collection.id}::${buildCanonicalCollectionPath(collection, docPath, context)}::${buildCollectionContentPath(collection, docPath, context)}`,
    record: {
      url: buildCanonicalCollectionPath(collection, docPath, context),
      content,
      language: context.locale || 'en',
      meta,
    },
  };
}

function createOpenApiRecords(openapiArtifacts) {
  const records = [];

  for (const spec of openapiArtifacts?.specs || []) {
    for (const operation of spec.operations || []) {
      const content = [
        `${operation.method} ${operation.path}`,
        operation.summary,
        operation.description,
        ...(operation.parameters || []).map(
          (parameter) => `${parameter.in} ${parameter.name} ${parameter.schema}`
        ),
        ...(operation.responses || []).map(
          (response) => `${response.status} ${response.description}`
        ),
        operation.codeSamples?.curl,
      ]
        .filter(Boolean)
        .join('\n');

      records.push({
        key: `openapi-operation::${operation.routePath}::${operation.method}::${operation.path}`,
        record: {
          url: operation.routePath,
          content,
          language: 'en',
          meta: {
            title: operation.summary || `${operation.method} ${operation.path}`,
            kind: 'openapi-operation',
          },
        },
      });
    }

    for (const model of spec.schemas || []) {
      records.push({
        key: `openapi-model::${model.routePath}::${model.name}`,
        record: {
          url: model.routePath,
          content: [
            model.name,
            model.description,
            model.typescript,
            ...(model.properties || []).map((property) => `${property.name} ${property.type}`),
          ]
            .filter(Boolean)
            .join('\n'),
          language: 'en',
          meta: { title: model.name, kind: 'openapi-model' },
        },
      });
    }
  }

  return records;
}

/**
 * Build deterministic Pagefind custom records from every configured collection
 * and the generated OpenAPI reference artifacts. The generated document map
 * is keyed by the same collection content path used by docs generation.
 */
export function createPagefindRecords({
  collections = [],
  artifactsByCollectionId = {},
  openapiArtifacts = null,
} = {}) {
  const records = [];
  const seenKeys = new Set();
  const orderedCollections = [...collections].sort((left, right) =>
    String(left.id).localeCompare(String(right.id))
  );

  const addRecord = ({ key, record }) => {
    if (seenKeys.has(key)) {
      return;
    }

    seenKeys.add(key);
    records.push(record);
  };

  for (const collection of orderedCollections) {
    const artifacts = artifactsByCollectionId[collection.id];
    if (!artifacts) {
      throw new Error(`Missing generated artifacts for content collection "${collection.id}".`);
    }

    const index = artifacts.index || {};
    if (!Array.isArray(index.paths)) {
      throw new Error(`Generated index for content collection "${collection.id}" is invalid.`);
    }

    for (const context of getCollectionVariantContexts(collection)) {
      for (const docPath of index.paths) {
        const artifactKey = buildCollectionContentPath(collection, docPath, context);
        const document = artifacts.documents?.[artifactKey];

        if (!document) {
          throw new Error(
            `Missing generated document for collection "${collection.id}": ${artifactKey}.`
          );
        }

        addRecord(createDocumentationRecord(collection, context, docPath, document, index));
      }
    }
  }

  for (const pagefindRecord of createOpenApiRecords(openapiArtifacts)) {
    addRecord(pagefindRecord);
  }

  return records;
}
