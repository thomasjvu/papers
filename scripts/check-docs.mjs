import { existsSync, readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

import {
  contentCollections,
  getCollectionArtifactPaths,
  getCollectionVariants,
  validateContentCollections,
} from '../shared/content-collections.js';
import { homepageConfig, openapiConfig } from '../shared/documentation-config.js';
import { resolveCollectionContentRoot } from './lib/collectionContentRoot.mjs';
import { buildCollectionContentPath, buildDocsContentPath } from '../shared/docsRouting.js';
import { assertValidOpenApiConfig, validateOpenApiSpecUrl } from '../shared/openapiSpecUrls.js';
import { serializeArtifactJson } from './lib/docsArtifacts.mjs';
import { collectDocumentPaths, createGeneratedDocsArtifacts } from './lib/docsGeneration.mjs';
import {
  createContentCollectionManifest,
  createContentCollectionsManifest,
} from './lib/contentCollectionManifest.mjs';
import { createDocumentReferenceGraph } from './lib/referenceGraph.mjs';
import { createOpenApiArtifacts } from './lib/openapiArtifacts.mjs';
import { serializePrettierJson } from './lib/formatArtifact.mjs';
import {
  createCollectionGenerationOptions,
  getCollectionFrameworkDocPaths,
} from './generate-docs.mjs';
import {
  GENERATED_DOCS_SOURCE_ENV,
  diffMarkdownFileMaps,
  getGeneratedDocsSourceDir,
  readMarkdownFileMap,
} from './lib/generatedDocsSync.mjs';
import { createAllLlmsArtifacts, createHostedSkillArtifact } from './lib/llmsArtifacts.mjs';
import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import { createAgentDiscoveryManifest } from '../shared/seo.js';
import {
  createDefaultSocialImageManifest,
  createRobotsTxt,
  createAllCollectionSeoRouteEntries,
  createSitemapXml,
} from './lib/seoArtifacts.mjs';

const rootDir = process.cwd();
const publicDir = join(rootDir, 'public');
const generatedDocsDir = join(rootDir, 'src', 'docs', 'content', 'generated');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readFileText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function resolvePublicArtifactPath(artifactPath) {
  return join(publicDir, artifactPath.replace(/^\/+/, ''));
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
  const openapiArtifacts = await createOpenApiArtifacts({
    rootDir,
    publicDir,
    config: openapiConfig,
  });
  const expectedOpenapiArtifacts = await serializePrettierJson(openapiArtifacts);
  assert(
    readFileText(openapiArtifactsPath) === expectedOpenapiArtifacts,
    'public/openapi-artifacts.json is out of date. Run `npm run generate:openapi`.'
  );

  const collections = validateContentCollections(contentCollections, { rootDir });
  const routeCollections = collections.map((collection) => ({
    collection,
    documentationTree: collection.tree,
    documentPaths: Array.from(
      new Set([
        ...collectDocumentPaths(collection.tree || []),
        ...getCollectionFrameworkDocPaths(collection),
      ])
    ).sort(),
  }));
  const artifactsByCollectionId = {};
  const manifests = {};

  for (const collection of collections) {
    const artifactPaths = getCollectionArtifactPaths(collection);
    const indexPath = resolvePublicArtifactPath(artifactPaths.index);
    const contentDir = resolvePublicArtifactPath(artifactPaths.content);
    const manifestPath = resolvePublicArtifactPath(artifactPaths.manifest);
    const referencesPath = resolvePublicArtifactPath(artifactPaths.references);

    assert(existsSync(indexPath), `Missing ${artifactPaths.index}. Run \`npm run generate:docs\`.`);
    assert(
      existsSync(contentDir),
      `Missing ${artifactPaths.content}/. Run \`npm run generate:docs\`.`
    );
    assert(
      existsSync(manifestPath),
      `Missing ${artifactPaths.manifest}. Run \`npm run generate:docs\`.`
    );
    assert(
      existsSync(referencesPath),
      `Missing ${artifactPaths.references}. Run \`npm run generate:docs\`.`
    );

    const generationOptions = createCollectionGenerationOptions({
      collection,
      rootDir,
      publicDir,
      routeCollections,
    });
    generationOptions.previousIndex = JSON.parse(readFileText(indexPath));
    const { documents, index } = await createGeneratedDocsArtifacts(generationOptions);
    const collectionManifest = createContentCollectionManifest({
      collection,
      index,
      documents,
    });
    const variants = getCollectionVariants(collection);
    const references = createDocumentReferenceGraph({
      documents,
      paths: index.paths,
      documentationTree: collection.tree,
      generated: index.generated,
      collection,
      versionConfig: variants.versionConfig,
      i18nConfig: variants.i18nConfig,
    });

    assert(
      readFileText(indexPath) === serializeArtifactJson(index),
      `${artifactPaths.index} is out of date. Run \`npm run generate:docs\`.`
    );
    assert(
      readFileText(manifestPath) === (await serializePrettierJson(collectionManifest)),
      `${artifactPaths.manifest} is out of date. Run \`npm run generate:docs\`.`
    );
    assert(
      readFileText(referencesPath) === serializeArtifactJson(references),
      `${artifactPaths.references} is out of date. Run \`npm run generate:docs\`.`
    );

    const expectedDocumentKeys = Object.keys(documents).sort();
    const actualDocumentFiles = await listJsonFiles(contentDir);
    const actualDocumentKeys = actualDocumentFiles.map((filePath) =>
      filePath.replace(/\.json$/, '')
    );
    const extraDocumentKeys = actualDocumentKeys.filter(
      (key) => !expectedDocumentKeys.includes(key)
    );
    const missingDocumentKeys = expectedDocumentKeys.filter(
      (key) => !actualDocumentKeys.includes(key)
    );

    assert(
      missingDocumentKeys.length === 0,
      `${artifactPaths.content} is missing generated docs: ${missingDocumentKeys.join(', ')}.`
    );
    assert(
      extraDocumentKeys.length === 0,
      `${artifactPaths.content} has stale generated docs: ${extraDocumentKeys.join(', ')}.`
    );

    for (const [documentKey, document] of Object.entries(documents)) {
      const filePath = join(contentDir, `${documentKey}.json`);
      assert(
        readFileText(filePath) === serializeArtifactJson(document),
        `${filePath} is out of date. Run \`npm run generate:docs\`.`
      );
    }

    artifactsByCollectionId[collection.id] = { index, documents };
    manifests[collection.id] = collectionManifest;
  }

  const collectionsManifestPath = join(publicDir, 'collections.json');
  assert(
    existsSync(collectionsManifestPath),
    'Missing public/collections.json. Run `npm run generate:docs`.'
  );
  assert(
    readFileText(collectionsManifestPath) ===
      (await serializePrettierJson(createContentCollectionsManifest({ collections, manifests }))),
    'public/collections.json is out of date. Run `npm run generate:docs`.'
  );

  const primaryCollection =
    collections.find((collection) => collection.id === 'docs') || collections[0];
  assert(primaryCollection, 'At least one content collection must be configured.');

  const hostedSkillPath = join(publicDir, 'skill.md');
  assert(
    existsSync(hostedSkillPath) && readFileText(hostedSkillPath).trim(),
    'public/skill.md is a repository-owned hosted asset and must exist and be non-empty.'
  );

  const mode = resolveEnvMode('production');
  const viteEnv = loadViteEnv(rootDir, mode);
  const siteName = viteEnv.VITE_SITE_NAME || homepageConfig.hero?.title || 'papers Docs';
  const siteUrl = viteEnv.VITE_SITE_URL || '';
  const siteSubtitle = homepageConfig.hero?.subtitle || 'Documentation';
  const siteDescription = homepageConfig.hero?.description || '';
  const skillSource = readFileText(
    join(resolveCollectionContentRoot(primaryCollection, rootDir), 'skill.md')
  );
  assert(
    readFileText(hostedSkillPath) ===
      createHostedSkillArtifact(skillSource, {
        name: `${siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-docs`,
      }),
    'public/skill.md is out of date. Run `npm run generate:llms`.'
  );
  const agentManifestPath = join(publicDir, 'agents.json');
  assert(existsSync(agentManifestPath), 'Missing public/agents.json. Run `npm run generate:llms`.');
  assert(
    readFileText(agentManifestPath) ===
      `${JSON.stringify(
        createAgentDiscoveryManifest({
          siteName,
          siteUrl,
          description: siteDescription,
          collections,
        }),
        null,
        2
      )}\n`,
    'public/agents.json is out of date. Run `npm run generate:llms`.'
  );

  const { llmsTxt, llmsFullTxt } = createAllLlmsArtifacts({
    collections,
    homepageConfig,
    rootDir,
    siteUrl,
    openapiArtifacts,
    getCollectionVariants,
  });

  assert(
    readFileText(join(publicDir, 'llms.txt')) === llmsTxt,
    'public/llms.txt is out of date. Run `npm run generate:llms`.'
  );
  assert(
    readFileText(join(publicDir, 'llms-full.txt')) === llmsFullTxt,
    'public/llms-full.txt is out of date. Run `npm run generate:llms`.'
  );

  const routeEntries = createAllCollectionSeoRouteEntries(collections, artifactsByCollectionId, {
    siteName,
    siteSubtitle,
    siteDescription,
    openapiArtifacts,
    collections,
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

  const primaryVariants = getCollectionVariants(primaryCollection);
  const sourcePathCheck = Object.keys(artifactsByCollectionId[primaryCollection.id].documents).find(
    (documentKey) => {
      const document = artifactsByCollectionId[primaryCollection.id].documents[documentKey];
      const defaultKey =
        primaryCollection.id === 'docs'
          ? buildDocsContentPath(document.path)
          : buildCollectionContentPath(primaryCollection, document.path, primaryVariants);
      return documentKey === defaultKey && typeof document.sourcePath !== 'string';
    }
  );
  assert(!sourcePathCheck, `Generated doc ${sourcePathCheck} is missing sourcePath metadata.`);

  console.log('Docs artifact checks passed.');
}

main().catch((error) => {
  console.error('Docs artifact checks failed:', error.message);
  process.exit(1);
});
