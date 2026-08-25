import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

import {
  documentationTree,
  frameworkDocPaths,
} from '../shared/documentation-config.js';
import { resolveCollectionContentRoot } from './lib/collectionContentRoot.mjs';
import { getContentCollection } from '../shared/content-collections.js';

import { serializeArtifactJson } from './lib/docsArtifacts.mjs';
import { createGeneratedDocsArtifacts } from './lib/docsGeneration.mjs';
import { createContentCollectionManifest } from './lib/contentCollectionManifest.mjs';
import { createDocumentReferenceGraph } from './lib/referenceGraph.mjs';
import { serializePrettierJson } from './lib/formatArtifact.mjs';

async function readExistingIndex(indexPath) {
  try {
    return JSON.parse(await readFile(indexPath, 'utf-8'));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Could not read existing docs index at ${indexPath}: ${error.message}`);
    }

    return null;
  }
}

async function writeDocumentFiles(contentDir, documents) {
  await Promise.all(
    Object.entries(documents).map(async ([docPath, document]) => {
      const outputPath = join(contentDir, `${docPath}.json`);
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, serializeArtifactJson(document));
    })
  );
}

async function generateDocsContent() {
  console.log('Generating documentation content...');

  const rootDir = process.cwd();
  const contentDir = join(rootDir, 'public', 'docs-content');
  const indexPath = join(rootDir, 'public', 'docs-index.json');
  const previousIndex = await readExistingIndex(indexPath);
  const generatedAt = new Date().toISOString();
  const docsCollection = getContentCollection('docs');
  const { documents, index } = await createGeneratedDocsArtifacts({
    documentationTree,
    frameworkDocPaths,
    contentRoot: resolveCollectionContentRoot(docsCollection, rootDir),
    frameworkContentRoot: join(rootDir, 'src', 'docs', 'content'),
    previousIndex,
    generatedAt,
    rootDir,
    frontmatterSchema: docsCollection.frontmatterSchema,
  });

  await rm(contentDir, { recursive: true, force: true });
  await mkdir(contentDir, { recursive: true });
  await rm(join(rootDir, 'public', 'docs-content.json'), { force: true });
  await writeDocumentFiles(contentDir, documents);
  await writeFile(indexPath, serializeArtifactJson(index));
  await writeFile(
    join(rootDir, 'public', 'docs-collection.json'),
    await serializePrettierJson(
      createContentCollectionManifest({
        collection: docsCollection,
        index,
        documents,
      })
    )
  );
  await writeFile(
    join(rootDir, 'public', 'docs-references.json'),
    serializeArtifactJson(
      createDocumentReferenceGraph({
        documents,
        paths: index.paths,
        documentationTree,
        generated: index.generated,
      })
    )
  );

  console.log(`Generated documentation content for ${index.count} files`);
  console.log(`Generated ${Object.keys(documents).length} docs artifacts.`);
  console.log(`Content files saved to: ${contentDir}`);
  console.log(`Generated docs index: ${indexPath}`);
  return index;
}

generateDocsContent()
  .then((result) => {
    console.log('\nDocumentation generation complete.');
    console.log(`Generated ${result.count} documentation files`);
  })
  .catch((error) => {
    console.error(`Documentation generation failed: ${error.message}`);
    process.exitCode = 1;
  });
