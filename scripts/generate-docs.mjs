import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  contentCollections,
  getCollectionFrontmatterSchema,
  getCollectionSchemaAdapter,
  getCollectionVariants,
  validateContentCollections,
} from '../shared/content-collections.js';
import {
  frameworkDocPaths,
  i18nConfig,
  openapiConfig,
  uiStringsConfig,
} from '../shared/documentation-config.js';
import { validateUiStringsConfig } from '../shared/uiStrings.js';
import { getCollectionArtifactFiles } from './lib/collectionArtifacts.mjs';
import { serializeArtifactJson } from './lib/docsArtifacts.mjs';
import { collectDocumentPaths, createGeneratedDocsArtifacts } from './lib/docsGeneration.mjs';
import {
  createContentCollectionManifest,
  createContentCollectionsManifest,
} from './lib/contentCollectionManifest.mjs';
import { createDocumentReferenceGraph } from './lib/referenceGraph.mjs';
import { serializePrettierJson } from './lib/formatArtifact.mjs';
import {
  resolveCollectionContentRoot,
  resolveCollectionFrameworkContentRoot,
} from './lib/collectionContentRoot.mjs';

const uiStringProblems = validateUiStringsConfig(uiStringsConfig, i18nConfig.locales || []);
if (uiStringProblems.length > 0) {
  throw new Error(`Invalid uiStringsConfig:\n- ${uiStringProblems.join('\n- ')}`);
}

async function readExistingJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Could not read generated artifact at ${filePath}: ${error.message}`);
    }
    return null;
  }
}

async function writeDocumentFiles(contentDir, documents) {
  await Promise.all(
    Object.entries(documents)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(async ([docPath, document]) => {
        const outputPath = join(contentDir, `${docPath}.json`);
        await mkdir(join(outputPath, '..'), { recursive: true });
        await writeFile(outputPath, serializeArtifactJson(document));
      })
  );
}

export function getCollectionFrameworkDocPaths(collection) {
  if (Array.isArray(collection.frameworkDocPaths)) {
    return collection.frameworkDocPaths;
  }

  return collection.id === 'docs' ? frameworkDocPaths : [];
}

/** A collection with the sorted, de-duplicated document paths its routes are built from. */
export function createCollectionDocumentPaths(collection) {
  return {
    collection,
    documentationTree: collection.tree,
    documentPaths: Array.from(
      new Set([
        ...collectDocumentPaths(collection.tree || []),
        ...getCollectionFrameworkDocPaths(collection),
      ])
    ).sort(),
  };
}

function getCollectionOpenApiConfig(collection) {
  if (collection.openapiConfig) {
    return collection.openapiConfig;
  }

  return collection.id === 'docs'
    ? openapiConfig
    : {
        enabled: false,
        pagePath: 'api-reference/openapi',
        defaultSpecId: 'public',
        specs: [],
      };
}

export function createCollectionGenerationOptions({
  collection,
  rootDir,
  publicDir,
  routeCollections,
}) {
  const variants = getCollectionVariants(collection);
  const frameworkPaths = getCollectionFrameworkDocPaths(collection);

  return {
    collection,
    documentationTree: collection.tree,
    frameworkDocPaths: frameworkPaths,
    contentRoot: resolveCollectionContentRoot(collection, rootDir),
    contentDir: collection.contentDir,
    frameworkContentRoot: resolveCollectionFrameworkContentRoot(collection, rootDir),
    frameworkContentDir: collection.frameworkContentDir || collection.contentDir,
    previousIndex: null,
    rootDir,
    publicDir,
    frontmatterSchema: getCollectionFrontmatterSchema(collection),
    schemaAdapter: getCollectionSchemaAdapter(collection),
    versionConfig: variants.versionConfig,
    i18nConfig: variants.i18nConfig,
    openapiConfig: getCollectionOpenApiConfig(collection),
    mdxComponents: collection.mdxComponents,
    routeCollections,
  };
}

async function removeCollectionArtifacts(publicDir, collection) {
  const { indexPath, contentDir, manifestPath, referencesPath } = getCollectionArtifactFiles(
    publicDir,
    collection
  );
  await rm(indexPath, { force: true });
  await rm(contentDir, { recursive: true, force: true });
  await rm(manifestPath, { force: true });
  await rm(referencesPath, { force: true });
}

/**
 * Generate every configured collection. The returned helper is also used by
 * fixture tests so multi-collection behavior is proven without mutating the
 * repository's configured content tree.
 */
export async function generateDocsContent({
  rootDir = process.cwd(),
  publicDir = join(rootDir, 'public'),
  collections = contentCollections,
} = {}) {
  const validatedCollections = validateContentCollections(collections, { rootDir });
  const previousCollectionsManifest = await readExistingJson(join(publicDir, 'collections.json'));
  const collectionDocumentPaths = validatedCollections.map(createCollectionDocumentPaths);
  const manifests = {};
  const artifactsByCollectionId = {};

  await mkdir(publicDir, { recursive: true });

  if (Array.isArray(previousCollectionsManifest?.collections)) {
    const activeNamespaces = new Set(
      validatedCollections.map((collection) => collection.artifactNamespace || collection.id)
    );

    for (const previousCollection of previousCollectionsManifest.collections) {
      if (!activeNamespaces.has(previousCollection.artifactNamespace || previousCollection.id)) {
        await removeCollectionArtifacts(publicDir, {
          id: previousCollection.id,
          artifactNamespace: previousCollection.artifactNamespace || previousCollection.id,
        });
      }
    }
  }

  console.log(
    `Generating documentation content for ${validatedCollections.length} collection(s)...`
  );

  for (const collection of validatedCollections) {
    const { indexPath, contentDir, manifestPath, referencesPath } = getCollectionArtifactFiles(
      publicDir,
      collection
    );
    const options = createCollectionGenerationOptions({
      collection,
      rootDir,
      publicDir,
      routeCollections: collectionDocumentPaths,
    });
    options.previousIndex = await readExistingJson(indexPath);

    const generated = await createGeneratedDocsArtifacts(options);
    const collectionManifest = createContentCollectionManifest({
      collection,
      index: generated.index,
      documents: generated.documents,
    });
    const references = createDocumentReferenceGraph({
      documents: generated.documents,
      paths: generated.index.paths,
      documentationTree: collection.tree,
      generated: generated.index.generated,
      collection,
      versionConfig: options.versionConfig,
      i18nConfig: options.i18nConfig,
    });

    await rm(contentDir, { recursive: true, force: true });
    await mkdir(contentDir, { recursive: true });
    await writeDocumentFiles(contentDir, generated.documents);
    await writeFile(indexPath, serializeArtifactJson(generated.index));
    await writeFile(manifestPath, await serializePrettierJson(collectionManifest));
    await writeFile(referencesPath, serializeArtifactJson(references));

    manifests[collection.id] = collectionManifest;
    artifactsByCollectionId[collection.id] = {
      index: generated.index,
      documents: generated.documents,
      manifest: collectionManifest,
      references,
    };

    console.log(
      `Generated ${collection.id}: ${generated.index.count} files and ${Object.keys(generated.documents).length} artifact records.`
    );
  }

  await rm(join(publicDir, 'docs-content.json'), { force: true });
  await writeFile(
    join(publicDir, 'collections.json'),
    await serializePrettierJson(
      createContentCollectionsManifest({
        collections: validatedCollections,
        manifests,
      })
    )
  );

  return {
    collections: validatedCollections,
    artifactsByCollectionId,
    manifests,
  };
}

async function main() {
  await generateDocsContent();
  console.log('\nDocumentation generation complete.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Documentation generation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
