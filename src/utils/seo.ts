import env from './env';
import {
  buildAbsoluteUrl,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  normalizeSiteUrl,
} from '../../shared/seo.js';

type SeoMetadataInput = {
  title: string;
  description: string;
  path: string;
  canonicalPath?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
};

function upsertMetaTag(attributeName: 'name' | 'property', attributeValue: string, content: string) {
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
  const imageUrl = buildAbsoluteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl) || DEFAULT_OG_IMAGE_PATH;
  const twitterImageUrl =
    buildAbsoluteUrl(DEFAULT_TWITTER_IMAGE_PATH, siteUrl) || DEFAULT_TWITTER_IMAGE_PATH;
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
  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', title);
  upsertMetaTag('name', 'twitter:description', description);
  upsertMetaTag('name', 'twitter:image', twitterImageUrl);
  upsertCanonicalLink(canonicalUrl);
}
