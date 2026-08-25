import { existsSync, readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

import { getContentCollection } from '../shared/content-collections.js';
import {
  documentationTree,
  frameworkDocPaths,
  homepageConfig,
  openapiConfig,
} from '../shared/documentation-config.js';
import { resolveCollectionContentRoot } from './lib/collectionContentRoot.mjs';
import { buildDocsContentPath } from '../shared/docsRouting.js';
import { assertValidOpenApiConfig, validateOpenApiSpecUrl } from '../shared/openapiSpecUrls.js';
import { serializeArtifactJson } from './lib/docsArtifacts.mjs';
import { createGeneratedDocsArtifacts } from './lib/docsGeneration.mjs';
import { createContentCollectionManifest } from './lib/contentCollectionManifest.mjs';
import { createDocumentReferenceGraph } from './lib/referenceGraph.mjs';
import { createOpenApiArtifacts } from './lib/openapiArtifacts.mjs';
import { serializePrettierJson } from './lib/formatArtifact.mjs';
import { assertValidDocumentationContent } from './lib/contentValidation.mjs';
import {
  GENERATED_DOCS_SOURCE_ENV,
  diffMarkdownFileMaps,
  getGeneratedDocsSourceDir,
  readMarkdownFileMap,
} from './lib/generatedDocsSync.mjs';
import { createLlmsArtifacts } from './lib/llmsArtifacts.mjs';
import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import {
  createDefaultSocialImageManifest,
  createRobotsTxt,
  createSeoRouteEntries,
  createSitemapXml,
} from './lib/seoArtifacts.mjs';

const rootDir = process.cwd();
const publicDir = join(rootDir, 'public');
const docsContentDir = join(publicDir, 'docs-content');
const docsIndexPath = join(publicDir, 'docs-index.json');
const generatedDocsDir = join(rootDir, 'src', 'docs', 'content', 'generated');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readFileText(filePath) {
  return readFileSync(filePath, 'utf8');
}

async function listJsonFiles(dir, prefix = '') {
  if (!existsSync(dir)) {
    return [];
  }

  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listJsonFiles(absolutePath, relativePath)));
      continue;
    }

    if (entry.name.endsWith('.json')) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

async function main() {
  assertValidOpenApiConfig(openapiConfig);
  for (const spec of openapiConfig.specs) {
    const validatedUrl = validateOpenApiSpecUrl(spec.url, openapiConfig);
    if (validatedUrl.kind === 'local') {
      assert(
        existsSync(join(publicDir, validatedUrl.value.replace(/^\/+/, ''))),
        'Configured local OpenAPI asset is missing: ' + spec.url
      );
    }
  }

  const openapiArtifactsPath = join(publicDir, 'openapi-artifacts.json');
  assert(
    existsSync(openapiArtifactsPath),
    'Missing public/openapi-artifacts.json. Run `npm run generate:openapi`.'
  );
  const expectedOpenapiArtifacts = await serializePrettierJson(
    await createOpenApiArtifacts({ rootDir, publicDir, config: openapiConfig })
  );
  assert(
    readFileText(openapiArtifactsPath) === expectedOpenapiArtifacts,
    'public/openapi-artifacts.json is out of date. Run `npm run generate:openapi`.'
  );

  assert(
    existsSync(docsIndexPath),
    'Missing public/docs-index.json. Run `npm run build` or the generators first.'
  );
  assert(
    existsSync(docsContentDir),
    'Missing public/docs-content/. Run `npm run build` or the generators first.'
  );

  const existingIndex = JSON.parse(readFileText(docsIndexPath));
  const docsCollection = getContentCollection('docs');
  await assertValidDocumentationContent({
    documentationTree,
    frameworkDocPaths,
    contentRoot: resolveCollectionContentRoot(docsCollection, rootDir),
    frameworkContentRoot: join(rootDir, 'src', 'docs', 'content'),
    rootDir,
    frontmatterSchema: docsCollection.frontmatterSchema,
  });
  const { documents, index } = await createGeneratedDocsArtifacts({
    documentationTree,
    frameworkDocPaths,
    contentRoot: resolveCollectionContentRoot(docsCollection, rootDir),
    frameworkContentRoot: join(rootDir, 'src', 'docs', 'content'),
    previousIndex: existingIndex,
    rootDir,
    frontmatterSchema: docsCollection.frontmatterSchema,
  });

  const expectedIndex = serializeArtifactJson(index);
  const actualIndex = readFileText(docsIndexPath);
  assert(
    actualIndex === expectedIndex,
    'public/docs-index.json is out of date. Run `npm run generate:docs`.'
  );

  const collectionManifestPath = join(publicDir, 'docs-collection.json');
  assert(
    existsSync(collectionManifestPath),
    'Missing public/docs-collection.json. Run `npm run generate:docs`.'
  );
  const expectedCollectionManifest = await serializePrettierJson(
    createContentCollectionManifest({
      collection: docsCollection,
      index,
      documents,
    })
  );
  assert(
    readFileText(collectionManifestPath) === expectedCollectionManifest,
    'public/docs-collection.json is out of date. Run `npm run generate:docs`.'
  );

  const referencesPath = join(publicDir, 'docs-references.json');
  assert(
    existsSync(referencesPath),
    'Missing public/docs-references.json. Run `npm run generate:docs`.'
  );
  const expectedReferences = serializeArtifactJson(
    createDocumentReferenceGraph({
      documents,
      paths: index.paths,
      documentationTree,
      generated: index.generated,
    })
  );
  assert(
    readFileText(referencesPath) === expectedReferences,
    'public/docs-references.json is out of date. Run `npm run generate:docs`.'
  );

  const expectedDocumentKeys = Object.keys(documents).sort();
  const actualDocumentFiles = await listJsonFiles(docsContentDir);
  const actualDocumentKeys = actualDocumentFiles.map((filePath) => filePath.replace(/\.json$/, ''));
  const extraDocumentKeys = actualDocumentKeys.filter((key) => !expectedDocumentKeys.includes(key));
  const missingDocumentKeys = expectedDocumentKeys.filter(
    (key) => !actualDocumentKeys.includes(key)
  );

  assert(
    missingDocumentKeys.length === 0,
    `public/docs-content is missing generated docs: ${missingDocumentKeys.join(', ')}.`
  );
  assert(
    extraDocumentKeys.length === 0,
    `public/docs-content has stale generated docs: ${extraDocumentKeys.join(', ')}.`
  );

  for (const [documentKey, document] of Object.entries(documents)) {
    const filePath = join(docsContentDir, `${documentKey}.json`);
    const expectedDocument = serializeArtifactJson(document);
    const actualDocument = readFileText(filePath);
    assert(
      actualDocument === expectedDocument,
      `${filePath} is out of date. Run \`npm run generate:docs\`.`
    );
  }

  const hostedSkillPath = join(publicDir, 'skill.md');
  assert(
    existsSync(hostedSkillPath) && readFileText(hostedSkillPath).trim(),
    'public/skill.md is a repository-owned hosted asset and must exist and be non-empty.'
  );

  const { llmsTxt, llmsFullTxt } = createLlmsArtifacts({
    documentationTree,
    homepageConfig,
    openapiConfig,
    rootDir,
  });

  assert(
    readFileText(join(publicDir, 'llms.txt')) === llmsTxt,
    'public/llms.txt is out of date. Run `npm run generate:llms`.'
  );
  assert(
    readFileText(join(publicDir, 'llms-full.txt')) === llmsFullTxt,
    'public/llms-full.txt is out of date. Run `npm run generate:llms`.'
  );

  const mode = resolveEnvMode('production');
  const viteEnv = loadViteEnv(rootDir, mode);
  const siteName = viteEnv.VITE_SITE_NAME || homepageConfig.hero?.title || 'papers Docs';
  const siteUrl = viteEnv.VITE_SITE_URL || '';
  const siteSubtitle = homepageConfig.hero?.subtitle || 'Documentation';
  const siteDescription = homepageConfig.hero?.description || '';
  const routeEntries = createSeoRouteEntries(index, documents, {
    siteName,
    siteSubtitle,
    siteDescription,
  });
  const socialImages = createDefaultSocialImageManifest({
    siteName,
    siteSubtitle,
    siteDescription,
  });

  assert(
    readFileText(join(publicDir, 'robots.txt')) === `${createRobotsTxt(siteUrl)}\n`,
    'public/robots.txt is out of date. Run `npm run generate:seo`.'
  );
  assert(
    readFileText(join(publicDir, 'sitemap.xml')) === `${createSitemapXml(routeEntries, siteUrl)}\n`,
    'public/sitemap.xml is out of date. Run `npm run generate:seo`.'
  );
  assert(
    readFileText(join(publicDir, socialImages.ogImagePath.replace(/^\//, ''))) ===
      `${socialImages.ogImageContent}\n`,
    `public${socialImages.ogImagePath} is out of date. Run \`npm run generate:seo\`.`
  );
  assert(
    readFileText(join(publicDir, socialImages.twitterImagePath.replace(/^\//, ''))) ===
      `${socialImages.twitterImageContent}\n`,
    `public${socialImages.twitterImagePath} is out of date. Run \`npm run generate:seo\`.`
  );

  const sourceDir = getGeneratedDocsSourceDir({ rootDir });
  if (sourceDir) {
    assert(
      existsSync(sourceDir),
      `Configured ${GENERATED_DOCS_SOURCE_ENV} source does not exist: ${sourceDir}`
    );
    const sourceFiles = await readMarkdownFileMap(sourceDir);
    const destinationFiles = await readMarkdownFileMap(generatedDocsDir);
    const diff = diffMarkdownFileMaps(sourceFiles, destinationFiles);
    const hasDiff = diff.missing.length > 0 || diff.extra.length > 0 || diff.changed.length > 0;

    assert(
      !hasDiff,
      [
        `Generated docs drifted from ${sourceDir}. Run \`npm run sync:generated -- --source <dir>\` or set ${GENERATED_DOCS_SOURCE_ENV}.`,
        diff.missing.length > 0 ? `Missing: ${diff.missing.join(', ')}` : null,
        diff.extra.length > 0 ? `Extra: ${diff.extra.join(', ')}` : null,
        diff.changed.length > 0 ? `Changed: ${diff.changed.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  const sourcePathCheck = Object.keys(documents).find((documentKey) => {
    const defaultKey = buildDocsContentPath(documents[documentKey].path);
    return documentKey === defaultKey && typeof documents[documentKey].sourcePath !== 'string';
  });
  assert(!sourcePathCheck, `Generated doc ${sourcePathCheck} is missing sourcePath metadata.`);

  console.log('Docs artifact checks passed.');
}

main().catch((error) => {
  console.error('Docs artifact checks failed:', error.message);
  process.exit(1);
});
