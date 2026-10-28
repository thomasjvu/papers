/**
 * Pure HTML templating used by scripts/generate-route-html.mjs to stamp SEO
 * metadata and preloads into each prerendered route. No filesystem access, so
 * every rule here is unit-tested in test/route-html.test.ts.
 */
import {
  AGENT_DISCOVERY_PATH,
  buildAbsoluteUrl,
  createSeoStructuredData,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  getAgentArtifactLinks,
  getFeedLink,
  serializeJsonLd,
} from '../../shared/seo.js';

export function escapeAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function upsertMetaTag(html, key, value, content) {
  const escapedContent = escapeAttribute(content);
  const tag = `<meta ${key}="${value}" content="${escapedContent}" />`;
  const regex = new RegExp(
    `<meta\\s+${key}="${escapeRegExp(value)}"\\s+content="[^"]*"\\s*\\/?>`,
    'i'
  );

  if (regex.test(html)) {
    return html.replace(regex, tag);
  }

  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function upsertLinkTag(html, rel, href) {
  const escapedHref = escapeAttribute(href);
  const tag = `<link rel="${rel}" href="${escapedHref}" />`;
  const regex = new RegExp(`<link\\s+rel="${escapeRegExp(rel)}"\\s+href="[^"]*"\\s*\\/?>`, 'i');

  if (regex.test(html)) {
    return html.replace(regex, tag);
  }

  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function upsertAlternateLink(html, { href, contentType, title }) {
  const tag = `<link rel="alternate" type="${escapeAttribute(contentType)}" title="${escapeAttribute(title)}" href="${escapeAttribute(href)}" />`;
  const regex = new RegExp(
    `<link\\s+rel="alternate"\\s+type="${escapeRegExp(contentType)}"\\s+title="${escapeRegExp(title)}"[^>]*\\/?>(?:\\s*)`,
    'i'
  );

  if (regex.test(html)) {
    return html.replace(regex, `    ${tag}\n`);
  }

  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function upsertJsonLd(html, data) {
  const tag = `<script type="application/ld+json">${serializeJsonLd(data)}</script>`;
  const regex = /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i;

  if (regex.test(html)) {
    return html.replace(regex, tag);
  }

  return html.replace('</head>', `    ${tag}\n  </head>`);
}

const SOCIAL_IMAGE_TYPES = {
  png: 'image/png',
  svg: 'image/svg+xml',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/** MIME type for og:image:type, from the advertised image's extension. */
export function socialImageType(imageUrl) {
  const extension = String(imageUrl || '')
    .split(/[?#]/)[0]
    .split('.')
    .pop()
    .toLowerCase();
  return SOCIAL_IMAGE_TYPES[extension] || 'image/png';
}

export function applyMetadataToHtml(templateHtml, metadata) {
  let html = templateHtml.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapeAttribute(metadata.title)}</title>`
  );

  html = upsertMetaTag(html, 'name', 'description', metadata.description);
  html = upsertMetaTag(html, 'name', 'robots', metadata.robots);
  html = upsertMetaTag(html, 'property', 'og:type', metadata.type);
  html = upsertMetaTag(html, 'property', 'og:title', metadata.title);
  html = upsertMetaTag(html, 'property', 'og:description', metadata.description);
  html = upsertMetaTag(html, 'property', 'og:site_name', metadata.siteName);
  html = upsertMetaTag(html, 'property', 'og:url', metadata.url);
  html = upsertMetaTag(html, 'property', 'og:image', metadata.imageUrl);
  html = upsertMetaTag(html, 'property', 'og:image:type', socialImageType(metadata.imageUrl));
  html = upsertMetaTag(html, 'property', 'og:image:alt', `${metadata.title} documentation preview`);
  html = upsertMetaTag(html, 'name', 'twitter:card', 'summary_large_image');
  html = upsertMetaTag(html, 'name', 'twitter:title', metadata.title);
  html = upsertMetaTag(html, 'name', 'twitter:description', metadata.description);
  html = upsertMetaTag(html, 'name', 'twitter:image', metadata.twitterImageUrl);
  html = upsertMetaTag(
    html,
    'name',
    'twitter:image:alt',
    `${metadata.title} documentation preview`
  );
  html = upsertLinkTag(html, 'canonical', metadata.canonicalUrl);

  for (const link of metadata.agentLinks) {
    html = upsertAlternateLink(html, link);
  }

  html = upsertJsonLd(
    html,
    createSeoStructuredData({
      siteName: metadata.siteName,
      title: metadata.title,
      description: metadata.description,
      url: metadata.url,
      routePath: metadata.routePath,
      type: metadata.type,
    })
  );

  return html;
}

export function stripNonCriticalPreloads(html) {
  return html
    .replace(
      /^\s*<link rel="modulepreload" crossorigin href="[^\n]*(?:vendor-(?:mermaid|openapi|markdown|syntax|sanitize)|DocsPage-|OpenApiPage-|DesignBookPage-)[^\n]*>\s*$/gm,
      ''
    )
    .replace(/^\s*<link rel="stylesheet" crossorigin href="[^\n]*vendor-openapi-[^\n]*>\s*$/gm, '');
}

export function appendRoutePreloads(html, preloads) {
  if (!preloads) {
    return html;
  }

  return html.replace('</head>', `    ${preloads}\n  </head>`);
}

/** Absolute URL for `path` on `siteUrl`, or the path itself when no site URL is set. */
export function absoluteOrPath(path, siteUrl) {
  return buildAbsoluteUrl(path, siteUrl) || path;
}

/** The alternate links advertised in every page head for agents and feeds. */
export function createAgentLinks(siteUrl, collections) {
  return [
    {
      href: absoluteOrPath(AGENT_DISCOVERY_PATH, siteUrl),
      contentType: 'application/json',
      title: 'Documentation agent index',
    },
    ...getAgentArtifactLinks(siteUrl, { collections }).map((link) => ({
      href: link.href,
      contentType: link.contentType,
      title: link.title,
    })),
    getFeedLink(siteUrl),
  ];
}

export function createHomepageMetadata({
  siteName,
  siteSubtitle,
  siteDescription,
  siteUrl,
  agentLinks,
  defaultImages = {},
}) {
  const url = absoluteOrPath('/', siteUrl);
  return {
    title: `${siteName} | ${siteSubtitle}`,
    description: siteDescription,
    canonicalUrl: url,
    url,
    imageUrl: absoluteOrPath(defaultImages.og || DEFAULT_OG_IMAGE_PATH, siteUrl),
    twitterImageUrl: absoluteOrPath(defaultImages.twitter || DEFAULT_TWITTER_IMAGE_PATH, siteUrl),
    robots: 'index, follow',
    type: 'website',
    siteName,
    routePath: '/',
    agentLinks,
  };
}

/** Social card title: the entry title (or site name) without a trailing "| Site". */
export function socialCardTitle(title, siteName) {
  return String(title || siteName).replace(
    new RegExp(`\\s*\\|\\s*${escapeRegExp(String(siteName))}$`),
    ''
  );
}

/**
 * Metadata for one route entry. `imagePath` is the advertised social card, or
 * null to use the site-wide default images.
 */
export function createRouteMetadata(
  entry,
  { siteUrl, siteName, agentLinks, imagePath = null, defaultImages = {} }
) {
  const pageUrl = absoluteOrPath(entry.canonicalPath, siteUrl);
  return {
    title: entry.title,
    description: entry.description,
    canonicalUrl: pageUrl,
    url: pageUrl,
    imageUrl: absoluteOrPath(imagePath || defaultImages.og || DEFAULT_OG_IMAGE_PATH, siteUrl),
    twitterImageUrl: absoluteOrPath(
      imagePath || defaultImages.twitter || DEFAULT_TWITTER_IMAGE_PATH,
      siteUrl
    ),
    robots: entry.noIndex ? 'noindex, nofollow' : 'index, follow',
    type: entry.type || 'website',
    siteName,
    routePath: entry.routePath,
    agentLinks,
  };
}
