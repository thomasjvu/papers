import { documentationTree } from '../../shared/documentation-config.js';
import {
  buildAbsoluteUrl,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  extractDescriptionFromMarkdown,
  getDefaultDocumentPath,
  getDirectoryAliasEntries,
  getHomeMetadataDefaults,
  normalizeSiteUrl,
} from '../../shared/seo.js';
import {
  buildCanonicalDocsPath,
  buildDocsContentPath,
  buildDocsRouteVariants,
  parseDocsRoutePath,
} from '../../shared/docsRouting.js';

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text, lineLength) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > lineLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function getDocumentDescription(document) {
  return document?.description || extractDescriptionFromMarkdown(document?.content || '');
}

function getDocsRouteContext(routePath, options) {
  if (!routePath.startsWith('/docs')) {
    return null;
  }

  const slugPath = routePath.replace(/^\/docs\/?/, '');
  return parseDocsRoutePath(slugPath, {
    versionConfig: options.versionConfig,
    i18nConfig: options.i18nConfig,
  });
}

function getDocumentForRoute(docPath, routePath, documentsByPath, options) {
  const routeContext = getDocsRouteContext(routePath, options);

  if (routeContext) {
    const variantKey = buildDocsContentPath(docPath, {
      version: routeContext.activeVersion,
      locale: routeContext.activeLocale,
      versionConfig: options.versionConfig,
      i18nConfig: options.i18nConfig,
    });

    if (documentsByPath[variantKey]) {
      return documentsByPath[variantKey];
    }
  }

  const defaultVariantKey = buildDocsContentPath(docPath, {
    versionConfig: options.versionConfig,
    i18nConfig: options.i18nConfig,
  });

  return documentsByPath[defaultVariantKey] || documentsByPath[docPath] || null;
}

function registerDocsRouteVariants(registerRoute, slugPath, canonicalDocPath, documentsByPath, options) {
  const routePaths = buildDocsRouteVariants(slugPath, {
    versionConfig: options.versionConfig,
    i18nConfig: options.i18nConfig,
  });
  const canonicalPath = buildCanonicalDocsPath(canonicalDocPath, {
    versionConfig: options.versionConfig,
    i18nConfig: options.i18nConfig,
  });

  for (const routePath of routePaths) {
    const document = getDocumentForRoute(canonicalDocPath, routePath, documentsByPath, options);

    if (!document) {
      continue;
    }

    registerRoute({
      routePath,
      canonicalPath,
      title: `${document.title} | ${options.siteName}`,
      description: getDocumentDescription(document),
      type: 'article',
      includeInSitemap: routePath === canonicalPath && options.includeInSitemap !== false,
    });
  }
}

export function createSeoRouteEntries(docsIndex, documentsByPath, options = {}) {
  const defaults = getHomeMetadataDefaults();
  const siteName = options.siteName || defaults.siteName;
  const siteSubtitle = options.siteSubtitle || defaults.siteSubtitle;
  const siteDescription = options.siteDescription || defaults.siteDescription;
  const routeOptions = {
    ...options,
    siteName,
  };
  const entries = [];
  const routeMap = new Map();

  const registerRoute = (entry) => {
    if (!routeMap.has(entry.routePath)) {
      routeMap.set(entry.routePath, entry);
      entries.push(entry);
    }
  };

  registerRoute({
    routePath: '/',
    canonicalPath: '/',
    title: `${siteName} | ${siteSubtitle}`,
    description: siteDescription,
    type: 'website',
    includeInSitemap: true,
  });

  const defaultDocPath = getDefaultDocumentPath(documentationTree);
  if (defaultDocPath) {
    registerDocsRouteVariants(registerRoute, '', defaultDocPath, documentsByPath, {
      ...routeOptions,
      includeInSitemap: false,
    });
  }

  for (const alias of getDirectoryAliasEntries(documentationTree)) {
    registerDocsRouteVariants(registerRoute, alias.routePath.replace(/^\/docs\/?/, ''), alias.docPath, documentsByPath, {
      ...routeOptions,
      includeInSitemap: false,
    });
  }

  for (const docPath of docsIndex.paths) {
    if (docPath === 'llms') {
      const document = getDocumentForRoute(docPath, '/llms', documentsByPath, routeOptions);

      if (!document) {
        continue;
      }

      registerRoute({
        routePath: '/llms',
        canonicalPath: '/llms',
        title: `LLMs.txt | ${siteName}`,
        description:
          getDocumentDescription(document) ||
          'AI-friendly text exports generated from the documentation corpus.',
        type: 'article',
        includeInSitemap: true,
      });
      continue;
    }

    registerDocsRouteVariants(registerRoute, docPath, docPath, documentsByPath, {
      ...routeOptions,
      includeInSitemap: true,
    });
  }

  registerRoute({
    routePath: '/404.html',
    canonicalPath: '/404.html',
    title: `Not Found | ${siteName}`,
    description: 'The requested page could not be found.',
    type: 'website',
    includeInSitemap: false,
    noIndex: true,
  });

  return entries;
}

export function createSitemapXml(routeEntries, siteUrl, lastModified = new Date().toISOString()) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const canonicalEntries = Array.from(
    new Map(
      routeEntries
        .filter((entry) => entry.includeInSitemap)
        .map((entry) => [entry.canonicalPath, entry])
    ).values()
  );

  const urls = normalizedSiteUrl
    ? canonicalEntries
        .map((entry) => {
          const location = buildAbsoluteUrl(entry.canonicalPath, normalizedSiteUrl);
          return [
            '  <url>',
            `    <loc>${escapeXml(location)}</loc>`,
            `    <lastmod>${lastModified}</lastmod>`,
            '  </url>',
          ].join('\n');
        })
        .join('\n')
    : '';

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
  ]
    .filter(Boolean)
    .join('\n');
}

export function createRobotsTxt(siteUrl) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const lines = ['User-agent: *', 'Allow: /'];

  if (normalizedSiteUrl) {
    lines.push('', `Sitemap: ${normalizedSiteUrl}/sitemap.xml`);
  }

  return lines.join('\n');
}

export function createSocialCardSvg({ title, description, siteName, label }) {
  const titleLines = wrapText(title, 22).slice(0, 2);
  const descriptionLines = wrapText(description, 46).slice(0, 3);
  const safeTitle = titleLines.length > 0 ? titleLines : [siteName];
  const safeDescription = descriptionLines.length > 0 ? descriptionLines : [siteName];

  const titleMarkup = safeTitle
    .map(
      (line, index) =>
        `<tspan x="88" dy="${index === 0 ? 0 : 58}">${escapeXml(line)}</tspan>`
    )
    .join('');
  const descriptionMarkup = safeDescription
    .map(
      (line, index) =>
        `<tspan x="88" dy="${index === 0 ? 0 : 34}">${escapeXml(line)}</tspan>`
    )
    .join('');

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">',
    `  <title id="title">${escapeXml(title)}</title>`,
    `  <desc id="desc">${escapeXml(description)}</desc>`,
    '  <rect width="1200" height="630" fill="#090909" />',
    '  <rect x="56" y="56" width="1088" height="518" rx="24" fill="#111111" stroke="#27272A" />',
    '  <rect x="88" y="88" width="164" height="40" rx="20" fill="#FAFAFA" />',
    `  <text x="170" y="114" text-anchor="middle" font-family="MapleMono, monospace" font-size="18" letter-spacing="2" fill="#090909">${escapeXml(label)}</text>`,
    `  <text x="88" y="214" font-family="Hubot Sans, Mona Sans, sans-serif" font-size="56" font-weight="800" fill="#FAFAFA">${titleMarkup}</text>`,
    `  <text x="88" y="358" font-family="Mona Sans, sans-serif" font-size="28" fill="#A1A1AA">${descriptionMarkup}</text>`,
    `  <text x="88" y="520" font-family="MapleMono, monospace" font-size="22" fill="#FAFAFA">${escapeXml(siteName)}</text>`,
    `  <text x="1112" y="520" text-anchor="end" font-family="MapleMono, monospace" font-size="22" fill="#71717A">${escapeXml(label)}</text>`,
    '</svg>',
  ].join('\n');
}

export function createDefaultSocialImageManifest(options = {}) {
  const defaults = getHomeMetadataDefaults();
  const siteName = options.siteName || defaults.siteName;
  const siteSubtitle = options.siteSubtitle || defaults.siteSubtitle;
  const siteDescription = options.siteDescription || defaults.siteDescription;

  return {
    ogImagePath: DEFAULT_OG_IMAGE_PATH,
    twitterImagePath: DEFAULT_TWITTER_IMAGE_PATH,
    ogImageContent: createSocialCardSvg({
      title: `${siteName} | ${siteSubtitle}`,
      description: siteDescription,
      siteName,
      label: 'Open Graph',
    }),
    twitterImageContent: createSocialCardSvg({
      title: `${siteName} | ${siteSubtitle}`,
      description: siteDescription,
      siteName,
      label: 'Share Card',
    }),
  };
}