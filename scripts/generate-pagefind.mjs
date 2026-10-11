import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import * as pagefind from 'pagefind';
import { contentCollections, validateContentCollections } from '../shared/content-collections.js';
import { readAllCollectionArtifacts } from './lib/collectionArtifacts.mjs';
import { createPagefindRecords } from './lib/pagefindArtifacts.mjs';
import { resolveAppDir, resolvePackageDir } from './lib/papersPaths.mjs';

const importMetaUrl = import.meta.url;
const packageDir = resolvePackageDir(importMetaUrl);
const appDir = resolveAppDir(packageDir);
const distDir = join(appDir, 'dist');
const pagefindOutputDir = join(distDir, 'pagefind');
const searchPagesDir = join(distDir, 'search-pages');
const publicDir = join(appDir, 'public');
const openapiArtifactsPath = join(appDir, 'public', 'openapi-artifacts.json');

console.log('Generating Pagefind search index...');

if (!existsSync(distDir)) {
  console.error('dist directory not found. Run build first.');
  process.exit(1);
}

const validatedCollections = validateContentCollections(contentCollections, { rootDir: appDir });
const collectionArtifacts = readAllCollectionArtifacts(publicDir, validatedCollections);

if (!collectionArtifacts) {
  console.error('Generated docs artifacts not found. Run generate:docs first.');
  process.exit(1);
}

if (existsSync(pagefindOutputDir)) {
  rmSync(pagefindOutputDir, { recursive: true, force: true });
}

if (existsSync(searchPagesDir)) {
  rmSync(searchPagesDir, { recursive: true, force: true });
}

async function buildSearchIndex() {
  const { index } = await pagefind.createIndex();
  const openapiArtifacts = existsSync(openapiArtifactsPath)
    ? JSON.parse(readFileSync(openapiArtifactsPath, 'utf-8'))
    : null;
  const records = createPagefindRecords({
    collections: validatedCollections,
    artifactsByCollectionId: collectionArtifacts,
    openapiArtifacts,
  });

  for (const record of records) {
    await index.addCustomRecord(record);
  }

  await index.writeFiles({ outputPath: pagefindOutputDir });
  await pagefind.close();

  const documentationRecords = records.filter((record) => record.meta?.kind === 'documentation');
  const openapiRecords = records.length - documentationRecords.length;
  const collectionCounts = validatedCollections.map((collection) => {
    const count = documentationRecords.filter(
      (record) => record.meta?.collection === collection.id
    ).length;
    return `${collection.id}: ${count}`;
  });
  console.log(
    `Indexed ${records.length} search records (${collectionCounts.join(', ')}; OpenAPI: ${openapiRecords}).`
  );
  console.log(`Wrote Pagefind assets to ${pagefindOutputDir}`);
}

buildSearchIndex()
  .then(() => {
    console.log('Pagefind search index generated successfully.');
  })
  .catch(async (error) => {
    console.error('Failed to generate Pagefind search index:', error);
    await pagefind.close();
    process.exit(1);
  });
