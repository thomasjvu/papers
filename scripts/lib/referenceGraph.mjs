import { posix } from 'node:path';

import { buildCanonicalCollectionPath, buildCanonicalDocsPath } from '../../shared/docsRouting.js';
import { getCollectionRoutePrefix } from '../../shared/content-collections.js';
import { stripDocsBasePath } from '../../shared/docsBasePath.js';
import { getDefaultDocumentPath, getDirectoryAliasEntries } from '../../shared/seo.js';
import { extractDocumentLinks } from './docsArtifacts.mjs';
import { splitTargetSuffix } from './linkTargets.mjs';

function normalizeDocumentPath(value) {
  const normalized = posix.normalize(String(value || '').replaceAll('\\', '/'));
  return normalized
    .replace(/^\.\//, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.(?:md|mdx)$/i, '');
}

function getAnchor(suffix) {
  if (!suffix.startsWith('#')) {
    return null;
  }

  const rawAnchor = suffix.slice(1).split('?')[0];
  return rawAnchor ? decodeURIComponent(rawAnchor) : '';
}

function buildRouteAliases(documentationTree, defaultDocumentPath, routePrefix) {
  const aliases = new Map([['', defaultDocumentPath]]);

  for (const alias of getDirectoryAliasEntries(documentationTree, routePrefix)) {
    const routePath = stripDocsBasePath(alias.routePath, routePrefix) ?? '';
    aliases.set(routePath, alias.docPath);
  }

  return aliases;
}

function resolveReferenceTarget(sourcePath, target, pathSet, aliases, routePrefix) {
  const { pathname, suffix } = splitTargetSuffix(target);
  let candidate = null;
  const routePath = pathname.startsWith('/') ? stripDocsBasePath(pathname, routePrefix) : null;

  if (routePath !== null) {
    candidate = aliases.get(routePath) || normalizeDocumentPath(routePath);
  } else if (pathname.startsWith('/')) {
    return null;
  } else if (!pathname) {
    candidate = sourcePath;
  } else {
    candidate = normalizeDocumentPath(posix.join(posix.dirname(sourcePath), pathname));
  }

  if (!candidate || !pathSet.has(candidate) || candidate === sourcePath) {
    return null;
  }

  return {
    path: candidate,
    anchor: getAnchor(suffix),
  };
}

/**
 * Create a deterministic document relationship graph from the same extracted
 * links used by content validation. Unknown links are intentionally omitted:
 * validation remains the failure gate, while this artifact only describes
 * resolvable document-to-document edges.
 */
export function createDocumentReferenceGraph({
  documents,
  paths,
  documentationTree,
  generated,
  collection,
  versionConfig,
  i18nConfig,
}) {
  const documentPaths = (paths || Object.keys(documents || {})).filter((path) => documents?.[path]);
  const pathSet = new Set(documentPaths);
  const defaultDocumentPath =
    getDefaultDocumentPath(documentationTree || []) || documentPaths[0] || '';
  const routePrefix = getCollectionRoutePrefix(collection);
  const aliases = buildRouteAliases(documentationTree || [], defaultDocumentPath, routePrefix);
  const buildCanonicalPath = collection
    ? (path) => buildCanonicalCollectionPath(collection, path, { versionConfig, i18nConfig })
    : (path) => buildCanonicalDocsPath(path, { versionConfig, i18nConfig });
  const edges = [];
  const backlinks = Object.fromEntries(documentPaths.map((path) => [path, []]));

  for (const source of documentPaths) {
    const document = documents[source];
    const links = document.links || extractDocumentLinks(document.content || '');

    for (const link of links.filter((reference) => reference.type === 'internal')) {
      const resolved = resolveReferenceTarget(source, link.target, pathSet, aliases, routePrefix);
      if (!resolved) {
        continue;
      }

      const edge = {
        source,
        target: resolved.path,
        href: buildCanonicalPath(resolved.path),
        line: link.line,
        ...(resolved.anchor !== null ? { anchor: resolved.anchor } : {}),
      };
      edges.push(edge);
      backlinks[resolved.path].push({
        source,
        href: buildCanonicalPath(source),
        line: link.line,
        ...(resolved.anchor !== null ? { anchor: resolved.anchor } : {}),
      });
    }
  }

  edges.sort(
    (left, right) =>
      left.source.localeCompare(right.source) ||
      left.target.localeCompare(right.target) ||
      left.line - right.line ||
      (left.anchor || '').localeCompare(right.anchor || '')
  );

  for (const entries of Object.values(backlinks)) {
    entries.sort(
      (left, right) => left.source.localeCompare(right.source) || left.line - right.line
    );
  }

  return {
    schemaVersion: 1,
    generated: generated || null,
    collection: collection?.id || 'docs',
    nodes: documentPaths.map((path) => ({
      path,
      href: buildCanonicalPath(path),
      title: documents[path].title,
      description: documents[path].description || '',
    })),
    edges,
    backlinks,
  };
}
