import { withDocsBasePath } from './docsBasePath.js';

/**
 * OpenAPI route contract shared by the React app and static artifact builders.
 * `routePrefix` is an explicit full public route override; otherwise the
 * route is derived from the configured docs page path.
 */

function normalizeRoutePath(value, fallback = '/') {
  const trimmed = String(value || '').trim();

  if (!trimmed) {
    return fallback;
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const normalized = withLeadingSlash.replace(/\/+/g, '/').replace(/\/+$/, '');

  return normalized || '/';
}

/** @param {{ pagePath?: string, routePrefix?: string }} config */
export function getOpenApiRoutePrefix(config = {}) {
  if (config.routePrefix) {
    return normalizeRoutePath(config.routePrefix);
  }

  const pagePath = normalizeRoutePath(config.pagePath || 'api-reference/openapi');
  return withDocsBasePath(pagePath);
}

/**
 * @param {{ pagePath?: string, routePrefix?: string, defaultSpecId?: string }} config
 * @param {string | null | undefined} specId
 */
export function buildOpenApiRoutePath(config = {}, specId) {
  const basePath = getOpenApiRoutePrefix(config);

  if (specId == null || specId === '' || specId === config.defaultSpecId) {
    return basePath;
  }

  return `${basePath}/${encodeURIComponent(String(specId))}`;
}

function slugifySegment(value, fallback = 'item') {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);

  return normalized || fallback;
}

export function createOpenApiRouteSuffix(value) {
  let hash = 2166136261;
  for (const character of String(value || '')) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36).slice(0, 8);
}

/**
 * Build the stable route used by generated operation artifacts. The optional
 * suffix is reserved for deterministic collision resolution by the generator.
 */
export function buildOpenApiOperationRoutePath(config = {}, specId, operation = {}, suffix = '') {
  const basePath = buildOpenApiRoutePath(config, specId);
  const tag = slugifySegment(operation.routeTag || operation.tags?.[0], 'untagged');
  const pathKey = slugifySegment(`${operation.method || 'operation'}-${operation.path || 'root'}`);
  const operationKey = slugifySegment(
    operation.id ||
      operation.operationId ||
      `${operation.method || 'operation'}-${operation.path || 'root'}`,
    'operation'
  );
  const collisionSuffix = suffix ? `-${slugifySegment(suffix, 'variant')}` : '';

  return `${basePath}/operations/${tag}/${pathKey}/${operationKey}${collisionSuffix}`;
}

export function buildOpenApiModelRoutePath(config = {}, specId, model = {}, suffix = '') {
  const basePath = buildOpenApiRoutePath(config, specId);
  const modelKey = slugifySegment(model.name, 'model');
  const collisionSuffix = suffix ? `-${slugifySegment(suffix, 'variant')}` : '';

  return `${basePath}/models/${modelKey}${collisionSuffix}`;
}
