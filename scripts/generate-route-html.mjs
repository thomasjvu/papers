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
import { compileMdxToHtml } from './lib/mdxCompile.mjs';
import {
  PRERENDER_MAX_HTML_BYTES,
  addHeadingIdsFromToc,
  createInitialDocsData,
  injectPrerender,
  removeDocumentJsonPreload,
  renderPrerenderArticleHtml,
  supportsPrerender,
} from './lib/prerenderHtml.mjs';
import {
  planHomepagePreloads,
  planRoutePreloads,
  resolveRouteDocument,
} from './lib/routePreloads.mjs';
import { createAllCollectionSeoRouteEntries, createSocialCardSvg } from './lib/seoArtifacts.mjs';
import {
  cardHash,
  pruneCachedPngs,
  readCardHashManifest,
  restoreCachedPng,
  socialCardCacheDir,
  storeCachedPng,
  writeCardHashManifest,
} from './lib/socialCardCache.mjs';
import { renderSocialCardPng, socialCardFontFiles } from './lib/socialCardPng.mjs';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const indexHtmlPath = join(distDir, 'index.html');
const publicDir = join(rootDir, 'public');
const cardCacheDir = socialCardCacheDir(rootDir);

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

  const cardInputs = {
    title: socialCardTitle(entry.title, site.siteName),
    description: entry.description || site.siteDescription,
    siteName: site.siteName,
    label: site.siteName,
  };
  const hash = cardHash(cardInputs);
  const svg = createSocialCardSvg(cardInputs);
  const svgFile = join(distDir, svgImagePath.replace(/^\//, ''));
  await mkdir(dirname(svgFile), { recursive: true });
  await writeFile(svgFile, `${svg}\n`);

  // Reuse a previously rendered PNG when the card inputs are unchanged.
  // The cached bytes live outside dist/ (see socialCardCache.mjs), so a
  // full Vite build — which empties dist/ — does not lose the cache; the
  // cached PNG is copied back into dist/ on a hit.
  const cached = cards.hashes[svgImagePath];
  if (
    cached?.hash === hash &&
    cached.advertised?.endsWith('.png') &&
    (await restoreCachedPng(
      cards.cacheDir,
      join(distDir, cached.advertised.replace(/^\//, '')),
      hash
    ))
  ) {
    cards.written.set(svgImagePath, cached.advertised);
    cards.nextHashes[svgImagePath] = cached;
    cards.skipped += 1;
    return cached.advertised;
  }

  // Prefer a PNG card (widely supported by social crawlers); keep the SVG
  // as the advertised image when rasterising fails.
  let advertisedPath = svgImagePath;
  const png = await renderSocialCardPng(svg, { fontFiles: cards.fontFiles });
  if (png) {
    const pngImagePath = socialImagePathForRoute(entry.canonicalPath, 'png');
    await writeFile(join(distDir, pngImagePath.replace(/^\//, '')), png);
    await storeCachedPng(cards.cacheDir, hash, png);
    advertisedPath = pngImagePath;
    cards.png += 1;
    cards.nextHashes[svgImagePath] = { hash, advertised: pngImagePath };
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
async function writeDefaultPngCards(fontFiles, cards) {
  const defaults = {};
  for (const [key, svgPath] of [
    ['og', DEFAULT_OG_IMAGE_PATH],
    ['twitter', DEFAULT_TWITTER_IMAGE_PATH],
  ]) {
    const svgFile = join(distDir, svgPath.replace(/^\//, ''));
    if (!existsSync(svgFile)) continue;
    const svg = readFileSync(svgFile, 'utf8');
    const pngPath = svgPath.replace(/\.svg$/, '.png');
    const hash = cardHash({ svg });
    const cached = cards.hashes[svgPath];
    if (
      cached?.hash === hash &&
      cached.advertised === pngPath &&
      (await restoreCachedPng(cards.cacheDir, join(distDir, pngPath.replace(/^\//, '')), hash))
    ) {
      defaults[key] = pngPath;
      cards.nextHashes[svgPath] = cached;
      continue;
    }
    const png = await renderSocialCardPng(svg, { fontFiles });
    if (!png) continue;
    await writeFile(join(distDir, pngPath.replace(/^\//, '')), png);
    await storeCachedPng(cards.cacheDir, hash, png);
    defaults[key] = pngPath;
    cards.nextHashes[svgPath] = { hash, advertised: pngPath };
  }
  return defaults;
}

/**
 * Prerender one article route: render its sanitized HTML into the #root
 * shell and embed its document JSON so the app boots without fetching it.
 * Returns the new HTML, or null to keep the plain SPA shell (unsupported
 * authoring features, an oversized article, an unresolvable route, or a
 * render failure). Prerendering never fails the build: the app renders the
 * same article interactively after mount either way.
 */
async function prerenderRouteHtml(entry, artifactsByCollectionId, html) {
  let resolved;
  try {
    resolved = resolveRouteDocument({ routeEntry: entry, collections: contentCollections });
  } catch (error) {
    console.warn(`Skipping prerender for "${entry.routePath}": ${error.message}`);
    return null;
  }
  if (!resolved) {
    return null;
  }

  const artifacts = artifactsByCollectionId[resolved.collection.id];
  const document = artifacts?.documents?.[resolved.documentKey];
  if (!document || !supportsPrerender(document)) {
    return null;
  }

  let rendered;
  try {
    rendered =
      document.contentFormat === 'html'
        ? document.content
        : await compileMdxToHtml(document.content);
  } catch (error) {
    console.warn(
      `Skipping prerender for "${entry.routePath}": article render failed (${error.message})`
    );
    return null;
  }
  const articleHtml = addHeadingIdsFromToc(rendered, document.toc || []);
  if (Buffer.byteLength(articleHtml, 'utf8') > PRERENDER_MAX_HTML_BYTES) {
    return null;
  }

  const initialDocs = createInitialDocsData({
    collection: resolved.collection,
    docPath: resolved.docPath,
    version: resolved.version,
    locale: resolved.locale,
    document,
    backlinks: artifacts.references?.backlinks?.[resolved.docPath] ?? [],
  });

  return removeDocumentJsonPreload(
    injectPrerender(html, {
      initialDocs,
      prerenderHtml: renderPrerenderArticleHtml(articleHtml),
    }),
    resolved.documentHref
  );
}

async function generateRouteHtml() {
  const startedAt = Date.now();
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
    fontFiles: socialCardFontFiles(join(rootDir, 'scripts', 'assets', 'fonts')),
    cacheDir: cardCacheDir,
    hashes: readCardHashManifest(cardCacheDir),
    nextHashes: {},
    png: 0,
    svgFallbacks: 0,
    skipped: 0,
  };
  const defaultImages = await writeDefaultPngCards(cards.fontFiles, cards);
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

  let prerenderedRoutes = 0;
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

    let routeHtml = appendRoutePreloads(html, routePreloads);
    if (entry.type === 'article') {
      const prerendered = await prerenderRouteHtml(entry, artifactsByCollectionId, routeHtml);
      if (prerendered) {
        routeHtml = prerendered;
        prerenderedRoutes += 1;
      }
    }

    await writeRouteHtml(entry.routePath, routeHtml);
  }

  await writeCardHashManifest(cards.cacheDir, cards.nextHashes);
  await pruneCachedPngs(
    cards.cacheDir,
    new Set(Object.values(cards.nextHashes).map((entry) => entry.hash))
  );

  console.log(
    `Generated ${routeEntries.length} route HTML files with SEO metadata and ${cards.written.size} page social card(s) (${cards.png} PNG, ${cards.svgFallbacks} SVG fallback, ${cards.skipped} reused from cache), ${prerenderedRoutes} article route(s) prerendered in ${((Date.now() - startedAt) / 1000).toFixed(1)}s.`
  );
}

generateRouteHtml().catch((error) => {
  console.error('Failed to generate route HTML:', error);
  process.exit(1);
});
