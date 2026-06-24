import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getGeneratedDocumentKeys } from './docsVariants.mjs';

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function readGeneratedDocuments(docsIndex, contentDir) {
  const documents = {};

  for (const docKey of getGeneratedDocumentKeys(docsIndex.paths)) {
    const filePath = join(contentDir, `${docKey}.json`);

    if (!existsSync(filePath)) {
      continue;
    }

    documents[docKey] = readJson(filePath);
  }

  return documents;
}

export function readCollectionArtifacts(publicDir, collection) {
  const indexPath = join(publicDir, `${collection.id}-index.json`);
  const contentDir = join(publicDir, `${collection.id}-content`);

  if (!existsSync(indexPath) || !existsSync(contentDir)) {
    return null;
  }

  const index = readJson(indexPath);
  const documents = readGeneratedDocuments(index, contentDir);

  return { index, documents };
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