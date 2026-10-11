import {
  getCollectionArtifactPaths,
  getCollectionRoutePrefix,
} from '../../shared/content-collections.js';
import {
  buildCollectionContentPath,
  getCollectionRoutingOptions,
  parseCollectionRoutePath,
} from '../../shared/docsRouting.js';
import { openapiConfig } from '../../shared/documentation-config.js';
import { getOpenApiRoutePrefix } from '../../shared/openapiRouting.js';

const ASSET_PATH_PATTERN = /^assets\/([A-Za-z0-9][A-Za-z0-9._-]*\.js)$/;
const DOCS_CHUNK_PATTERN = /^DocsPage-[A-Za-z0-9._-]+\.js$/;
const OPENAPI_CHUNK_PATTERN = /^OpenApiPage-[A-Za-z0-9._-]+\.js$/;
const OPENAPI_ROUTE_KIND_PATTERN = /^openapi(?:-|$)/;
const OPENAPI_ROUTE_PREFIX = getOpenApiRoutePrefix(openapiConfig);
const HOSTED_AGENT_ALIASES = new Set(['llms', 'skill']);

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeRoutePath(value) {
  const routePath = String(value || '').trim();

  if (!routePath || !routePath.startsWith('/') || /[?#\\]/.test(routePath)) {
    return null;
  }

  return routePath.replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/';
}

function normalizeAssetPath(value) {
  const rawValue = String(value || '')
    .trim()
    .replace(/^\/+/, '');
  const assetPath = rawValue.startsWith('assets/') ? rawValue : `assets/${rawValue}`;
  const match = ASSET_PATH_PATTERN.exec(assetPath);

  return match ? { assetPath, fileName: match[1] } : null;
}

function resolveRouteChunk(assetFiles, pattern, label, routePath) {
  const candidates = assetFiles
    .map(normalizeAssetPath)
    .filter(Boolean)
    .filter(({ fileName }) => pattern.test(fileName));

  if (candidates.length !== 1) {
    throw new Error(
      `Unable to resolve ${label} route chunk for "${routePath}": expected exactly one built assets/${label}-*.js file, found ${candidates.length}.`
    );
  }

  return `/${candidates[0].assetPath}`;
}

function encodeDocumentKey(documentKey, routePath) {
  const normalizedKey = String(documentKey || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  const segments = normalizedKey.split('/');

  if (
    !normalizedKey ||
    segments.some(
      (segment) =>
        !segment ||
        segment === '.' ||
        segment === '..' ||
        segment.includes('\\') ||
        segment.includes('?') ||
        segment.includes('#')
    )
  ) {
    throw new Error(
      `Unable to map document preload for "${routePath}": generated document key is unsafe.`
    );
  }

  return segments.map((segment) => encodeURIComponent(segment)).join('/');
}

function getDocumentHref(collection, documentKey, routePath) {
  const contentPath = String(getCollectionArtifactPaths(collection).content || '');

  if (!/^\/[A-Za-z0-9][A-Za-z0-9_-]*$/.test(contentPath)) {
    throw new Error(
      `Unable to map document preload for "${routePath}": collection content artifact path is unsafe.`
    );
  }

  return `${contentPath}/${encodeDocumentKey(documentKey, routePath)}.json`;
}

function createLinkTag({ rel, href, as, crossOrigin = false, fetchPriority }) {
  const attributes = [`rel="${escapeAttribute(rel)}"`];

  if (as) {
    attributes.push(`as="${escapeAttribute(as)}"`);
  }
  if (crossOrigin) {
    attributes.push('crossorigin');
  }
  if (fetchPriority) {
    attributes.push(`fetchpriority="${escapeAttribute(fetchPriority)}"`);
  }
  attributes.push(`href="${escapeAttribute(href)}"`);

  return `<link ${attributes.join(' ')} />`;
}

export function planHomepagePreloads({ artwork } = {}) {
  const artworkPath = normalizeRoutePath(artwork?.src);
  if (!artworkPath) {
    return '';
  }

  return createLinkTag({
    rel: 'preload',
    as: 'image',
    fetchPriority: 'high',
    href: artworkPath,
  });
}

function isHostedAgentDocument(docPath) {
  return HOSTED_AGENT_ALIASES.has(String(docPath || '').replace(/^\/+|\/+$/g, ''));
}

function isOpenApiRoute({ routePath, canonicalPath, routeKind }) {
  if (OPENAPI_ROUTE_KIND_PATTERN.test(routeKind)) {
    return true;
  }

  return [routePath, canonicalPath].some(
    (path) => path === OPENAPI_ROUTE_PREFIX || path.startsWith(`${OPENAPI_ROUTE_PREFIX}/`)
  );
}

function findDocumentRoute({ routePath, canonicalPath, collections, documentKey }) {
  const candidates = [];

  for (const collection of Array.isArray(collections) ? collections : []) {
    const routePrefix = getCollectionRoutePrefix(collection);
    if (canonicalPath !== routePrefix && !canonicalPath.startsWith(`${routePrefix}/`)) {
      continue;
    }

    const routingOptions = getCollectionRoutingOptions(collection);
    const routeContext = parseCollectionRoutePath(collection, canonicalPath, routingOptions);
    candidates.push({ collection, routeContext });
  }

  if (candidates.length > 1) {
    throw new Error(
      `Unable to map document preload for "${routePath}": canonical route matches multiple content collections.`
    );
  }

  if (candidates.length === 0) {
    return null;
  }

  const [{ collection, routeContext }] = candidates;
  if (!routeContext.docPath) {
    throw new Error(
      `Unable to map document preload for "${routePath}": canonical route has no document path.`
    );
  }

  if (isHostedAgentDocument(routeContext.docPath)) {
    return null;
  }

  const routingOptions = getCollectionRoutingOptions(collection);
  const generatedDocumentKey =
    documentKey ||
    buildCollectionContentPath(collection, routeContext.docPath, {
      ...routingOptions,
      version: routeContext.activeVersion,
      locale: routeContext.activeLocale,
    });

  return { collection, documentKey: generatedDocumentKey };
}

/**
 * Plan route-specific, same-origin preloads from the current built asset set.
 * The planner is intentionally pure: it only derives escaped HTML from its
 * arguments and never reads the filesystem or mutates a route entry.
 */
export function planRoutePreloads({
  routeEntry,
  collections = [],
  assetFiles = [],
  documentKey = null,
} = {}) {
  const routePath = normalizeRoutePath(routeEntry?.routePath);
  const canonicalPath = normalizeRoutePath(routeEntry?.canonicalPath || routePath);

  if (!routePath || !canonicalPath || routePath === '/' || routePath === '/404.html') {
    return '';
  }

  const routeKind = String(routeEntry?.kind || '');
  if (routePath === '/llms' || routePath === '/skill') {
    return '';
  }

  if (isOpenApiRoute({ routePath, canonicalPath, routeKind })) {
    const openApiChunk = resolveRouteChunk(
      assetFiles,
      OPENAPI_CHUNK_PATTERN,
      'OpenApiPage',
      routePath
    );
    return createLinkTag({ rel: 'modulepreload', href: openApiChunk, crossOrigin: true });
  }

  const documentRoute = findDocumentRoute({
    routePath,
    canonicalPath,
    collections,
    documentKey,
  });

  if (!documentRoute) {
    return '';
  }

  const docsChunk = resolveRouteChunk(assetFiles, DOCS_CHUNK_PATTERN, 'DocsPage', routePath);
  const documentHref = getDocumentHref(
    documentRoute.collection,
    documentRoute.documentKey,
    routePath
  );
  const links = new Set([
    createLinkTag({ rel: 'modulepreload', href: docsChunk, crossOrigin: true }),
    createLinkTag({ rel: 'preload', as: 'fetch', href: documentHref, crossOrigin: true }),
  ]);

  return Array.from(links).join('\n');
}
