import { buildCollectionContentPath, buildDocsContentPath } from '../../shared/docsRouting.js';
import { getCollectionArtifactPaths } from '../../shared/content-collections.js';
import { getContentCollection } from '../data/collections';
import {
  DEFAULT_DOCUMENT_PATH,
  documentationTree,
  findDirectoryDefaultPath,
} from './navigation.ts';
import { createLogger } from '../utils/logger.ts';
import { extractTopLevelMarkdownTitle, stripMarkdownBom } from '../utils/markdown.ts';

const logger = createLogger('Content');

export type DocumentContentFormat = 'markdown' | 'html';

export interface Document {
  path: string;
  content: string;
  title: string;
  description?: string;
  frontmatter?: Record<string, unknown>;
  sourcePath?: string;
  contentFormat?: DocumentContentFormat;
}

export interface DocumentBacklink {
  source: string;
  href: string;
  line: number;
  anchor?: string;
}

export interface DocumentVariantOptions {
  version?: string | null;
  locale?: string | null;
}

interface DocsIndexResponse {
  generated: string;
  paths: string[];
  count: number;
  titles?: Record<string, string>;
}

interface GeneratedDocumentResponse {
  path: string;
  content: string;
  title?: string;
  description?: string;
  frontmatter?: Record<string, unknown>;
  sourcePath?: string;
  contentFormat?: DocumentContentFormat;
}

interface DocumentReferenceGraphResponse {
  schemaVersion: number;
  backlinks?: Record<string, DocumentBacklink[]>;
}

const cachedContent = new Map<string, DocsIndexResponse>();
const cachedReferenceGraphs = new Map<string, DocumentReferenceGraphResponse>();
const cachedDocuments = new Map<string, Document | null>();
const pendingDocuments = new Map<string, Promise<Document | null>>();

export async function loadCollectionContent(collectionId = 'docs'): Promise<DocsIndexResponse> {
  const collection = getContentCollection(collectionId);
  const cached = cachedContent.get(collection.id);
  if (cached) {
    return cached;
  }

  try {
    const artifactPaths = getCollectionArtifactPaths(collection);
    const response = await fetch(artifactPaths.index);
    if (!response.ok) {
      throw new Error(`Failed to load docs index: ${response.status}`);
    }

    const docsIndex = (await response.json()) as DocsIndexResponse;
    cachedContent.set(collection.id, docsIndex);
    return docsIndex;
  } catch (error) {
    logger.error('Error loading documentation index:', error);
    return {
      generated: new Date().toISOString(),
      paths: [],
      count: 0,
      titles: {},
    };
  }
}

export async function loadDocsContent(): Promise<DocsIndexResponse> {
  return loadCollectionContent('docs');
}

async function loadDocumentReferenceGraph(
  collectionId = 'docs'
): Promise<DocumentReferenceGraphResponse | null> {
  const cached = cachedReferenceGraphs.get(collectionId);
  if (cached) {
    return cached;
  }

  try {
    const collection = getContentCollection(collectionId);
    const response = await fetch(getCollectionArtifactPaths(collection).references);
    if (!response.ok) {
      return null;
    }

    const graph = (await response.json()) as DocumentReferenceGraphResponse;
    if (graph.schemaVersion !== 1 || !graph.backlinks) {
      return null;
    }

    cachedReferenceGraphs.set(collectionId, graph);
    return graph;
  } catch {
    return null;
  }
}

export async function getDocumentBacklinks(
  path: string,
  collectionId = 'docs'
): Promise<DocumentBacklink[]> {
  const graph = await loadDocumentReferenceGraph(collectionId);
  return graph?.backlinks?.[path] || [];
}

function getDocumentAssetKey(
  path: string,
  options: DocumentVariantOptions = {},
  collectionId = 'docs'
): string {
  const collection = getContentCollection(collectionId);
  return collectionId === 'docs'
    ? buildDocsContentPath(path, {
        version: options.version,
        locale: options.locale,
      })
    : buildCollectionContentPath(collection, path, {
        version: options.version,
        locale: options.locale,
      });
}

function getDocumentAssetUrl(
  path: string,
  options: DocumentVariantOptions = {},
  collectionId = 'docs'
): string {
  const collection = getContentCollection(collectionId);
  const encodedPath = getDocumentAssetKey(path, options, collectionId)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${getCollectionArtifactPaths(collection).content}/${encodedPath}.json`;
}

async function fetchDocument(
  path: string,
  options: DocumentVariantOptions = {},
  collectionId = 'docs'
): Promise<Document | null> {
  const docsIndex = await loadCollectionContent(collectionId);

  if (!docsIndex.paths.includes(path)) {
    return null;
  }

  const response = await fetch(getDocumentAssetUrl(path, options, collectionId));
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    throw new Error(`Failed to load document ${path}: ${response.status}`);
  }

  const rawDocument = (await response.json()) as GeneratedDocumentResponse;
  const content = stripMarkdownBom(rawDocument.content ?? '');
  const title =
    rawDocument.title ??
    docsIndex.titles?.[path] ??
    extractTopLevelMarkdownTitle(content) ??
    path.split('/').pop() ??
    path;

  return {
    path: rawDocument.path || path,
    content,
    title,
    description: rawDocument.description,
    frontmatter: rawDocument.frontmatter,
    sourcePath: rawDocument.sourcePath,
    contentFormat: rawDocument.contentFormat || 'markdown',
  };
}

export function prefetchDocument(
  path: string,
  options: DocumentVariantOptions = {},
  collectionId = 'docs'
): void {
  if (typeof document === 'undefined') {
    return;
  }

  const href = getDocumentAssetUrl(path, options, collectionId);
  const existing = document.head.querySelector(`link[data-prefetch-doc="${href}"]`);
  if (existing) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'fetch';
  link.href = href;
  link.crossOrigin = 'anonymous';
  link.setAttribute('data-prefetch-doc', href);
  document.head.appendChild(link);
}

export async function getDocument(
  path: string,
  options: DocumentVariantOptions = {},
  collectionId = 'docs'
): Promise<Document | null> {
  const cacheKey = `${collectionId}:${getDocumentAssetKey(path, options, collectionId)}`;

  if (cachedDocuments.has(cacheKey)) {
    return cachedDocuments.get(cacheKey) ?? null;
  }

  const existingRequest = pendingDocuments.get(cacheKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = fetchDocument(path, options, collectionId)
    .then((document) => {
      cachedDocuments.set(cacheKey, document);
      pendingDocuments.delete(cacheKey);
      return document;
    })
    .catch((error) => {
      pendingDocuments.delete(cacheKey);
      logger.error(`Error loading documentation content for ${cacheKey}:`, error);
      throw error;
    });

  pendingDocuments.set(cacheKey, request);
  return request;
}

export function clearContentCache(): void {
  cachedContent.clear();
  cachedReferenceGraphs.clear();
  cachedDocuments.clear();
  pendingDocuments.clear();
}

export function resolveDocumentPath(slug: string | undefined, items = documentationTree): string {
  if (!slug) {
    return DEFAULT_DOCUMENT_PATH;
  }

  const directoryDefault = findDirectoryDefaultPath(slug, items);
  if (directoryDefault) {
    return directoryDefault;
  }

  return slug;
}

export { documentationTree };
