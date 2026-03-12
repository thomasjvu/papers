import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

import { documentationTree } from '../shared/documentation-config.js';

import {
  createDocsArtifacts,
  serializeArtifactJson,
  stabilizeIndexGeneration,
} from './lib/docsArtifacts.mjs';

function resolveDocFilePath(docPath) {
  const extensions = ['.md', '.mdx'];

  for (const extension of extensions) {
    const filePath = join(process.cwd(), 'src/docs/content', `${docPath}${extension}`);
    if (existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

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

async function loadMarkdownContent(docPath) {
  try {
    const filePath = resolveDocFilePath(docPath);

    if (!filePath) {
      console.warn(`File not found for "${docPath}"`);
      return `# File Not Found\n\nThe requested documentation file "${docPath}" could not be found.`;
    }

    const content = await readFile(filePath, 'utf-8');

    if (!content.trim()) {
      console.warn(`Empty file: ${filePath}`);
      return `# Empty File\n\nThe documentation file "${docPath}" appears to be empty.`;
    }

    return content;
  } catch (error) {
    console.error(`Error loading ${docPath}:`, error);
    return `# Error Loading Content\n\nFailed to load "${docPath}": ${error.message}`;
  }
}

async function processFileItems(items) {
  const result = {};

  for (const item of items) {
    if (item.type === 'file') {
      console.log(`Processing: ${item.path}`);
      result[item.path] = await loadMarkdownContent(item.path);
    } else if (item.type === 'directory' && item.children) {
      const childResults = await processFileItems(item.children);
      Object.assign(result, childResults);
    }
  }

  return result;
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

    const rawContent = await processFileItems(documentationTree);
    const generatedAt = new Date().toISOString();
    const { index: nextIndex, documents } = createDocsArtifacts(rawContent, generatedAt);
    const contentDir = join(process.cwd(), 'public', 'docs-content');
    const indexPath = join(process.cwd(), 'public', 'docs-index.json');
    const previousIndex = await readExistingIndex(indexPath);
    const index = stabilizeIndexGeneration(previousIndex, nextIndex, generatedAt);

    await rm(contentDir, { recursive: true, force: true });
    await mkdir(contentDir, { recursive: true });
    await rm(join(process.cwd(), 'public', 'docs-content.json'), { force: true });

    await writeDocumentFiles(contentDir, documents);

    console.log(`Generated documentation content for ${index.count} files`);
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
