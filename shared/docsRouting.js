import { documentationTree, i18nConfig, versionConfig } from './documentation-config.js';
import { getDefaultDocumentPath } from './seo.js';

function normalizeUniqueSegments(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean)
    )
  );
}

function getTopLevelRouteSegments(items = documentationTree) {
  const segments = new Set();

  for (const item of items) {
    const [firstSegment] = String(item.path || '')
      .split('/')
      .filter(Boolean);

    if (firstSegment) {
      segments.add(firstSegment);
    }
  }

  return Array.from(segments).sort();
}

function normalizeDocPath(path = '') {
  return String(path || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
}

function splitRouteSegments(path = '') {
  const normalized = normalizeDocPath(path);
  return normalized ? normalized.split('/').filter(Boolean) : [];
}

export function getVersioningState(config = versionConfig) {
  const versions = normalizeUniqueSegments(config?.versions);
  const current =
    typeof config?.current === 'string' && config.current.trim()
      ? config.current.trim()
      : versions[0] || null;
  const labels = config?.labels && typeof config.labels === 'object' ? config.labels : {};

  return {
    enabled: Boolean(config?.enabled),
    current,
    versions,
    labels,
  };
}

export function getI18nState(config = i18nConfig) {
  const locales = normalizeUniqueSegments(config?.locales);
  const defaultLocale =
    typeof config?.defaultLocale === 'string' && config.defaultLocale.trim()
      ? config.defaultLocale.trim()
      : locales[0] || null;

  return {
    enabled: Boolean(config?.enabled),
    defaultLocale,
    locales,
  };
}

export function getDocumentationFeatureValidationIssues(options = {}) {
  const items = options.documentationTree || documentationTree;
  const versioning = getVersioningState(options.versionConfig || versionConfig);
  const i18n = getI18nState(options.i18nConfig || i18nConfig);
  const issues = [];

  if (versioning.enabled) {
    if (versioning.versions.length === 0) {
      issues.push('`versionConfig.enabled` requires at least one entry in `versionConfig.versions`.');
    }

    if (!versioning.current) {
      issues.push('`versionConfig.enabled` requires `versionConfig.current` to be set.');
    } else if (!versioning.versions.includes(versioning.current)) {
      issues.push('`versionConfig.current` must also appear in `versionConfig.versions`.');
    }
  }

  if (i18n.enabled) {
    if (i18n.locales.length === 0) {
      issues.push('`i18nConfig.enabled` requires at least one entry in `i18nConfig.locales`.');
    }

    if (!i18n.defaultLocale) {
      issues.push('`i18nConfig.enabled` requires `i18nConfig.defaultLocale` to be set.');
    } else if (!i18n.locales.includes(i18n.defaultLocale)) {
      issues.push('`i18nConfig.defaultLocale` must also appear in `i18nConfig.locales`.');
    }
  }

  if (versioning.enabled && i18n.enabled) {
    const overlappingSegments = versioning.versions.filter((value) => i18n.locales.includes(value));

    if (overlappingSegments.length > 0) {
      issues.push(
        `Version and locale prefixes must be unique. Overlap: ${overlappingSegments.join(', ')}.`
      );
    }
  }

  const topLevelSegments = getTopLevelRouteSegments(items);
  const reservedSegments = new Set([
    ...(versioning.enabled ? versioning.versions : []),
    ...(i18n.enabled ? i18n.locales : []),
  ]);
  const conflictingSegments = topLevelSegments.filter((segment) => reservedSegments.has(segment));

  if (conflictingSegments.length > 0) {
    issues.push(
      `Top-level documentation paths conflict with enabled version/locale prefixes: ${conflictingSegments.join(', ')}.`
    );
  }

  return issues;
}

export function assertValidDocumentationFeatureConfig(options = {}) {
  const issues = getDocumentationFeatureValidationIssues(options);

  if (issues.length === 0) {
    return {
      versioning: getVersioningState(options.versionConfig || versionConfig),
      i18n: getI18nState(options.i18nConfig || i18nConfig),
    };
  }

  throw new Error(
    ['Invalid documentation feature config:', ...issues.map((issue) => `- ${issue}`)].join('\n')
  );
}

const defaultFeatureState = assertValidDocumentationFeatureConfig();

export const docsFeatureState = Object.freeze(defaultFeatureState);

function getFeatureState(options = {}) {
  return {
    versioning: options.versionConfig
      ? getVersioningState(options.versionConfig)
      : docsFeatureState.versioning,
    i18n: options.i18nConfig ? getI18nState(options.i18nConfig) : docsFeatureState.i18n,
  };
}

function resolvePrefixSegments(options = {}) {
  const { versioning, i18n } = getFeatureState(options);
  const segments = [];

  const includeVersion =
    options.includeVersion === undefined ? versioning.enabled : Boolean(options.includeVersion);
  const includeLocale =
    options.includeLocale === undefined ? i18n.enabled : Boolean(options.includeLocale);

  if (includeVersion) {
    const version = options.version || versioning.current;
    if (version) {
      segments.push(version);
    }
  }

  if (includeLocale) {
    const locale = options.locale || i18n.defaultLocale;
    if (locale) {
      segments.push(locale);
    }
  }

  return segments;
}

export function parseDocsRoutePath(slug = '', options = {}) {
  const { versioning, i18n } = getFeatureState(options);
  const segments = splitRouteSegments(slug);
  let index = 0;
  let routeVersion = null;
  let routeLocale = null;

  if (versioning.enabled && segments[index] && versioning.versions.includes(segments[index])) {
    routeVersion = segments[index];
    index += 1;
  }

  if (i18n.enabled && segments[index] && i18n.locales.includes(segments[index])) {
    routeLocale = segments[index];
    index += 1;
  }

  return {
    originalSlug: normalizeDocPath(slug),
    docPath: segments.slice(index).join('/'),
    routeVersion,
    routeLocale,
    activeVersion: versioning.enabled ? routeVersion || versioning.current : null,
    activeLocale: i18n.enabled ? routeLocale || i18n.defaultLocale : null,
    hasExplicitPrefix: index > 0,
  };
}

export function buildDocsPath(path = '', options = {}) {
  const normalizedPath = normalizeDocPath(path);
  const segments = ['docs', ...resolvePrefixSegments(options), ...splitRouteSegments(normalizedPath)];
  return `/${segments.join('/')}`;
}

export function buildCanonicalDocsPath(path = '', options = {}) {
  const { versioning, i18n } = getFeatureState(options);

  return buildDocsPath(path, {
    ...options,
    includeVersion: versioning.enabled,
    includeLocale: i18n.enabled,
  });
}

export function buildDocsRouteVariants(path = '', options = {}) {
  const normalizedPath = normalizeDocPath(path);
  const { versioning, i18n } = getFeatureState(options);
  const routePaths = new Set();

  routePaths.add(
    buildDocsPath(normalizedPath, {
      ...options,
      includeVersion: false,
      includeLocale: false,
    })
  );

  if (versioning.enabled) {
    for (const version of versioning.versions) {
      routePaths.add(
        buildDocsPath(normalizedPath, {
          ...options,
          version,
          includeVersion: true,
          includeLocale: false,
        })
      );
    }
  }

  if (i18n.enabled) {
    for (const locale of i18n.locales) {
      routePaths.add(
        buildDocsPath(normalizedPath, {
          ...options,
          locale,
          includeVersion: false,
          includeLocale: true,
        })
      );
    }
  }

  if (versioning.enabled || i18n.enabled) {
    for (const context of getDocsVariantContexts(options)) {
      routePaths.add(
        buildCanonicalDocsPath(normalizedPath, {
          ...options,
          version: context.version,
          locale: context.locale,
        })
      );
    }
  }

  return Array.from(routePaths);
}

export function buildDocsContentPath(path = '', options = {}) {
  const normalizedPath = normalizeDocPath(path);
  const variantKey = resolvePrefixSegments(options).join('/');

  return variantKey ? `${variantKey}/${normalizedPath}` : normalizedPath;
}

export function getDocsVariantContexts(options = {}) {
  const { versioning, i18n } = getFeatureState(options);
  const versions = versioning.enabled ? versioning.versions : [null];
  const locales = i18n.enabled ? i18n.locales : [null];

  return versions.flatMap((version) =>
    locales.map((locale) => ({
      version,
      locale,
      key: buildDocsContentPath('__placeholder__', {
        ...options,
        version,
        locale,
      }).replace(/(?:^|\/)__placeholder__$/, ''),
      isDefault:
        (!versioning.enabled || version === versioning.current) &&
        (!i18n.enabled || locale === i18n.defaultLocale),
    }))
  );
}

export function buildDocsLandingPath(path = getDefaultDocumentPath(), options = {}) {
  return buildCanonicalDocsPath(path || '', options);
}