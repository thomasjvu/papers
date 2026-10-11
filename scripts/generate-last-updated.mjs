/**
 * Writes dist/docs-last-updated.json after `vite build`. The dates come from git
 * (or a `lastUpdated` frontmatter override) and only ever land in dist/, so the
 * committed public/ artifacts and `docs:check` stay deterministic.
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  LAST_UPDATED_FILENAME,
  createLastUpdatedManifest,
  gitLastCommitDate,
  readDistDocumentArtifacts,
} from './lib/lastUpdated.mjs';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const documents = await readDistDocumentArtifacts(distDir);
const manifest = createLastUpdatedManifest(documents, (sourcePath) =>
  gitLastCommitDate(rootDir, sourcePath)
);
await writeFile(join(distDir, LAST_UPDATED_FILENAME), JSON.stringify(manifest, null, 2) + '\n');
console.log(
  `Wrote ${LAST_UPDATED_FILENAME} for ${Object.keys(manifest.pages).length} of ${documents.length} page(s).`
);
