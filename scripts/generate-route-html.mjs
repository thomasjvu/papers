import { existsSync, readFileSync } from 'fs';
import { mkdir, readdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

import { contentCollections } from '../shared/content-collections.js';
import { homepageConfig } from '../shared/documentation-config.js';
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  socialImagePathForRoute,
} from '../shared/seo.js';
import { readAllCollectionArtifacts } from './lib/collectionArtifacts.mjs';
import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import { resolveSiteMetadata } from './lib/siteMetadata.mjs';
import { routeHtmlPath } from './lib/routeHtmlPaths.mjs';
import {
  appendRoutePreloads,
  applyMetadataToHtml,
  createAgentLinks,
  createHomepageMetadata,
  createRouteMetadata,
  socialCardTitle,
  stripNonCriticalPreloads,
} from './lib/routeHtml.mjs';
import { planHomepagePreloads, planRoutePreloads } from './lib/routePreloads.mjs';
import { createAllCollectionSeoRouteEntries, createSocialCardSvg } from './lib/seoArtifacts.mjs';
import { renderSocialCardPng, socialCardFontFiles } from './lib/socialCardPng.mjs';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const indexHtmlPath = join(distDir, 'index.html');
const publicDir = join(rootDir, 'public');

async function writeRouteHtml(routePath, html) {
  // Prefer `path.html` over `path/index.html`. Routes whose last segment is
  // literally `index` (e.g. /docs/en/index) break under Cloudflare assets
  // html_handling: the platform treats "index" as a directory index and
  // 307s /docs/en/index → /docs/en/.
  const outputPath = routeHtmlPath(routePath, distDir);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${html.trimEnd()}\n`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readBuildInputs() {
  if (!existsSync(indexHtmlPath)) fail('dist/index.html not found. Run vite build first.');

  const artifactsByCollectionId = readAllCollectionArtifacts(publicDir, contentCollections);
  if (!artifactsByCollectionId) {
    fail('Generated docs artifacts are missing. Run generate:docs first.');
  }

  const openapiArtifactsPath = join(publicDir, 'openapi-artifacts.json');
  if (!existsSync(openapiArtifactsPath)) {
    fail('Generated OpenAPI artifacts are missing. Run generate:openapi first.');
  }

  return {
    artifactsByCollectionId,
    openapiArtifacts: JSON.parse(readFileSync(openapiArtifactsPath, 'utf8')),
  };
}

/**
 * Write the SVG (and, when rasterising works, PNG) social card for an article
 * route once per image path, returning the path to advertise or null for the
 * site default.
 */
async function writeSocialCard(entry, site, cards) {
  const svgImagePath =
    entry.type === 'article' ? socialImagePathForRoute(entry.canonicalPath, 'svg') : null;
  if (!svgImagePath || svgImagePath === DEFAULT_OG_IMAGE_PATH) return null;
  if (cards.written.has(svgImagePath)) return cards.written.get(svgImagePath);

  const svg = createSocialCardSvg({
    title: socialCardTitle(entry.title, site.siteName),
    description: entry.description || site.siteDescription,
    siteName: site.siteName,
    label: site.siteName,
  });
  const svgFile = join(distDir, svgImagePath.replace(/^\//, ''));
  await mkdir(dirname(svgFile), { recursive: true });
  await writeFile(svgFile, `${svg}\n`);

  // Prefer a PNG card (widely supported by social crawlers); keep the SVG
  // as the advertised image when rasterising fails.
  let advertisedPath = svgImagePath;
  const png = await renderSocialCardPng(svg, { fontFiles: cards.fontFiles });
  if (png) {
    const pngImagePath = socialImagePathForRoute(entry.canonicalPath, 'png');
    await writeFile(join(distDir, pngImagePath.replace(/^\//, '')), png);
    advertisedPath = pngImagePath;
    cards.png += 1;
  } else {
    cards.svgFallbacks += 1;
  }
  cards.written.set(svgImagePath, advertisedPath);
  return advertisedPath;
}

/**
 * Rasterise the site-wide SVG cards to PNG next to them, since social crawlers
 * (X, Facebook, LinkedIn, Slack) do not render SVG previews. Returns the PNG
 * paths to advertise, or {} to keep the SVGs when rasterising is unavailable.
 */
async function writeDefaultPngCards(fontFiles) {
  const defaults = {};
  for (const [key, svgPath] of [
    ['og', DEFAULT_OG_IMAGE_PATH],
    ['twitter', DEFAULT_TWITTER_IMAGE_PATH],
  ]) {
    const svgFile = join(distDir, svgPath.replace(/^\//, ''));
    if (!existsSync(svgFile)) continue;
    const png = await renderSocialCardPng(readFileSync(svgFile, 'utf8'), { fontFiles });
    if (!png) continue;
    const pngPath = svgPath.replace(/\.svg$/, '.png');
    await writeFile(join(distDir, pngPath.replace(/^\//, '')), png);
    defaults[key] = pngPath;
  }
  return defaults;
}

async function generateRouteHtml() {
  const { artifactsByCollectionId, openapiArtifacts } = readBuildInputs();
  const site = resolveSiteMetadata(loadViteEnv(rootDir, resolveEnvMode('production')));
  const { siteName, siteUrl, siteSubtitle, siteDescription } = site;
  const routeEntries = createAllCollectionSeoRouteEntries(
    contentCollections,
    artifactsByCollectionId,
    {
      siteName,
      siteSubtitle,
      siteDescription,
      openapiArtifacts,
    }
  );
  const assetsDir = join(distDir, 'assets');
  const builtAssetFiles = existsSync(assetsDir) ? await readdir(assetsDir) : [];
  const templateHtml = stripNonCriticalPreloads(readFileSync(indexHtmlPath, 'utf8'));
  const homepagePreloads = homepageConfig.enabled
    ? planHomepagePreloads({ artwork: homepageConfig.hero?.artwork })
    : '';
  const agentLinks = createAgentLinks(siteUrl, contentCollections);
  const cards = {
    written: new Map(),
    fontFiles: socialCardFontFiles(publicDir),
    png: 0,
    svgFallbacks: 0,
  };
  const defaultImages = await writeDefaultPngCards(cards.fontFiles);
  const homepageHtml = appendRoutePreloads(
    applyMetadataToHtml(
      templateHtml,
      createHomepageMetadata({
        siteName,
        siteSubtitle,
        siteDescription,
        siteUrl,
        agentLinks,
        defaultImages,
      })
    ),
    homepagePreloads
  );
  await writeFile(indexHtmlPath, `${homepageHtml.trimEnd()}\n`);

  for (const entry of routeEntries) {
    const imagePath = await writeSocialCard(entry, site, cards);
    const html = applyMetadataToHtml(
      templateHtml,
      createRouteMetadata(entry, { siteUrl, siteName, agentLinks, imagePath, defaultImages })
    );
    const routePreloads =
      entry.routePath === '/'
        ? homepagePreloads
        : planRoutePreloads({
            routeEntry: entry,
            collections: contentCollections,
            assetFiles: builtAssetFiles,
            documentKey: entry.documentKey,
          });

    await writeRouteHtml(entry.routePath, appendRoutePreloads(html, routePreloads));
  }

  console.log(
    `Generated ${routeEntries.length} route HTML files with SEO metadata and ${cards.written.size} page social card(s) (${cards.png} PNG, ${cards.svgFallbacks} SVG fallback).`
  );
}

generateRouteHtml().catch((error) => {
  console.error('Failed to generate route HTML:', error);
  process.exit(1);
});
