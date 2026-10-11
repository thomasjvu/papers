import { readFile } from 'fs/promises';

import {
  buildCollectionContentPath,
  buildDocsContentPath,
  getCollectionRoutingOptions,
  getDocsVariantContexts,
} from '../../shared/docsRouting.js';
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
        `(expected ${options.contentDir || 'src/docs/content'}/${docPath}.md or .mdx).`
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
    throw new Error(`Source "${fileInfo.sourcePath}" for document "${documentKey}" is empty.`);
  }

  return content;
}

export async function buildVariantDocuments(docPaths, options = {}) {
  const routingOptions = options.collection
    ? getCollectionRoutingOptions(options.collection, options)
    : options;
  const contexts = getDocsVariantContexts(routingOptions);
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
      const contentDir = frameworkDocPaths.has(docPath)
        ? options.frameworkContentDir || options.contentDir
        : options.contentDir;
      const fileInfo = resolveDocFileInfo(docPath, {
        ...routingOptions,
        ...options,
        version: context.version,
        locale: context.locale,
        contentRoot,
        contentDir,
      });
      const documentKey = options.collection
        ? buildCollectionContentPath(options.collection, docPath, {
            ...routingOptions,
            ...options,
            version: context.version,
            locale: context.locale,
          })
        : buildDocsContentPath(docPath, {
            ...routingOptions,
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
            versionConfig: routingOptions.versionConfig,
            i18nConfig: routingOptions.i18nConfig,
            frontmatterSchema: options.frontmatterSchema,
            schemaAdapter: options.schemaAdapter,
            collectionId: options.collection?.id,
            collection: options.collection,
            routePrefix: options.collection?.routePrefix,
            schemaVersion: options.collection?.schemaVersion,
          }),
          {
            components: options.mdxComponents,
          }
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
  const docPaths = Array.from(
    new Set([...collectDocumentPaths(documentationTree), ...frameworkDocPaths])
  ).sort();
  await assertValidDocumentationContent({
    ...options,
    documentationTree,
    frameworkDocPaths,
    frontmatterSchema: options.frontmatterSchema,
    schemaAdapter: options.schemaAdapter,
    collection: options.collection,
    mdxComponents: options.mdxComponents,
    routeCollections: options.routeCollections,
    contentDir: options.contentDir,
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
