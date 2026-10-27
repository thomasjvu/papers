import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { posix } from 'node:path';

import {
  documentationTree as defaultDocumentationTree,
  i18nConfig as defaultI18nConfig,
  openapiConfig as defaultOpenapiConfig,
  versionConfig as defaultVersionConfig,
} from '../../shared/documentation-config.js';
import {
  buildCollectionContentPath,
  buildCollectionRouteVariants,
  buildDocsContentPath,
  buildDocsRouteVariants,
  getCollectionRoutingOptions,
  getDocsVariantContexts,
  getDocumentationFeatureValidationIssues,
} from '../../shared/docsRouting.js';
import { buildOpenApiRoutePath } from '../../shared/openapiRouting.js';
import { getDefaultDocumentPath, getDirectoryAliasEntries } from '../../shared/seo.js';
import { createDocumentToc, extractDocumentLinks, parseFrontmatter } from './docsArtifacts.mjs';
import { validateMdxComponentsInSource } from './mdxCompile.mjs';
import { splitTargetSuffix } from './linkTargets.mjs';

const DOCUMENT_EXTENSIONS = new Set(['.md', '.mdx']);
export const EXCLUDED_SOURCE_DIRECTORIES = new Set(['generated', 'variants']);

function normalizeSlashes(value) {
  return value.replaceAll(sep, '/').replaceAll('\\', '/');
}

function stripDocumentExtension(value) {
  return value.replace(/\.(?:md|mdx)$/i, '');
}

function normalizeDocPath(value) {
  const normalized = posix.normalize(value.replaceAll('\\', '/')).replace(/^\.\//, '');
  return normalized === '.' ? '' : normalized.replace(/^\/+|\/+$/g, '');
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function lineNumberAt(content, offset) {
  return content.slice(0, offset).split(/\r?\n/).length;
}

export function collectDocumentationPaths(items, paths = []) {
  for (const item of items || []) {
    if (item.type === 'file') {
      paths.push(item.path);
      continue;
    }

    if (item.type === 'directory' && Array.isArray(item.children)) {
      collectDocumentationPaths(item.children, paths);
    }
  }

  return paths;
}

async function collectMarkdownFiles(directory, rootDirectory = directory, options = {}) {
  if (!existsSync(directory)) {
    return [];
  }

  const excludedDirectories = options.excludedDirectories || new Set();
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (excludedDirectories.has(entry.name)) {
        continue;
      }

      files.push(...(await collectMarkdownFiles(absolutePath, rootDirectory, options)));
      continue;
    }

    if (!DOCUMENT_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      continue;
    }

    const relativePath = normalizeSlashes(relative(rootDirectory, absolutePath));
    files.push({
      absolutePath,
      relativePath,
      documentPath: stripDocumentExtension(relativePath),
    });
  }

  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function getVariantDocumentPath(relativePath) {
  const segments = relativePath.split('/');
  const variantIndex = segments.indexOf('variants');

  if (variantIndex === -1) {
    return stripDocumentExtension(relativePath);
  }

  let index = variantIndex + 1;
  while (index < segments.length - 1 && ['versions', 'locales'].includes(segments[index])) {
    index += 2;
  }

  return stripDocumentExtension(segments.slice(index).join('/'));
}

function isVariantSource(file) {
  return file.relativePath.split('/').includes('variants');
}

function toSourcePath(rootDir, absolutePath) {
  return normalizeSlashes(relative(rootDir, absolutePath));
}

function addRoute(routeMap, ambiguousRoutes, routePath, target) {
  const normalizedRoute = routePath.replace(/\/+$/, '') || '/';
  const existing = routeMap.get(normalizedRoute);

  if (!existing) {
    routeMap.set(normalizedRoute, target);
    return;
  }

  if (existing.type !== target.type || existing.documentPath !== target.documentPath) {
    ambiguousRoutes.add(normalizedRoute);
  }
}

function createRouteModel({
  collection,
  documentationTree,
  documentPaths,
  openapiConfig,
  versionConfig,
  i18nConfig,
  routeCollections,
}) {
  const routeMap = new Map();
  const ambiguousRoutes = new Set();
  const routeOptions = { versionConfig, i18nConfig };
  const collectionEntries = routeCollections || [
    {
      collection,
      documentationTree,
      documentPaths,
    },
  ];

  addRoute(routeMap, ambiguousRoutes, '/', { type: 'site' });

  for (const entry of collectionEntries) {
    const entryOptions = entry.collection
      ? getCollectionRoutingOptions(entry.collection, routeOptions)
      : routeOptions;
    const buildRoutes = entry.collection
      ? (path) => buildCollectionRouteVariants(entry.collection, path, entryOptions)
      : (path) => buildDocsRouteVariants(path, entryOptions);
    const routePrefix = entry.collection?.routePrefix || '/docs';

    for (const documentPath of entry.documentPaths) {
      for (const routePath of buildRoutes(documentPath)) {
        addRoute(routeMap, ambiguousRoutes, routePath, {
          type: 'document',
          collectionId: entry.collection?.id || 'docs',
          documentPath,
        });
      }
    }

    const defaultDocumentPath =
      getDefaultDocumentPath(entry.documentationTree) || entry.documentPaths[0];
    if (defaultDocumentPath) {
      addRoute(routeMap, ambiguousRoutes, routePrefix, {
        type: 'document',
        collectionId: entry.collection?.id || 'docs',
        documentPath: defaultDocumentPath,
      });
    }

    const normalizedPrefix = String(routePrefix).replace(/^\/+|\/+$/g, '');
    const prefixPattern = new RegExp(`^/${normalizedPrefix}/?`);
    for (const alias of getDirectoryAliasEntries(entry.documentationTree, normalizedPrefix)) {
      const aliasPath = alias.routePath.replace(prefixPattern, '');
      for (const routePath of buildRoutes(aliasPath)) {
        addRoute(routeMap, ambiguousRoutes, routePath, {
          type: 'document',
          collectionId: entry.collection?.id || 'docs',
          documentPath: alias.docPath,
        });
      }
    }
  }

  if (!collection || collection.id === 'docs') {
    addRoute(routeMap, ambiguousRoutes, '/llms', {
      type: 'document',
      collectionId: 'docs',
      documentPath: 'llms',
    });
    addRoute(routeMap, ambiguousRoutes, '/skill', {
      type: 'document',
      collectionId: 'docs',
      documentPath: 'skill',
    });
  }

  if (openapiConfig?.enabled) {
    const openapiDocumentPath = normalizeDocPath(openapiConfig.pagePath || '');
    for (const spec of openapiConfig.specs || []) {
      const specId = spec.id === openapiConfig.defaultSpecId ? null : spec.id;

      if (specId === null && documentPaths.includes(openapiDocumentPath)) {
        continue;
      }

      addRoute(routeMap, ambiguousRoutes, buildOpenApiRoutePath(openapiConfig, specId), {
        type: 'openapi',
        specId: spec.id,
      });
    }
  }

  return { routeMap, ambiguousRoutes };
}

function resolveRouteTarget(pathname, routeModel) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return routeModel.routeMap.get(normalized) || null;
}

function getHeadingIds(content, frontmatterSchema) {
  return new Set(createDocumentToc(content, frontmatterSchema).map((heading) => heading.id));
}

function getAnchorFromSuffix(suffix) {
  if (!suffix.startsWith('#')) {
    return null;
  }

  const rawAnchor = suffix.slice(1).split('?')[0];
  if (!rawAnchor) {
    return '';
  }

  return safeDecode(rawAnchor);
}

function findSourceRecord(documentPath, sourceRecords) {
  return (
    sourceRecords.find((record) => record.documentPath === documentPath && !record.isVariant) ||
    sourceRecords.find((record) => record.documentPath === documentPath) ||
    null
  );
}

function checkAnchor(
  targetRecord,
  suffix,
  sourceRecords,
  issues,
  sourcePath,
  line,
  frontmatterSchema
) {
  const anchor = getAnchorFromSuffix(suffix);
  if (anchor === null || anchor === '') {
    return;
  }

  const decodedAnchor = safeDecode(anchor);
  if (decodedAnchor === null) {
    issues.push(`${sourcePath}:${line}: invalid encoded heading anchor "${anchor}"`);
    return;
  }

  const resolvedRecord = findSourceRecord(targetRecord.documentPath, sourceRecords);
  if (
    !resolvedRecord ||
    !getHeadingIds(resolvedRecord.content, frontmatterSchema).has(decodedAnchor)
  ) {
    issues.push(`${sourcePath}:${line}: unresolved heading anchor "#${decodedAnchor}"`);
  }
}

function isWithinDirectory(directory, candidate) {
  const relativePath = relative(resolve(directory), resolve(candidate));
  return relativePath === '' || (!relativePath.startsWith('..') && !relativePath.startsWith(sep));
}

function checkLocalAsset(targetPath, sourceRecord, publicDir, contentRoot) {
  const candidates = targetPath.startsWith('/')
    ? [join(publicDir, targetPath.replace(/^\/+/, ''))]
    : [join(sourceRecord.sourceDirectory, targetPath), join(publicDir, targetPath)];

  return candidates.some((candidate) => {
    const resolvedCandidate = resolve(candidate);
    const isInSource = isWithinDirectory(contentRoot, resolvedCandidate);
    const isInPublic = isWithinDirectory(publicDir, resolvedCandidate);
    return (isInSource || isInPublic) && existsSync(resolvedCandidate);
  });
}

function resolveRelativeDocumentPath(sourceDocumentPath, targetPath) {
  const candidate = posix.normalize(posix.join(dirname(sourceDocumentPath), targetPath));
  if (candidate === '..' || candidate.startsWith('../')) {
    return null;
  }

  return normalizeDocPath(stripDocumentExtension(candidate));
}

function isLikelyDocumentTarget(pathname) {
  return !pathname || !extname(pathname) || /\.(?:md|mdx)$/i.test(pathname);
}

function checkTargetAnchor(documentPath, suffix, link) {
  if (!suffix.startsWith('#')) {
    return;
  }

  const targetRecord = findSourceRecord(documentPath, link.sourceRecords);
  if (targetRecord) {
    checkAnchor(
      targetRecord,
      suffix,
      link.sourceRecords,
      link.issues,
      link.sourcePath,
      link.reference.line,
      link.frontmatterSchema
    );
  }
}

function isAmbiguousRoute(routeModel, decodedPathname, pathname) {
  return (
    routeModel.ambiguousRoutes.has(decodedPathname.replace(/\/+$/, '') || '/') ||
    routeModel.ambiguousRoutes.has(pathname.replace(/\/+$/, '') || '/')
  );
}

/** Returns true when the absolute pathname resolved to a route (valid or reported). */
function validateRouteLink(link, pathname, decodedPathname, suffix) {
  const routeTarget = resolveRouteTarget(decodedPathname, link.routeModel);
  if (!routeTarget) {
    return false;
  }

  if (isAmbiguousRoute(link.routeModel, decodedPathname, pathname)) {
    link.issues.push(
      `${link.sourcePath}:${link.reference.line}: ambiguous route target "${link.reference.target}"`
    );
  } else if (routeTarget.type === 'document') {
    checkTargetAnchor(routeTarget.documentPath, suffix, link);
  }
  return true;
}

/** Returns true when the relative pathname names a known document. */
function validateRelativeDocumentLink(link, decodedPathname, suffix) {
  const documentPath = resolveRelativeDocumentPath(link.sourceRecord.documentPath, decodedPathname);
  if (
    !documentPath ||
    !link.documentPaths.has(documentPath) ||
    !isLikelyDocumentTarget(decodedPathname)
  ) {
    return false;
  }

  checkTargetAnchor(documentPath, suffix, link);
  return true;
}

/** Same-page `#anchor` and `?query` links; returns true when the link had no pathname to resolve. */
function validateInPageLink(link, pathname, suffix) {
  if (pathname) {
    return false;
  }

  if (suffix.startsWith('#')) {
    const { sourceRecord, sourceRecords, issues, sourcePath, reference } = link;
    checkAnchor(
      sourceRecord,
      suffix,
      sourceRecords,
      issues,
      sourcePath,
      reference.line,
      link.frontmatterSchema
    );
    return true;
  }

  return suffix.startsWith('?');
}

function validatePathLink(link, pathname, suffix) {
  const { reference, sourceRecord, publicDir, contentRoot, sourcePath, issues } = link;
  const decodedPathname = safeDecode(pathname);
  if (decodedPathname === null) {
    issues.push(
      `${sourcePath}:${reference.line}: invalid encoded link target "${reference.target}"`
    );
    return;
  }

  const resolved = pathname.startsWith('/')
    ? validateRouteLink(link, pathname, decodedPathname, suffix)
    : validateRelativeDocumentLink(link, decodedPathname, suffix);
  if (resolved || checkLocalAsset(decodedPathname, sourceRecord, publicDir, contentRoot)) {
    return;
  }

  issues.push(
    `${sourcePath}:${reference.line}: unresolved internal link target "${reference.target}"`
  );
}

function validateLink(link) {
  if (link.reference.type === 'action') {
    return;
  }

  const { pathname, suffix } = splitTargetSuffix(link.reference.target);
  if (!validateInPageLink(link, pathname, suffix)) {
    validatePathLink(link, pathname, suffix);
  }
}

function validateSourceLinks({
  sourceRecords,
  documentPaths,
  routeModel,
  publicDir,
  contentRoot,
  issues,
  externalLinks,
  frontmatterSchema,
}) {
  for (const sourceRecord of sourceRecords) {
    for (const reference of extractDocumentLinks(sourceRecord.content)) {
      if (reference.type === 'external') {
        externalLinks.push({
          sourcePath: sourceRecord.sourcePath,
          line: reference.line,
          target: reference.target,
        });
        continue;
      }

      validateLink({
        reference,
        sourceRecord,
        sourceRecords,
        routeModel,
        documentPaths,
        publicDir,
        contentRoot,
        sourcePath: sourceRecord.sourcePath,
        issues,
        frontmatterSchema,
      });
    }
  }
}

async function readSourceRecords(
  files,
  rootDir,
  contentRoot,
  issues,
  frontmatterSchema,
  mdxComponents
) {
  const records = [];

  for (const file of files) {
    const sourcePath = toSourcePath(rootDir, file.absolutePath);
    const record = {
      ...file,
      sourcePath,
      documentPath: getVariantDocumentPath(file.relativePath),
      sourceDirectory: dirname(file.absolutePath),
      contentRoot,
      isVariant: isVariantSource(file),
    };

    try {
      record.content = await readFile(file.absolutePath, 'utf8');
      parseFrontmatter(record.content, frontmatterSchema);
      if (file.absolutePath.toLowerCase().endsWith('.mdx')) {
        validateMdxComponentsInSource(record.content, { components: mdxComponents });
      }
      records.push(record);
    } catch (error) {
      const lineSuffix = error.lineNumber ? `:${error.lineNumber}` : '';
      issues.push(`${sourcePath}${lineSuffix}: ${error.message}`);
    }
  }

  return records;
}

function validateExactSourceForPath(
  contentRoot,
  documentPath,
  issues,
  label = 'documentationTree'
) {
  const basePath = join(contentRoot, documentPath);
  const candidates = [`${basePath}.md`, `${basePath}.mdx`].filter((path) => existsSync(path));

  if (candidates.length !== 1) {
    const found = candidates.length === 0 ? 'no source' : 'both .md and .mdx sources';
    issues.push(`${label} path "${documentPath}" must have exactly one source (${found}).`);
  }
}

function validateDuplicateVariantSources(files, issues) {
  const variantsByLogicalPath = new Map();

  for (const file of files.filter(isVariantSource)) {
    const logicalPath = file.relativePath.replace(/\.(?:md|mdx)$/i, '');
    const existing = variantsByLogicalPath.get(logicalPath) || [];
    existing.push(file);
    variantsByLogicalPath.set(logicalPath, existing);
  }

  for (const [logicalPath, variantFiles] of variantsByLogicalPath) {
    if (variantFiles.length > 1) {
      issues.push(
        `Variant sources "${logicalPath}" must have exactly one .md or .mdx file (found ${variantFiles.length}).`
      );
    }
  }
}

function validateGeneratedDocumentKeys(
  documentPaths,
  versionConfig,
  i18nConfig,
  issues,
  collection
) {
  const keys = new Map();

  for (const context of getDocsVariantContexts({ versionConfig, i18nConfig })) {
    for (const documentPath of documentPaths) {
      const key = collection
        ? buildCollectionContentPath(collection, documentPath, {
            version: context.version,
            locale: context.locale,
            versionConfig,
            i18nConfig,
          })
        : buildDocsContentPath(documentPath, {
            version: context.version,
            locale: context.locale,
            versionConfig,
            i18nConfig,
          });
      const existing = keys.get(key);
      if (existing && existing !== documentPath) {
        issues.push(
          `Duplicate generated document key "${key}" for "${existing}" and "${documentPath}".`
        );
      } else {
        keys.set(key, documentPath);
      }
    }
  }
}

export async function validateDocumentationContent(options = {}) {
  const rootDir = resolve(options.rootDir || process.cwd());
  const contentRoot = resolve(rootDir, options.contentRoot || join('src', 'docs', 'content'));
  const frameworkContentRoot = resolve(
    rootDir,
    options.frameworkContentRoot || options.contentRoot || join('src', 'docs', 'content')
  );
  const publicDir = resolve(rootDir, options.publicDir || 'public');
  const documentationTree = options.documentationTree || defaultDocumentationTree;
  const frameworkDocPaths = new Set(options.frameworkDocPaths || []);
  const versionConfig = options.versionConfig || defaultVersionConfig;
  const i18nConfig = options.i18nConfig || defaultI18nConfig;
  const configuredOpenapi = options.openapiConfig || defaultOpenapiConfig;
  const collection = options.collection;
  const frontmatterSchema = options.schemaAdapter || options.frontmatterSchema;
  const mdxComponents = options.mdxComponents;
  const issues = [];
  const externalLinks = [];
  const treeDocumentPaths = collectDocumentationPaths(documentationTree);
  const duplicateTreePaths = new Set();
  const seenTreePaths = new Set();

  for (const documentPath of treeDocumentPaths) {
    if (seenTreePaths.has(documentPath)) {
      duplicateTreePaths.add(documentPath);
    }
    seenTreePaths.add(documentPath);

    if (!frameworkDocPaths.has(documentPath)) {
      validateExactSourceForPath(contentRoot, documentPath, issues);
    }
  }

  for (const documentPath of duplicateTreePaths) {
    issues.push(`documentationTree contains duplicate document path "${documentPath}".`);
  }

  for (const documentPath of frameworkDocPaths) {
    validateExactSourceForPath(frameworkContentRoot, documentPath, issues, 'framework docs');
  }

  const publishedFiles = await collectMarkdownFiles(contentRoot, contentRoot, {
    excludedDirectories: EXCLUDED_SOURCE_DIRECTORIES,
  });
  const allSourceFiles = await collectMarkdownFiles(contentRoot, contentRoot, {
    excludedDirectories: new Set(['generated']),
  });
  const documentPathSet = new Set([...treeDocumentPaths, ...frameworkDocPaths]);

  for (const file of publishedFiles) {
    if (
      !frameworkDocPaths.has(file.documentPath) &&
      !new Set(treeDocumentPaths).has(file.documentPath)
    ) {
      issues.push(
        `Published source "${toSourcePath(rootDir, file.absolutePath)}" is not represented in documentationTree.`
      );
    }
  }

  for (const file of allSourceFiles.filter(isVariantSource)) {
    const documentPath = getVariantDocumentPath(file.relativePath);
    if (!documentPathSet.has(documentPath)) {
      issues.push(
        `Variant source "${toSourcePath(rootDir, file.absolutePath)}" targets unlisted document "${documentPath}".`
      );
    }
  }

  validateDuplicateVariantSources(allSourceFiles, issues);
  const sourceRecords = await readSourceRecords(
    allSourceFiles,
    rootDir,
    contentRoot,
    issues,
    frontmatterSchema,
    mdxComponents
  );

  for (const featureIssue of getDocumentationFeatureValidationIssues({
    documentationTree,
    versionConfig,
    i18nConfig,
  })) {
    issues.push(featureIssue);
  }

  validateGeneratedDocumentKeys(treeDocumentPaths, versionConfig, i18nConfig, issues, collection);

  const routeDocumentPaths = Array.from(documentPathSet);
  const routeModel = createRouteModel({
    collection,
    documentationTree,
    documentPaths: routeDocumentPaths,
    openapiConfig: configuredOpenapi,
    versionConfig,
    i18nConfig,
    routeCollections: options.routeCollections,
  });

  for (const routePath of routeModel.ambiguousRoutes) {
    issues.push(`Route model contains ambiguous route "${routePath}".`);
  }

  validateSourceLinks({
    sourceRecords,
    documentPaths: documentPathSet,
    routeModel,
    publicDir,
    contentRoot,
    issues,
    externalLinks,
    frontmatterSchema,
  });

  return {
    issues: Array.from(new Set(issues)),
    externalLinks,
    sourceRecords,
    documentPaths: treeDocumentPaths,
    variantContexts: getDocsVariantContexts({ versionConfig, i18nConfig }),
  };
}

export function formatContentValidationIssues(issues) {
  return issues.map((issue) => `- ${issue}`).join('\n');
}

export async function assertValidDocumentationContent(options = {}) {
  const result = await validateDocumentationContent(options);
  if (result.issues.length > 0) {
    throw new Error(
      `Documentation content validation failed:\n${formatContentValidationIssues(result.issues)}`
    );
  }

  return result;
}
