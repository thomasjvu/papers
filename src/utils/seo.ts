import env from './env';
import {
  AGENT_DISCOVERY_PATH,
  buildAbsoluteUrl,
  createSeoStructuredData,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  getAgentArtifactLinks,
  getFeedLink,
  normalizeSiteUrl,
  serializeJsonLd,
  socialImagePathForRoute,
} from '../../shared/seo.js';

type SeoMetadataInput = {
  title: string;
  description: string;
  path: string;
  canonicalPath?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
};

function upsertMetaTag(
  attributeName: 'name' | 'property',
  attributeValue: string,
  content: string
) {
  const selector = `meta[${attributeName}="${attributeValue}"]`;
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function upsertCanonicalLink(href: string) {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
}

function upsertAlternateLink(href: string, contentType: string, title: string) {
  const selector = `link[rel="alternate"][type="${contentType}"][title="${title}"]`;
  let link = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('type', contentType);
    link.setAttribute('title', title);
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
}

function upsertJsonLd(data: unknown) {
  let script = document.head.querySelector(
    'script[type="application/ld+json"]'
  ) as HTMLScriptElement | null;

  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = serializeJsonLd(data);
}

function getSiteUrl() {
  const envSiteUrl = normalizeSiteUrl(env.SITE_URL || '');

  if (envSiteUrl) {
    return envSiteUrl;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.origin;
}

export function applySeoMetadata({
  title,
  description,
  path,
  canonicalPath,
  type = 'website',
  noIndex = false,
}: SeoMetadataInput): void {
  if (typeof document === 'undefined') {
    return;
  }

  const siteName = env.SITE_NAME || 'papers';
  const siteUrl = getSiteUrl();
  const canonicalTarget = canonicalPath || path;
  const canonicalUrl = buildAbsoluteUrl(canonicalTarget, siteUrl) || canonicalTarget;
  const pageUrl = buildAbsoluteUrl(canonicalTarget, siteUrl) || canonicalTarget;
  // Production builds write a card per article route (scripts/generate-route-html.mjs).
  const pageImagePath =
    import.meta.env.PROD && type === 'article' && !noIndex
      ? socialImagePathForRoute(canonicalTarget)
      : DEFAULT_OG_IMAGE_PATH;
  const usePageImage = pageImagePath !== DEFAULT_OG_IMAGE_PATH;
  const imageUrl = buildAbsoluteUrl(pageImagePath, siteUrl) || pageImagePath;
  const twitterImagePath = usePageImage ? pageImagePath : DEFAULT_TWITTER_IMAGE_PATH;
  const twitterImageUrl = buildAbsoluteUrl(twitterImagePath, siteUrl) || twitterImagePath;
  const robotsValue = noIndex ? 'noindex, nofollow' : 'index, follow';

  document.title = title;
  upsertMetaTag('name', 'description', description);
  upsertMetaTag('name', 'robots', robotsValue);
  upsertMetaTag('property', 'og:type', type);
  upsertMetaTag('property', 'og:title', title);
  upsertMetaTag('property', 'og:description', description);
  upsertMetaTag('property', 'og:site_name', siteName);
  upsertMetaTag('property', 'og:url', pageUrl);
  upsertMetaTag('property', 'og:image', imageUrl);
  upsertMetaTag(
    'property',
    'og:image:type',
    /\.svg$/i.test(imageUrl) ? 'image/svg+xml' : 'image/png'
  );
  upsertMetaTag('property', 'og:image:alt', `${title} documentation preview`);
  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', title);
  upsertMetaTag('name', 'twitter:description', description);
  upsertMetaTag('name', 'twitter:image', twitterImageUrl);
  upsertMetaTag('name', 'twitter:image:alt', `${title} documentation preview`);
  upsertCanonicalLink(canonicalUrl);

  const agentLinks = [
    {
      href: buildAbsoluteUrl(AGENT_DISCOVERY_PATH, siteUrl) || AGENT_DISCOVERY_PATH,
      contentType: 'application/json',
      title: 'Documentation agent index',
    },
    ...getAgentArtifactLinks(siteUrl).map((link) => ({
      href: link.href,
      contentType: link.contentType,
      title: link.title,
    })),
    getFeedLink(siteUrl),
  ];

  agentLinks.forEach((link) => upsertAlternateLink(link.href, link.contentType, link.title));
  upsertJsonLd(
    createSeoStructuredData({
      siteName,
      title,
      description,
      url: pageUrl,
      routePath: canonicalTarget,
      type,
    })
  );
}
