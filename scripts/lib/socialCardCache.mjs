/**
 * Persistent cache for rendered social-card PNGs.
 *
 * The hash manifest and the rendered PNG bytes live under
 * `node_modules/.cache/papers-social-cards/` — deliberately NOT in dist/.
 * `vite build` empties dist/ before `generate:route-html` runs, so a
 * dist-side cache could never hit on a full build; the cache only paid off
 * on repeated `generate:route-html` runs. `node_modules` is gitignored, so
 * the cache never pollutes the repo; `npm ci` clears it, which only costs
 * one cold re-render.
 *
 * A card is cached only when its PNG renders successfully — an SVG fallback
 * is retried on the next run. The manifest maps the card's SVG path to
 * { hash, advertised }, and is rewritten at the end of every run with only
 * the entries for cards seen in that run, so deleted routes drop out;
 * `pruneCachedPngs` removes their cached PNG bytes too.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export function socialCardCacheDir(rootDir) {
  return join(rootDir, 'node_modules', '.cache', 'papers-social-cards');
}

export function cardHashManifestPath(cacheDir) {
  return join(cacheDir, '.card-hashes.json');
}

export function cachedPngPath(cacheDir, hash) {
  return join(cacheDir, 'png', `${hash}.png`);
}

export function cardHash(inputs) {
  return createHash('sha256').update(JSON.stringify(inputs)).digest('hex');
}

export function readCardHashManifest(cacheDir) {
  try {
    const manifestPath = cardHashManifestPath(cacheDir);
    if (!existsSync(manifestPath)) return {};
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    return manifest &&
      typeof manifest === 'object' &&
      manifest.cards &&
      typeof manifest.cards === 'object'
      ? manifest.cards
      : {};
  } catch {
    return {};
  }
}

export async function writeCardHashManifest(cacheDir, hashes) {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(
    cardHashManifestPath(cacheDir),
    `${JSON.stringify({ version: 1, cards: hashes }, null, 2)}\n`
  );
}

/** Copy the cached PNG for `hash` into `distPngPath`; false when nothing is cached. */
export async function restoreCachedPng(cacheDir, distPngPath, hash) {
  const cached = cachedPngPath(cacheDir, hash);
  if (!existsSync(cached)) return false;
  await mkdir(dirname(distPngPath), { recursive: true });
  await copyFile(cached, distPngPath);
  return true;
}

/** Persist a freshly rendered PNG under its content hash. */
export async function storeCachedPng(cacheDir, hash, png) {
  const cached = cachedPngPath(cacheDir, hash);
  await mkdir(dirname(cached), { recursive: true });
  await writeFile(cached, png);
}

/** Delete cached PNGs whose hash is not in `liveHashes` (deleted routes). */
export async function pruneCachedPngs(cacheDir, liveHashes) {
  const pngDir = join(cacheDir, 'png');
  let entries;
  try {
    entries = await readdir(pngDir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!/^[0-9a-f]{64}\.png$/.test(entry)) continue;
    if (liveHashes.has(entry.slice(0, -4))) continue;
    await rm(join(pngDir, entry), { force: true });
  }
}
