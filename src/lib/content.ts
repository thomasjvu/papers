import { buildDocsContentPath } from '../../shared/docsRouting.js';
import {
  DEFAULT_DOCUMENT_PATH,
  documentationTree,
  findDirectoryDefaultPath,
} from './navigation.ts';
import { createLogger } from '../utils/logger.ts';
import { extractTopLevelMarkdownTitle, stripMarkdownBom } from '../utils/markdown.ts';

const logger = createLogger('Content');

export interface Document {
  path: string;
  content: string;
  title: string;
  description?: string;
  frontmatter?: Record<string, unknown>;
  sourcePath?: string;
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
}

let cachedContent: DocsIndexResponse | null = null;
const cachedDocuments = new Map<string, Document | null>();
const pendingDocuments = new Map<string, Promise<Document | null>>();

export async function loadDocsContent(): Promise<DocsIndexResponse> {
  if (cachedContent) {
    return cachedContent;
  }

  try {
    const response = await fetch('/docs-index.json');
    if (!response.ok) {
      throw new Error(`Failed to load docs index: ${response.status}`);
    }

    const docsIndex = (await response.json()) as DocsIndexResponse;
    cachedContent = docsIndex;
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

function getDocumentAssetKey(path: string, options: DocumentVariantOptions = {}): string {
  return buildDocsContentPath(path, {
    version: options.version,
    locale: options.locale,
  });
}

function getDocumentAssetUrl(path: string, options: DocumentVariantOptions = {}): string {
  const encodedPath = getDocumentAssetKey(path, options)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `/docs-content/${encodedPath}.json`;
}

async function fetchDocument(path: string, options: DocumentVariantOptions = {}): Promise<Document | null> {
  const docsIndex = await loadDocsContent();

  if (!docsIndex.paths.includes(path)) {
    return null;
  }

  const response = await fetch(getDocumentAssetUrl(path, options));
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
  };
}

export async function getDocument(
  path: string,
  options: DocumentVariantOptions = {}
): Promise<Document | null> {
  const cacheKey = getDocumentAssetKey(path, options);

  if (cachedDocuments.has(cacheKey)) {
    return cachedDocuments.get(cacheKey) ?? null;
  }

  const existingRequest = pendingDocuments.get(cacheKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = fetchDocument(path, options)
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
  cachedContent = null;
  cachedDocuments.clear();
  pendingDocuments.clear();
}

export function resolveDocumentPath(slug: string | undefined): string {
  if (!slug) {
    return DEFAULT_DOCUMENT_PATH;
  }

  const directoryDefault = findDirectoryDefaultPath(slug, documentationTree);
  if (directoryDefault) {
    return directoryDefault;
  }

  return slug;
}

export { documentationTree };