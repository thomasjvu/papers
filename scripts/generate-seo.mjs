import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import { contentCollections } from '../shared/content-collections.js';
import { readAllCollectionArtifacts } from './lib/collectionArtifacts.mjs';
import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import { resolveSiteMetadata } from './lib/siteMetadata.mjs';
import {
  createAllCollectionSeoRouteEntries,
  createDefaultSocialImageManifest,
  createRobotsTxt,
  createSitemapXml,
} from './lib/seoArtifacts.mjs';

const rootDir = process.cwd();
const publicDir = join(rootDir, 'public');
const imagesDir = join(publicDir, 'images');

async function generateSeoArtifacts() {
  const artifactsByCollectionId = readAllCollectionArtifacts(publicDir, contentCollections);

  if (!artifactsByCollectionId) {
    console.error('Generated docs artifacts are missing. Run generate:docs first.');
    process.exit(1);
  }

  const openapiArtifacts = JSON.parse(
    await readFile(join(publicDir, 'openapi-artifacts.json'), 'utf8')
  );

  const { siteName, siteUrl, siteSubtitle, siteDescription } = resolveSiteMetadata(
    loadViteEnv(rootDir, resolveEnvMode('production'))
  );

  const routeEntries = createAllCollectionSeoRouteEntries(
    contentCollections,
    artifactsByCollectionId,
    {
      siteName,
      siteSubtitle,
      siteDescription,
      openapiArtifacts,
      collections: contentCollections,
    }
  );
  const socialImages = createDefaultSocialImageManifest({
    siteName,
    siteSubtitle,
    siteDescription,
  });

  await mkdir(publicDir, { recursive: true });
  await mkdir(imagesDir, { recursive: true });

  await writeFile(join(publicDir, 'robots.txt'), `${createRobotsTxt(siteUrl)}\n`);
  await writeFile(join(publicDir, 'sitemap.xml'), `${createSitemapXml(routeEntries, siteUrl)}\n`);
  await writeFile(
    join(publicDir, socialImages.ogImagePath.replace(/^\//, '')),
    `${socialImages.ogImageContent}\n`
  );
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
