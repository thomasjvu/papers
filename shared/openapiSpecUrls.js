const SAFE_LOCAL_PREFIX = '/';

function fail(message) {
  throw new Error(message);
}

function normalizeOrigin(value) {
  if (typeof value !== 'string' || !value.trim()) {
    fail('OpenAPI allowed origins must contain non-empty strings.');
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    fail('OpenAPI allowed origin is not a valid URL: ' + value);
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    fail('OpenAPI allowed origins must be HTTPS origins without paths or credentials: ' + value);
  }

  return url.origin;
}

export function normalizeOpenApiAllowedOrigins(origins = []) {
  if (!Array.isArray(origins)) {
    fail('openapiConfig.allowedOrigins must be an array.');
  }

  return Array.from(new Set(origins.map(normalizeOrigin))).sort();
}

export function normalizeLocalOpenApiPath(value) {
  if (
    typeof value !== 'string' ||
    !value.startsWith(SAFE_LOCAL_PREFIX) ||
    value.startsWith('//') ||
    value.includes('?') ||
    value.includes('#') ||
    value.includes('\\')
  ) {
    fail(
      'Local OpenAPI specs must be root-relative paths without query, hash, protocol-relative, or traversal syntax: ' +
        value
    );
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(value);
  } catch {
    fail('OpenAPI local spec path is not valid URI syntax: ' + value);
  }

  const segments = decodedPath.split('/');
  if (segments.includes('..') || segments.includes('.')) {
    fail('OpenAPI local spec paths cannot contain dot segments: ' + value);
  }

  return value;
}

export function validateOpenApiSpecUrl(value, config = {}) {
  if (typeof value !== 'string' || !value.trim()) {
    fail('OpenAPI spec url must be a non-empty string.');
  }

  const url = value.trim();

  if (url.startsWith(SAFE_LOCAL_PREFIX) && !url.startsWith('//')) {
    return {
      kind: 'local',
      value: normalizeLocalOpenApiPath(url),
    };
  }

  if (url.startsWith('//')) {
    fail('Protocol-relative OpenAPI spec URLs are not allowed: ' + value);
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    fail('OpenAPI spec url is not a valid URL or root-relative path: ' + value);
  }

  const allowedOrigins = normalizeOpenApiAllowedOrigins(config.allowedOrigins || []);

  if (parsed.protocol !== 'https:') {
    fail('Remote OpenAPI spec URLs must use HTTPS: ' + value);
  }

  if (parsed.username || parsed.password || parsed.hash) {
    fail('Remote OpenAPI spec URLs cannot contain credentials or fragments: ' + value);
  }

  if (!allowedOrigins.includes(parsed.origin)) {
    fail('OpenAPI spec origin is not allowlisted: ' + parsed.origin);
  }

  return {
    kind: 'remote',
    value: parsed.toString(),
    origin: parsed.origin,
  };
}

export function getOpenApiSpecUrl(spec, config = {}) {
  return validateOpenApiSpecUrl(spec?.url, config).value;
}

export function assertValidOpenApiConfig(config = {}) {
  if (!config || typeof config !== 'object') {
    fail('openapiConfig must be an object.');
  }

  const specs = Array.isArray(config.specs) ? config.specs : [];
  const ids = specs.map((spec) => String(spec?.id || '').trim());
  const duplicateIds = ids.filter((id, index) => id && ids.indexOf(id) !== index);

  if (config.enabled && specs.length === 0) {
    fail('Enabled OpenAPI configuration requires at least one spec.');
  }

  if (ids.some((id) => !id)) {
    fail('OpenAPI spec ids must be non-empty strings.');
  }

  if (duplicateIds.length > 0) {
    fail('OpenAPI spec ids must be unique: ' + Array.from(new Set(duplicateIds)).join(', ') + '.');
  }

  if (config.enabled && !ids.includes(config.defaultSpecId)) {
    fail('OpenAPI defaultSpecId must match one configured spec id.');
  }

  const allowedOrigins = normalizeOpenApiAllowedOrigins(config.allowedOrigins || []);
  specs.forEach((spec) => validateOpenApiSpecUrl(spec.url, { allowedOrigins }));

  return {
    ...config,
    allowedOrigins,
  };
}
