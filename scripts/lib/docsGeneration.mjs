import { readFile } from 'fs/promises';

import { buildDocsContentPath, getDocsVariantContexts } from '../../shared/docsRouting.js';
import {
  createDocumentArtifact,
  createDocsArtifacts,
  enrichDocumentArtifact,
  stabilizeIndexGeneration,
} from './docsArtifacts.mjs';
import { assertValidDocumentationContent } from './contentValidation.mjs';
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

async function loadMarkdownContent(
  docPath,
  documentKey,
  options = {},
  fileInfo = resolveDocFileInfo(docPath, options)
) {
  if (!fileInfo) {
    throw new Error(
      `Document "${documentKey}" source not found for "${docPath}" ` +
        `(expected src/docs/content/${docPath}.md or .mdx).`
    );
  }

  let content;

  try {
    content = await readFile(fileInfo.filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Unable to read source "${fileInfo.sourcePath}" for document "${documentKey}": ${error.message}`
    );
  }

  if (!content.trim()) {
    throw new Error(
      `Source "${fileInfo.sourcePath}" for document "${documentKey}" is empty.`
    );
  }

  return content;
}

export async function buildVariantDocuments(docPaths, options = {}) {
  const contexts = getDocsVariantContexts(options);
  const documents = {};
  const defaultDocsByPath = {};
  const defaultSourcePathsByPath = {};
  const frameworkDocPaths = new Set(options.frameworkDocPaths || []);

  for (const context of contexts) {
    const label = context.key || 'default';
    console.log(`Processing docs variant: ${label}`);

    for (const docPath of docPaths) {
      const contentRoot = frameworkDocPaths.has(docPath)
        ? options.frameworkContentRoot
        : options.contentRoot;
      const fileInfo = resolveDocFileInfo(docPath, {
        ...options,
        version: context.version,
        locale: context.locale,
        contentRoot,
      });
      const documentKey = buildDocsContentPath(docPath, {
        ...options,
        version: context.version,
        locale: context.locale,
      });
      const rawContent = await loadMarkdownContent(docPath, documentKey, options, fileInfo);

      if (Object.hasOwn(documents, documentKey)) {
        throw new Error(`Duplicate generated document key "${documentKey}".`);
      }

      try {
        documents[documentKey] = await enrichDocumentArtifact(
          createDocumentArtifact(docPath, rawContent, fileInfo.sourcePath, {
            version: context.version,
            locale: context.locale,
            versionConfig: options.versionConfig,
            i18nConfig: options.i18nConfig,
            frontmatterSchema: options.frontmatterSchema,
          })
        );
      } catch (error) {
        const lineSuffix = error.lineNumber ? `:${error.lineNumber}` : '';
        throw new Error(
          `Failed to parse or compile source "${fileInfo.sourcePath}${lineSuffix}" for document "${documentKey}": ${error.message}`
        );
      }

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
  const frameworkDocPaths = options.frameworkDocPaths || [];
  const generatedAt = options.generatedAt || new Date().toISOString();
  const previousIndex = options.previousIndex || null;
  const docPaths = [...collectDocumentPaths(documentationTree), ...frameworkDocPaths];
  await assertValidDocumentationContent({
    ...options,
    documentationTree,
    frameworkDocPaths,
    frontmatterSchema: options.frontmatterSchema,
  });
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
