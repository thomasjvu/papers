import { existsSync, readFileSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import { getHomeMetadataDefaults } from '../shared/seo.js';
import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import { getGeneratedDocumentKeys } from './lib/docsVariants.mjs';
import {
  createDefaultSocialImageManifest,
  createRobotsTxt,
  createSeoRouteEntries,
  createSitemapXml,
} from './lib/seoArtifacts.mjs';

const rootDir = process.cwd();
const publicDir = join(rootDir, 'public');
const imagesDir = join(publicDir, 'images');
const docsIndexPath = join(publicDir, 'docs-index.json');
const docsContentDir = join(publicDir, 'docs-content');

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

async function generateSeoArtifacts() {
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
  const socialImages = createDefaultSocialImageManifest({
    siteName,
    siteSubtitle,
    siteDescription,
  });

  await mkdir(publicDir, { recursive: true });
  await mkdir(imagesDir, { recursive: true });

  await writeFile(join(publicDir, 'robots.txt'), `${createRobotsTxt(siteUrl)}\n`);
  await writeFile(join(publicDir, 'sitemap.xml'), `${createSitemapXml(routeEntries, siteUrl)}\n`);
  await writeFile(join(publicDir, socialImages.ogImagePath.replace(/^\//, '')), `${socialImages.ogImageContent}\n`);
  await writeFile(
    join(publicDir, socialImages.twitterImagePath.replace(/^\//, '')),
    `${socialImages.twitterImageContent}\n`
  );

  console.log('Generated SEO assets.');
  console.log(`Wrote robots.txt to ${join(publicDir, 'robots.txt')}`);
  console.log(`Wrote sitemap.xml to ${join(publicDir, 'sitemap.xml')}`);
  console.log(`Wrote social preview images to ${imagesDir}`);
}

generateSeoArtifacts().catch((error) => {
  console.error('Failed to generate SEO assets:', error);
  process.exit(1);
});