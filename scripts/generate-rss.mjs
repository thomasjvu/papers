/**
 * Writes dist/rss.xml after generate:last-updated. Items are the indexed pages,
 * newest first, dated from dist/docs-last-updated.json. Like the dates, the feed
 * only lands in dist/, so committed public/ artifacts stay deterministic.
 */
import { existsSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { contentCollections } from '../shared/content-collections.js';
import { i18nConfig } from '../shared/documentation-config.js';
import { getHomeMetadataDefaults } from '../shared/seo.js';
import { readAllCollectionArtifacts } from './lib/collectionArtifacts.mjs';
import { LAST_UPDATED_FILENAME, readDistDocumentArtifacts } from './lib/lastUpdated.mjs';
import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import { RSS_FEED_FILENAME, createRssFeedXml, selectFeedItems } from './lib/rssFeed.mjs';
import { createAllCollectionSeoRouteEntries } from './lib/seoArtifacts.mjs';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const publicDir = join(rootDir, 'public');
const lastUpdatedPath = join(distDir, LAST_UPDATED_FILENAME);

if (!existsSync(lastUpdatedPath)) {
  console.error(`${LAST_UPDATED_FILENAME} is missing. Run generate:last-updated first.`);
  process.exit(1);
}

const viteEnv = loadViteEnv(rootDir, resolveEnvMode('production'));
const defaults = getHomeMetadataDefaults();
const siteName = viteEnv.VITE_SITE_NAME || defaults.siteName;
const siteUrl = viteEnv.VITE_SITE_URL || '';
const artifactsByCollectionId = readAllCollectionArtifacts(publicDir, contentCollections);
const routeEntries = createAllCollectionSeoRouteEntries(
  contentCollections,
  artifactsByCollectionId,
  {
    siteName,
    siteSubtitle: defaults.siteSubtitle,
    siteDescription: defaults.siteDescription,
    collections: contentCollections,
  }
);
const canonicalPaths = new Set(
  routeEntries.filter((entry) => entry.includeInSitemap).map((entry) => entry.canonicalPath)
);
const { pages } = JSON.parse(readFileSync(lastUpdatedPath, 'utf8'));
const items = selectFeedItems(await readDistDocumentArtifacts(distDir), pages, canonicalPaths);
const xml = createRssFeedXml({
  siteName,
  siteUrl,
  description: defaults.siteDescription,
  language: i18nConfig?.defaultLocale,
  items,
});
await writeFile(join(distDir, RSS_FEED_FILENAME), xml);
if (!siteUrl) {
  console.warn('VITE_SITE_URL is not set, so rss.xml uses relative links.');
}
console.log(`Wrote ${RSS_FEED_FILENAME} with ${items.length} item(s).`);
