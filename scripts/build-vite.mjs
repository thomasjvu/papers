// Keep module resolution compatible with workspace-hoisted Vite installations.
// The npm entry point supplies enough heap for the optional API viewer's module graph.
import { join } from 'node:path';
import { build } from 'vite';

import {
  computeViteAppFingerprint,
  getViteBundleCacheRoot,
  isViteBundleCacheEnabled,
  restoreViteBundleCache,
  writeViteBundleCache,
} from './lib/viteBundleCache.mjs';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const publicDir = join(rootDir, 'public');
const cacheRoot = getViteBundleCacheRoot(rootDir);
const cacheEnabled = isViteBundleCacheEnabled();
const fingerprint = cacheEnabled ? computeViteAppFingerprint({ rootDir, mode: 'production' }) : null;

const restored = fingerprint
  ? restoreViteBundleCache({ cacheRoot, distDir, publicDir, fingerprint })
  : null;

if (restored) {
  console.log(
    `Reused cached Vite app bundle (${restored.fingerprint.slice(0, 12)}, ${restored.fileCount} files).`
  );
} else {
  const emittedFiles = [];
  await build({
    plugins: [
      {
        name: 'papers-record-vite-outputs',
        writeBundle(_options, bundle) {
          for (const fileName of Object.keys(bundle)) {
            emittedFiles.push(fileName);
          }
        },
      },
    ],
  });

  if (fingerprint) {
    writeViteBundleCache({ cacheRoot, distDir, fingerprint, emittedFiles });
  }
}
