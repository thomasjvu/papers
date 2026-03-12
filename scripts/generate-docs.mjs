import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

import { documentationTree } from '../shared/documentation-config.js';

import { serializeArtifactJson } from './lib/docsArtifacts.mjs';
import { createGeneratedDocsArtifacts } from './lib/docsGeneration.mjs';

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
  try {
    console.log('Generating documentation content...');

    const contentDir = join(process.cwd(), 'public', 'docs-content');
    const indexPath = join(process.cwd(), 'public', 'docs-index.json');
    const previousIndex = await readExistingIndex(indexPath);
    const generatedAt = new Date().toISOString();
    const { documents, docPaths, index } = await createGeneratedDocsArtifacts({
      documentationTree,
      generatedAt,
      previousIndex,
      rootDir: process.cwd(),
    });

    await rm(contentDir, { recursive: true, force: true });
    await mkdir(contentDir, { recursive: true });
    await rm(join(process.cwd(), 'public', 'docs-content.json'), { force: true });

    await writeDocumentFiles(contentDir, documents);

    console.log(`Generated documentation content for ${index.count} files`);
    console.log(`Generated ${Object.keys(documents).length} docs artifacts from ${docPaths.length} source document(s)`);
    console.log(`Content files saved to: ${contentDir}`);

    await writeFile(indexPath, serializeArtifactJson(index));

    console.log(`Generated docs index: ${indexPath}`);
    return index;
  } catch (error) {
    console.error('Error generating documentation content:', error);
    process.exit(1);
  }
}

generateDocsContent().then((result) => {
  console.log('\nDocumentation generation complete.');
  console.log(`Generated ${result.count} documentation files`);
});
