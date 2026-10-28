import { buildCanonicalDocsPath } from '../../shared/docsRouting.js';

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

export function resolveInternalHref(href: string, context: InternalHrefContext): string | null {
  if (!href || href === '#' || href.startsWith('#') || EXTERNAL_PROTOCOL_PATTERN.test(href)) {
    return null;
  }

  if (href === '/') {
    return href;
  }

  if (href === '/llms' || href === '/llms.txt') {
    return '/llms.txt';
  }

  if (href === '/skill' || href === '/skill.md') {
    return '/skill.md';
  }

  if (href.startsWith('/')) {
    const parsed = new URL(href, 'https://docs.local');
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    const suffix = `${parsed.search}${parsed.hash}`;

    if (
      pathname === '/docs' ||
      pathname.startsWith('/docs/') ||
      pathname === '/dev-docs' ||
      pathname.startsWith('/dev-docs/')
    ) {
      return pathname + suffix;
    }

    const docPath = pathname.replace(/^\/+/, '');
    return buildResolvedDocsHref(docPath, suffix, context);
  }

  const { pathname, suffix } = splitPathSuffix(href);
  const baseDirectory = context.currentPath.includes('/')
    ? context.currentPath.slice(0, context.currentPath.lastIndexOf('/') + 1)
    : '';
  const resolved = new URL(pathname, `https://docs.local/${baseDirectory}`);
  const docPath = resolved.pathname.replace(/^\/+/, '');
  return buildResolvedDocsHref(docPath, suffix, context);
}
