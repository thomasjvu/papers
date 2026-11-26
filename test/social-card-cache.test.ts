import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';

import {
  cachedPngPath,
  cardHash,
  cardHashManifestPath,
  pruneCachedPngs,
  readCardHashManifest,
  restoreCachedPng,
  socialCardCacheDir,
  storeCachedPng,
  writeCardHashManifest,
} from '../scripts/lib/socialCardCache.mjs';

async function withTempDir(run: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), 'papers-card-cache-'));
  try {
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export const socialCardCacheTests = [
  {
    name: 'cardHash is stable and changes when any input changes',
    run: () => {
      const inputs = { title: 'Papers', description: 'Docs', siteName: 'papers', label: 'x' };
      assert.equal(cardHash(inputs), cardHash({ ...inputs }));
      assert.notEqual(cardHash(inputs), cardHash({ ...inputs, title: 'Other' }));
      assert.equal(cardHash(inputs).length, 64);
    },
  },
  {
    name: 'socialCardCacheDir lives under node_modules/.cache, outside dist/',
    run: () => {
      const cacheDir = socialCardCacheDir('/repo');
      assert.equal(cacheDir, join('/repo', 'node_modules', '.cache', 'papers-social-cards'));
      // The regression this guards: a cache inside dist/ is wiped by vite
      // build before generate:route-html runs, so it can never hit.
      assert.ok(!cacheDir.split(sep).includes('dist'));
      assert.ok(!cardHashManifestPath(cacheDir).split(sep).includes('dist'));
      assert.ok(!cachedPngPath(cacheDir, 'a'.repeat(64)).split(sep).includes('dist'));
    },
  },
  {
    name: 'readCardHashManifest returns {} for a missing, corrupt, or misshapen manifest',
    run: async () => {
      await withTempDir(async (dir) => {
        const cacheDir = socialCardCacheDir(dir);
        assert.deepEqual(readCardHashManifest(cacheDir), {});
        await mkdir(cacheDir, { recursive: true });
        await writeFile(cardHashManifestPath(cacheDir), 'not json', 'utf8');
        assert.deepEqual(readCardHashManifest(cacheDir), {});
        await writeFile(
          cardHashManifestPath(cacheDir),
          JSON.stringify({ version: 1, cards: 'nope' }),
          'utf8'
        );
        assert.deepEqual(readCardHashManifest(cacheDir), {});
      });
    },
  },
  {
    name: 'writeCardHashManifest round-trips through readCardHashManifest',
    run: async () => {
      await withTempDir(async (dir) => {
        const cacheDir = socialCardCacheDir(dir);
        const hashes = {
          '/images/og/a.svg': { hash: 'b'.repeat(64), advertised: '/images/og/a.png' },
        };
        await writeCardHashManifest(cacheDir, hashes);
        assert.deepEqual(readCardHashManifest(cacheDir), hashes);
      });
    },
  },
  {
    name: 'storeCachedPng and restoreCachedPng round-trip the PNG bytes',
    run: async () => {
      await withTempDir(async (dir) => {
        const cacheDir = socialCardCacheDir(dir);
        const distPng = join(dir, 'dist', 'images', 'og', 'a.png');
        const hash = cardHash({ title: 'A' });
        const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
        assert.equal(await restoreCachedPng(cacheDir, distPng, hash), false);
        assert.equal(existsSync(distPng), false);
        await storeCachedPng(cacheDir, hash, png);
        assert.equal(await restoreCachedPng(cacheDir, distPng, hash), true);
        assert.deepEqual(await readFile(distPng), png);
        // A second restore still hits: the cached bytes survive dist wipes.
        await rm(join(dir, 'dist'), { recursive: true, force: true });
        assert.equal(await restoreCachedPng(cacheDir, distPng, hash), true);
        assert.deepEqual(await readFile(distPng), png);
      });
    },
  },
  {
    name: 'pruneCachedPngs removes only unreferenced hash-named PNGs',
    run: async () => {
      await withTempDir(async (dir) => {
        const cacheDir = socialCardCacheDir(dir);
        const live = 'a'.repeat(64);
        const stale = 'b'.repeat(64);
        await storeCachedPng(cacheDir, live, Buffer.from('live'));
        await storeCachedPng(cacheDir, stale, Buffer.from('stale'));
        await writeFile(join(cacheDir, 'png', 'notes.txt'), 'keep me', 'utf8');
        await pruneCachedPngs(cacheDir, new Set([live]));
        assert.equal(existsSync(cachedPngPath(cacheDir, live)), true);
        assert.equal(existsSync(cachedPngPath(cacheDir, stale)), false);
        assert.equal(existsSync(join(cacheDir, 'png', 'notes.txt')), true);
        // Missing png dir is not an error.
        await pruneCachedPngs(socialCardCacheDir(join(dir, 'other')), new Set());
      });
    },
  },
];
