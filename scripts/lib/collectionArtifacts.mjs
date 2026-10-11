import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getGeneratedDocumentKeys } from './docsVariants.mjs';
import { getCollectionArtifactPaths } from '../../shared/content-collections.js';

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function readGeneratedDocuments(docsIndex, contentDir, collection) {
  const documents = {};

  for (const docKey of getGeneratedDocumentKeys(docsIndex.paths, {
    versionConfig: collection?.variants?.versionConfig,
    i18nConfig: collection?.variants?.i18nConfig,
  })) {
    const filePath = join(contentDir, `${docKey}.json`);

    if (!existsSync(filePath)) {
      continue;
    }

    documents[docKey] = readJson(filePath);
  }

  return documents;
}

export function readCollectionArtifacts(publicDir, collection) {
  const artifactPaths = getCollectionArtifactPaths(collection);
  const indexPath = join(publicDir, artifactPaths.index.replace(/^\//, ''));
  const contentDir = join(publicDir, artifactPaths.content.replace(/^\//, ''));
  const manifestPath = join(publicDir, artifactPaths.manifest.replace(/^\//, ''));
  const referencesPath = join(publicDir, artifactPaths.references.replace(/^\//, ''));

  if (
    !existsSync(indexPath) ||
    !existsSync(contentDir) ||
    !existsSync(manifestPath) ||
    !existsSync(referencesPath)
  ) {
    return null;
  }

  const index = readJson(indexPath);
  const documents = readGeneratedDocuments(index, contentDir, collection);

  return {
    index,
    documents,
    manifest: readJson(manifestPath),
    references: readJson(referencesPath),
  };
}

export function readAllCollectionArtifacts(publicDir, collections) {
  const artifactsByCollectionId = {};

  for (const collection of collections) {
    const artifacts = readCollectionArtifacts(publicDir, collection);
    if (!artifacts) {
      return null;
    }

    artifactsByCollectionId[collection.id] = artifacts;
  }

  return artifactsByCollectionId;
}
