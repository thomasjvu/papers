import { buildCanonicalDocsPath } from '../../shared/docsRouting.js';
import { docsBasePath } from '../../shared/docsBasePath.js';

export type InternalHrefContext = {
  currentPath: string;
  activeLocale: string | null;
  activeVersion: string | null;
  /** Maps a doc slug to its document, e.g. a directory to its default page. */
  resolveDocumentPath: (slug: string) => string;
};

const EXTERNAL_PROTOCOL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function stripDocExtension(path: string): string {
  return path.replace(/\.(md|mdx)$/i, '');
}

function splitPathSuffix(href: string): { pathname: string; suffix: string } {
  const hashIndex = href.indexOf('#');
  const queryIndex = href.indexOf('?');
  const splitIndex =
    hashIndex === -1 ? queryIndex : queryIndex === -1 ? hashIndex : Math.min(hashIndex, queryIndex);

  if (splitIndex === -1) {
    return { pathname: href, suffix: '' };
  }

  return {
    pathname: href.slice(0, splitIndex),
    suffix: href.slice(splitIndex),
  };
}

function buildResolvedDocsHref(
  docPath: string,
  suffix: string,
  context: Pick<InternalHrefContext, 'activeLocale' | 'activeVersion' | 'resolveDocumentPath'>
): string {
  return (
    buildCanonicalDocsPath(context.resolveDocumentPath(stripDocExtension(docPath)), {
      version: context.activeVersion,
      locale: context.activeLocale,
    }) + suffix
  );
}

const HOSTED_FILE_ROUTES = new Map([
  ['/llms', '/llms.txt'],
  ['/llms.txt', '/llms.txt'],
  ['/skill', '/skill.md'],
  ['/skill.md', '/skill.md'],
]);

const PASSTHROUGH_ROUTE_PREFIXES = [docsBasePath, '/dev-docs'].filter(Boolean);

function isBrowserHandledHref(href: string): boolean {
  return !href || href.startsWith('#') || EXTERNAL_PROTOCOL_PATTERN.test(href);
}

function isPassthroughRoute(pathname: string): boolean {
  return PASSTHROUGH_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function resolveAbsoluteHref(href: string, context: InternalHrefContext): string {
  const parsed = new URL(href, 'https://docs.local');
  const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
  const suffix = `${parsed.search}${parsed.hash}`;

  if (isPassthroughRoute(pathname)) {
    return pathname + suffix;
  }

  return buildResolvedDocsHref(pathname.replace(/^\/+/, ''), suffix, context);
}

function resolveRelativeHref(href: string, context: InternalHrefContext): string {
  const { pathname, suffix } = splitPathSuffix(href);
  const lastSlash = context.currentPath.lastIndexOf('/');
  const baseDirectory = lastSlash === -1 ? '' : context.currentPath.slice(0, lastSlash + 1);
  const resolved = new URL(pathname, `https://docs.local/${baseDirectory}`);
  return buildResolvedDocsHref(resolved.pathname.replace(/^\/+/, ''), suffix, context);
}

/**
 * Rewrites a markdown link to its canonical in-app route, or returns null when
 * the browser should handle it (anchors and external URLs).
 */
export function resolveInternalHref(href: string, context: InternalHrefContext): string | null {
  if (isBrowserHandledHref(href)) {
    return null;
  }

  if (href === '/') {
    return href;
  }

  const hostedFile = HOSTED_FILE_ROUTES.get(href);
  if (hostedFile) {
    return hostedFile;
  }

  return href.startsWith('/')
    ? resolveAbsoluteHref(href, context)
    : resolveRelativeHref(href, context);
}
