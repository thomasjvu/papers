import { existsSync, readFileSync } from 'fs';
import { mkdir, readdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

import { contentCollections } from '../shared/content-collections.js';
import { homepageConfig } from '../shared/documentation-config.js';
import {
  AGENT_DISCOVERY_PATH,
  buildAbsoluteUrl,
  createSeoStructuredData,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  getAgentArtifactLinks,
  getHomeMetadataDefaults,
  serializeJsonLd,
  socialImagePathForRoute,
} from '../shared/seo.js';
import { readAllCollectionArtifacts } from './lib/collectionArtifacts.mjs';
import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import { routeHtmlPath } from './lib/routeHtmlPaths.mjs';
import { planHomepagePreloads, planRoutePreloads } from './lib/routePreloads.mjs';
import { createAllCollectionSeoRouteEntries, createSocialCardSvg } from './lib/seoArtifacts.mjs';
import { renderSocialCardPng, socialCardFontFiles } from './lib/socialCardPng.mjs';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const indexHtmlPath = join(distDir, 'index.html');
const publicDir = join(rootDir, 'public');

function escapeAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeRegExp(value) {
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

function applyMetadataToHtml(templateHtml, metadata) {
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

function stripNonCriticalPreloads(html) {
  return html
    .replace(
      /^\s*<link rel="modulepreload" crossorigin href="[^\n]*(?:vendor-(?:mermaid|openapi|markdown|syntax|sanitize)|DocsPage-|OpenApiPage-|DesignBookPage-)[^\n]*>\s*$/gm,
      ''
    )
    .replace(/^\s*<link rel="stylesheet" crossorigin href="[^\n]*vendor-openapi-[^\n]*>\s*$/gm, '');
}

function appendRoutePreloads(html, preloads) {
  if (!preloads) {
    return html;
  }

  return html.replace('</head>', `    ${preloads}\n  </head>`);
}

async function writeRouteHtml(routePath, html) {
  // Prefer `path.html` over `path/index.html`. Routes whose last segment is
  // literally `index` (e.g. /docs/en/index) break under Cloudflare assets
  // html_handling: the platform treats "index" as a directory index and
  // 307s /docs/en/index → /docs/en/.
  const outputPath = routeHtmlPath(routePath, distDir);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${html.trimEnd()}\n`);
}

async function generateRouteHtml() {
  if (!existsSync(indexHtmlPath)) {
    console.error('dist/index.html not found. Run vite build first.');
    process.exit(1);
  }

  const artifactsByCollectionId = readAllCollectionArtifacts(publicDir, contentCollections);

  if (!artifactsByCollectionId) {
    console.error('Generated docs artifacts are missing. Run generate:docs first.');
    process.exit(1);
  }

  const openapiArtifactsPath = join(publicDir, 'openapi-artifacts.json');
  if (!existsSync(openapiArtifactsPath)) {
    console.error('Generated OpenAPI artifacts are missing. Run generate:openapi first.');
    process.exit(1);
  }
  const openapiArtifacts = JSON.parse(readFileSync(openapiArtifactsPath, 'utf8'));

  const mode = resolveEnvMode('production');
  const viteEnv = loadViteEnv(rootDir, mode);
  const defaults = getHomeMetadataDefaults();
  const siteName = viteEnv.VITE_SITE_NAME || defaults.siteName;
  const siteUrl = viteEnv.VITE_SITE_URL || '';
  const siteSubtitle = defaults.siteSubtitle;
  const siteDescription = defaults.siteDescription;
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
  const agentLinks = [
    {
      href: buildAbsoluteUrl(AGENT_DISCOVERY_PATH, siteUrl) || AGENT_DISCOVERY_PATH,
      contentType: 'application/json',
      title: 'Documentation agent index',
    },
    ...getAgentArtifactLinks(siteUrl, { collections: contentCollections }).map((link) => ({
      href: link.href,
      contentType: link.contentType,
      title: link.title,
    })),
  ];
  const homepageHtml = appendRoutePreloads(
    applyMetadataToHtml(templateHtml, {
      title: `${siteName} | ${siteSubtitle}`,
      description: siteDescription,
      canonicalUrl: buildAbsoluteUrl('/', siteUrl) || '/',
      url: buildAbsoluteUrl('/', siteUrl) || '/',
      imageUrl: buildAbsoluteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl) || DEFAULT_OG_IMAGE_PATH,
      twitterImageUrl:
        buildAbsoluteUrl(DEFAULT_TWITTER_IMAGE_PATH, siteUrl) || DEFAULT_TWITTER_IMAGE_PATH,
      robots: 'index, follow',
      type: 'website',
      siteName,
      routePath: '/',
      agentLinks,
    }),
    homepagePreloads
  );
  await writeFile(indexHtmlPath, `${homepageHtml.trimEnd()}\n`);

  const writtenSocialImages = new Map();
  const cardFontFiles = socialCardFontFiles(publicDir);
  let pngCards = 0;
  let svgFallbacks = 0;
  for (const entry of routeEntries) {
    const canonicalUrl = buildAbsoluteUrl(entry.canonicalPath, siteUrl) || entry.canonicalPath;
    const pageUrl = buildAbsoluteUrl(entry.canonicalPath, siteUrl) || entry.canonicalPath;
    let imagePath = DEFAULT_OG_IMAGE_PATH;
    let twitterImagePath = DEFAULT_TWITTER_IMAGE_PATH;
    const svgImagePath =
      entry.type === 'article' ? socialImagePathForRoute(entry.canonicalPath, 'svg') : null;
    if (svgImagePath && svgImagePath !== DEFAULT_OG_IMAGE_PATH) {
      if (!writtenSocialImages.has(svgImagePath)) {
        const svg = createSocialCardSvg({
          title: String(entry.title || siteName).replace(
            new RegExp(`\\s*\\|\\s*${escapeRegExp(String(siteName))}$`),
            ''
          ),
          description: entry.description || siteDescription,
          siteName,
          label: siteName,
        });
        const svgFile = join(distDir, svgImagePath.replace(/^\//, ''));
        await mkdir(dirname(svgFile), { recursive: true });
        await writeFile(svgFile, `${svg}\n`);

        // Prefer a PNG card (widely supported by social crawlers); keep the SVG
        // as the advertised image when rasterising fails.
        let advertisedPath = svgImagePath;
        const png = await renderSocialCardPng(svg, { fontFiles: cardFontFiles });
        if (png) {
          const pngImagePath = socialImagePathForRoute(entry.canonicalPath, 'png');
          await writeFile(join(distDir, pngImagePath.replace(/^\//, '')), png);
          advertisedPath = pngImagePath;
          pngCards += 1;
        } else {
          svgFallbacks += 1;
        }
        writtenSocialImages.set(svgImagePath, advertisedPath);
      }
      imagePath = writtenSocialImages.get(svgImagePath);
      twitterImagePath = imagePath;
    }
    const imageUrl = buildAbsoluteUrl(imagePath, siteUrl) || imagePath;
    const twitterImageUrl = buildAbsoluteUrl(twitterImagePath, siteUrl) || twitterImagePath;

    const html = applyMetadataToHtml(templateHtml, {
      title: entry.title,
      description: entry.description,
      canonicalUrl,
      url: pageUrl,
      imageUrl,
      twitterImageUrl,
      robots: entry.noIndex ? 'noindex, nofollow' : 'index, follow',
      type: entry.type || 'website',
      siteName,
      routePath: entry.routePath,
      agentLinks,
    });
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
    `Generated ${routeEntries.length} route HTML files with SEO metadata and ${writtenSocialImages.size} page social card(s) (${pngCards} PNG, ${svgFallbacks} SVG fallback).`
  );
}

generateRouteHtml().catch((error) => {
  console.error('Failed to generate route HTML:', error);
  process.exit(1);
});
