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
  return pagePath === '/' ? '/docs' : `/docs${pagePath}`;
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
