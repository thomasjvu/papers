import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { BUILD_MANIFEST_FILENAME, createBuildIdentity } from './lib/buildIdentity.mjs';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');

await mkdir(distDir, { recursive: true });
const manifest = createBuildIdentity(rootDir, process.env.NODE_ENV || 'production');
await writeFile(join(distDir, BUILD_MANIFEST_FILENAME), JSON.stringify(manifest, null, 2) + '\n');

console.log(
  'Wrote ' +
    BUILD_MANIFEST_FILENAME +
    ' for ' +
    manifest.sourceRevision +
    ' (' +
    manifest.inputFingerprint +
    ').'
);
