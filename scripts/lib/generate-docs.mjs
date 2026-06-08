import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

import { documentationTree } from '../shared/documentation-config.js';
import { buildDocsContentPath, getDocsVariantContexts } from '../shared/docsRouting.js';

import {
  createDocumentArtifact,
  createDocsArtifacts,
  serializeArtifactJson,
  stabilizeIndexGeneration,
} from './lib/docsArtifacts.mjs';
import { resolveDocFileInfo } from './lib/docsVariants.mjs';

function collectDocumentPaths(items, paths = []) {
  for (const item of items) {
    if (item.type === 'file') {
      paths.push(item.path);
      continue;
    }

    if (item.type === 'directory' && item.children) {
      collectDocumentPaths(item.children, paths);
    }
  }

  return paths;
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

async function loadMarkdownContent(docPath, fileInfo = resolveDocFileInfo(docPath)) {
  try {
    if (!fileInfo) {
      console.warn(`File not found for "${docPath}"`);
      return `# File Not Found\n\nThe requested documentation file "${docPath}" could not be found.`;
    }

    const content = await readFile(fileInfo.filePath, 'utf-8');

    if (!content.trim()) {
      console.warn(`Empty file: ${fileInfo.filePath}`);
      return `# Empty File\n\nThe documentation file "${docPath}" appears to be empty.`;
    }

    return content;
  } catch (error) {
    console.error(`Error loading ${docPath}:`, error);
    return `# Error Loading Content\n\nFailed to load "${docPath}": ${error.message}`;
  }
}

async function buildVariantDocuments(docPaths) {
  const contexts = getDocsVariantContexts();
  const documents = {};
  const defaultDocsByPath = {};
  const defaultSourcePathsByPath = {};

  for (const context of contexts) {
    const label = context.key || 'default';
    console.log(`Processing docs variant: ${label}`);

    for (const docPath of docPaths) {
      const fileInfo = resolveDocFileInfo(docPath, {
        version: context.version,
        locale: context.locale,
      });
      const rawContent = await loadMarkdownContent(docPath, fileInfo);
      const documentKey = buildDocsContentPath(docPath, {
        version: context.version,
        locale: context.locale,
      });

      documents[documentKey] = createDocumentArtifact(docPath, rawContent, fileInfo?.sourcePath);

      if (context.isDefault) {
        defaultDocsByPath[docPath] = rawContent;

        if (fileInfo?.sourcePath) {
          defaultSourcePathsByPath[docPath] = fileInfo.sourcePath;
        }
      }
    }
  }

  return {
    documents,
    defaultDocsByPath,
    defaultSourcePathsByPath,
  };
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

    const docPaths = collectDocumentPaths(documentationTree);
    const { documents, defaultDocsByPath, defaultSourcePathsByPath } = await buildVariantDocuments(
      docPaths
    );
    const generatedAt = new Date().toISOString();
    const { index: nextIndex } = createDocsArtifacts(
      defaultDocsByPath,
      generatedAt,
      defaultSourcePathsByPath
    );
    const contentDir = join(process.cwd(), 'public', 'docs-content');
    const indexPath = join(process.cwd(), 'public', 'docs-index.json');
    const previousIndex = await readExistingIndex(indexPath);
    const index = stabilizeIndexGeneration(previousIndex, nextIndex, generatedAt);

    await rm(contentDir, { recursive: true, force: true });
    await mkdir(contentDir, { recursive: true });
    await rm(join(process.cwd(), 'public', 'docs-content.json'), { force: true });

    await writeDocumentFiles(contentDir, documents);

    console.log(`Generated documentation content for ${index.count} files`);
    console.log(`Generated ${Object.keys(documents).length} docs artifacts across ${getDocsVariantContexts().length} variant context(s)`);
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