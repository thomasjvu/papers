import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

import { documentationTree } from '../shared/documentation-config.js';

import { createDocsArtifacts } from './lib/docsArtifacts.mjs';

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
      await writeFile(outputPath, JSON.stringify(document, null, 2));
    })
  );
}

async function generateDocsContent() {
  try {
    console.log('Generating documentation content...');

    const rawContent = await processFileItems(documentationTree);
    const { index, documents } = createDocsArtifacts(rawContent, new Date().toISOString());
    const contentDir = join(process.cwd(), 'public', 'docs-content');

    await rm(contentDir, { recursive: true, force: true });
    await mkdir(contentDir, { recursive: true });
    await rm(join(process.cwd(), 'public', 'docs-content.json'), { force: true });

    await writeDocumentFiles(contentDir, documents);

    console.log(`Generated documentation content for ${index.count} files`);
    console.log(`Content files saved to: ${contentDir}`);

    const indexPath = join(process.cwd(), 'public', 'docs-index.json');
    await writeFile(indexPath, JSON.stringify(index, null, 2));

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
