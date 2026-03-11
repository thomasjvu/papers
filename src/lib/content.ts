import {
  documentationTree,
  findDirectoryDefaultPath,
  findFirstDocumentPath,
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

function getDocumentAssetUrl(path: string): string {
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `/docs-content/${encodedPath}.json`;
}

async function fetchDocument(path: string): Promise<Document | null> {
  const docsIndex = await loadDocsContent();

  if (!docsIndex.paths.includes(path)) {
    return null;
  }

  const response = await fetch(getDocumentAssetUrl(path));
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
  };
}

export async function getDocument(path: string): Promise<Document | null> {
  if (cachedDocuments.has(path)) {
    return cachedDocuments.get(path) ?? null;
  }

  const existingRequest = pendingDocuments.get(path);
  if (existingRequest) {
    return existingRequest;
  }

  const request = fetchDocument(path)
    .then((document) => {
      cachedDocuments.set(path, document);
      pendingDocuments.delete(path);
      return document;
    })
    .catch((error) => {
      pendingDocuments.delete(path);
      logger.error(`Error loading documentation content for ${path}:`, error);
      throw error;
    });

  pendingDocuments.set(path, request);
  return request;
}

export function clearContentCache(): void {
  cachedContent = null;
  cachedDocuments.clear();
  pendingDocuments.clear();
}

export const DEFAULT_DOCUMENT_PATH =
  findFirstDocumentPath(documentationTree) || 'getting-started/introduction';

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
