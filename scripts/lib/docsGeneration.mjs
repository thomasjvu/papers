import { readFile } from 'fs/promises';

import { buildDocsContentPath, getDocsVariantContexts } from '../../shared/docsRouting.js';
import {
  createDocumentArtifact,
  createDocsArtifacts,
  stabilizeIndexGeneration,
} from './docsArtifacts.mjs';
import { resolveDocFileInfo } from './docsVariants.mjs';

export function collectDocumentPaths(items, paths = []) {
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

async function loadMarkdownContent(docPath, options = {}, fileInfo = resolveDocFileInfo(docPath, options)) {
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

export async function buildVariantDocuments(docPaths, options = {}) {
  const contexts = getDocsVariantContexts(options);
  const documents = {};
  const defaultDocsByPath = {};
  const defaultSourcePathsByPath = {};

  for (const context of contexts) {
    const label = context.key || 'default';
    console.log(`Processing docs variant: ${label}`);

    for (const docPath of docPaths) {
      const fileInfo = resolveDocFileInfo(docPath, {
        ...options,
        version: context.version,
        locale: context.locale,
      });
      const rawContent = await loadMarkdownContent(docPath, options, fileInfo);
      const documentKey = buildDocsContentPath(docPath, {
        ...options,
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
    variantContexts: contexts,
  };
}

export async function createGeneratedDocsArtifacts(options = {}) {
  const documentationTree = options.documentationTree || [];
  const generatedAt = options.generatedAt || new Date().toISOString();
  const previousIndex = options.previousIndex || null;
  const docPaths = collectDocumentPaths(documentationTree);
  const { documents, defaultDocsByPath, defaultSourcePathsByPath } = await buildVariantDocuments(
    docPaths,
    options
  );
  const { index: nextIndex } = createDocsArtifacts(
    defaultDocsByPath,
    generatedAt,
    defaultSourcePathsByPath
  );
  const index = stabilizeIndexGeneration(previousIndex, nextIndex, generatedAt);

  return {
    docPaths,
    documents,
    index,
  };
}
