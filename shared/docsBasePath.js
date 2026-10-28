/**
 * Where the docs live in the URL space. Set `docsRoutingConfig.basePath` in
 * shared/documentation-config.js: '/docs' (default), '/guide', or '' / '/'
 * to serve docs at the site root.
 */
import * as documentationConfig from './documentation-config.js';

export const DEFAULT_DOCS_BASE_PATH = '/docs';

/**
 * '/docs/' -> '/docs', '' or '/' -> '' (root), null/undefined -> '/docs'.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function normalizeDocsBasePath(value) {
  if (value === undefined || value === null) {
    return DEFAULT_DOCS_BASE_PATH;
  }
  const trimmed = String(value)
    .trim()
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '';
}

/** The configured docs base path: '/docs' by default, '' in root mode. */
export const docsBasePath = normalizeDocsBasePath(documentationConfig.docsRoutingConfig?.basePath);

/** @param {string} [basePath] */
export function getDocsBaseSegments(basePath = docsBasePath) {
  return basePath.split('/').filter(Boolean);
}

/**
 * Prefix a docs-relative path with the base path: 'a/b' -> '/docs/a/b' (or '/a/b').
 * @param {string} [path]
 * @param {string} [basePath]
 */
export function withDocsBasePath(path = '', basePath = docsBasePath) {
  const rest = String(path || '').replace(/^\/+|\/+$/g, '');
  if (!basePath) {
    return `/${rest}`;
  }
  return rest ? `${basePath}/${rest}` : basePath;
}

/**
 * The slug after the base path, or null when `pathname` is outside it.
 * In root mode every pathname is inside the docs space.
 * @param {string} pathname
 * @param {string} [basePath]
 */
export function stripDocsBasePath(pathname, basePath = docsBasePath) {
  const path = String(pathname || '/');
  if (!basePath) {
    return path.replace(/^\/+|\/+$/g, '');
  }
  if (path === basePath || path.startsWith(`${basePath}/`)) {
    return path.slice(basePath.length).replace(/^\/+|\/+$/g, '');
  }
  return null;
}
