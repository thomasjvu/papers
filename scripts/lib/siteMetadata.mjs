import { getHomeMetadataDefaults } from '../../shared/seo.js';

/** Site identity used by generated HTML and SEO artifacts: Vite env first, homepage defaults second. */
export function resolveSiteMetadata(viteEnv, defaults = getHomeMetadataDefaults()) {
  return {
    siteName: viteEnv.VITE_SITE_NAME || defaults.siteName,
    siteUrl: viteEnv.VITE_SITE_URL || '',
    siteSubtitle: defaults.siteSubtitle,
    siteDescription: defaults.siteDescription,
  };
}
