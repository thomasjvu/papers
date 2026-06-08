import { existsSync, readFileSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

import {
  buildAbsoluteUrl,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_IMAGE_PATH,
  getHomeMetadataDefaults,
} from '../shared/seo.js';
import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import { getGeneratedDocumentKeys } from './lib/docsVariants.mjs';
import { createSeoRouteEntries } from './lib/seoArtifacts.mjs';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const indexHtmlPath = join(distDir, 'index.html');
const docsIndexPath = join(rootDir, 'public', 'docs-index.json');
const docsContentDir = join(rootDir, 'public', 'docs-content');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function readGeneratedDocuments(docsIndex) {
  const documents = {};

  for (const docKey of getGeneratedDocumentKeys(docsIndex.paths)) {
    const filePath = join(docsContentDir, `${docKey}.json`);
    if (!existsSync(filePath)) {
      continue;
    }

    documents[docKey] = readJson(filePath);
  }

  return documents;
}

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
  const regex = new RegExp(`<meta\\s+${key}="${escapeRegExp(value)}"\\s+content="[^"]*"\\s*\\/?>`, 'i');

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

function applyMetadataToHtml(templateHtml, metadata) {
  let html = templateHtml.replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttribute(metadata.title)}</title>`);

  html = upsertMetaTag(html, 'name', 'description', metadata.description);
  html = upsertMetaTag(html, 'name', 'robots', metadata.robots);
  html = upsertMetaTag(html, 'property', 'og:type', metadata.type);
  html = upsertMetaTag(html, 'property', 'og:title', metadata.title);
  html = upsertMetaTag(html, 'property', 'og:description', metadata.description);
  html = upsertMetaTag(html, 'property', 'og:site_name', metadata.siteName);
  html = upsertMetaTag(html, 'property', 'og:url', metadata.url);
  html = upsertMetaTag(html, 'property', 'og:image', metadata.imageUrl);
  html = upsertMetaTag(html, 'name', 'twitter:card', 'summary_large_image');
  html = upsertMetaTag(html, 'name', 'twitter:title', metadata.title);
  html = upsertMetaTag(html, 'name', 'twitter:description', metadata.description);
  html = upsertMetaTag(html, 'name', 'twitter:image', metadata.twitterImageUrl);
  html = upsertLinkTag(html, 'canonical', metadata.canonicalUrl);

  return html;
}

async function writeRouteHtml(routePath, html) {
  const outputPath =
    routePath === '/'
      ? indexHtmlPath
      : routePath.endsWith('.html')
        ? join(distDir, routePath.replace(/^\//, ''))
        : join(distDir, routePath.replace(/^\//, ''), 'index.html');

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${html.trimEnd()}\n`);
}

async function generateRouteHtml() {
  if (!existsSync(indexHtmlPath)) {
    console.error('dist/index.html not found. Run vite build first.');
    process.exit(1);
  }

  if (!existsSync(docsIndexPath) || !existsSync(docsContentDir)) {
    console.error('Generated docs artifacts are missing. Run generate:docs first.');
    process.exit(1);
  }

  const mode = resolveEnvMode('production');
  const viteEnv = loadViteEnv(rootDir, mode);
  const defaults = getHomeMetadataDefaults();
  const siteName = viteEnv.VITE_SITE_NAME || defaults.siteName;
  const siteUrl = viteEnv.VITE_SITE_URL || '';
  const siteSubtitle = defaults.siteSubtitle;
  const siteDescription = defaults.siteDescription;
  const docsIndex = readJson(docsIndexPath);
  const documents = readGeneratedDocuments(docsIndex);
  const routeEntries = createSeoRouteEntries(docsIndex, documents, {
    siteName,
    siteSubtitle,
    siteDescription,
  });
  const templateHtml = readFileSync(indexHtmlPath, 'utf8');

  for (const entry of routeEntries) {
    const canonicalUrl = buildAbsoluteUrl(entry.canonicalPath, siteUrl) || entry.canonicalPath;
    const pageUrl = buildAbsoluteUrl(entry.canonicalPath, siteUrl) || entry.canonicalPath;
    const imageUrl = buildAbsoluteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl) || DEFAULT_OG_IMAGE_PATH;
    const twitterImageUrl =
      buildAbsoluteUrl(DEFAULT_TWITTER_IMAGE_PATH, siteUrl) || DEFAULT_TWITTER_IMAGE_PATH;

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
    });

    await writeRouteHtml(entry.routePath, html);
  }

  console.log(`Generated ${routeEntries.length} route HTML files with SEO metadata.`);
}

generateRouteHtml().catch((error) => {
  console.error('Failed to generate route HTML:', error);
  process.exit(1);
});