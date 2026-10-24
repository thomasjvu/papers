import {
  buildCanonicalCollectionPath,
  buildCollectionContentPath,
  getCollectionVariantContexts,
} from '../../shared/docsRouting.js';
import { scanDocumentHeadings } from './docsArtifacts.mjs';

/** Heading depths that start their own search result (h2/h3, like Algolia DocSearch lvl2/lvl3). */
const SECTION_DEPTHS = new Set([2, 3]);

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

/**
 * Split a Markdown body into an intro (text before the first h2/h3) and one
 * section per h2/h3 heading. Section ids come from the same heading scanner as
 * the page TOC, so `route#id` lands on the rendered heading.
 */
export function splitSearchSections(content = '') {
  const lines = stripUtf8Bom(String(content)).split(/\r?\n/);
  const headings = scanDocumentHeadings(lines.join('\n')).filter((heading) =>
    SECTION_DEPTHS.has(heading.depth)
  );
  const intro = lines.slice(0, headings[0]?.line ?? lines.length).join('\n');
  const sections = headings.map((heading, position) => ({
    id: heading.id,
    title: heading.text,
    depth: heading.depth,
    body: lines.slice(heading.endLine + 1, headings[position + 1]?.line ?? lines.length).join('\n'),
  }));
  return { intro, sections };
}

function createDocumentationRecord(collection, context, docPath, document, index) {
  const title =
    document.title || index.titles?.[docPath] || getTitle(docPath, document.content || '');
  const description = document.description || '';
  const { intro, sections } = splitSearchSections(document.content || '');
  const variantParts = [context.version, context.locale].filter(Boolean);
  const collectionLabel = collection.label || collection.id;
  const url = buildCanonicalCollectionPath(collection, docPath, context);
  const contentPath = buildCollectionContentPath(collection, docPath, context);
  const baseMeta = {
    kind: 'documentation',
    collection: collection.id,
    collectionLabel,
    ...(context.version ? { version: context.version } : {}),
    ...(context.locale ? { locale: context.locale } : {}),
  };
  // Pagefind filters: the client limits results to the reader's version
  // and locale and supports `docs:` / `api:` scopes (src/lib/searchRanking.ts).
  const filters = {
    section: ['docs'],
    collection: [collection.id],
    ...(context.version ? { version: [context.version] } : {}),
    ...(context.locale ? { locale: [context.locale] } : {}),
  };
  const language = context.locale || 'en';

  const pageRecord = {
    key: `${collection.id}::${url}::${contentPath}`,
    record: {
      url,
      content: [
        collectionLabel,
        collection.id,
        ...variantParts,
        title,
        description,
        stripSearchMarkdown(intro),
      ]
        .filter(Boolean)
        .join('\n\n'),
      language,
      meta: { title, ...baseMeta },
      filters,
    },
  };

  const sectionRecords = sections
    .map((section) => ({ ...section, text: stripSearchMarkdown(section.body) }))
    .map((section) => ({
      key: `${collection.id}::${url}#${section.id}::${contentPath}`,
      record: {
        url: `${url}#${section.id}`,
        content: [section.title, section.text].filter(Boolean).join('\n\n'),
        language,
        meta: { title: section.title, page: title, anchor: section.id, ...baseMeta },
        filters,
      },
    }));

  return [pageRecord, ...sectionRecords];
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
          filters: { section: ['api'] },
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
          filters: { section: ['api'] },
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

        for (const pagefindRecord of createDocumentationRecord(
          collection,
          context,
          docPath,
          document,
          index
        )) {
          addRecord(pagefindRecord);
        }
      }
    }
  }

  for (const pagefindRecord of createOpenApiRecords(openapiArtifacts)) {
    addRecord(pagefindRecord);
  }

  return records;
}
