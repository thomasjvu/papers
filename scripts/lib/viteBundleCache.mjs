import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { contentCollections } from '../../shared/content-collections.js';
import { loadViteEnv } from './loadViteEnv.mjs';

export const VITE_BUNDLE_CACHE_SCHEMA_VERSION = 1;
const MAX_CACHE_ENTRIES = 2;

const APP_SHELL_ROOT_FILES = [
  'index.html',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'postcss.config.js',
  'postcss.config.cjs',
  'postcss.config.mjs',
  'scripts/build-vite.mjs',
  'scripts/lib/viteBundleCache.mjs',
];

const APP_SHELL_DIRECTORIES = ['shared', 'themes', 'src'];

export function isViteBundleCacheEnabled(env = process.env) {
  const value = String(env.PAPERS_VITE_CACHE ?? '').trim().toLowerCase();
  return value !== '0' && value !== 'false' && value !== 'off';
}

function normalizePosixRelative(value) {
  return String(value || '')
    .replaceAll('\\', '/')
    .replace(/^\.\/+/, '')
    .replace(/^\/+|\/+$/g, '');
}

export function getExcludedContentDirs(collections = contentCollections) {
  const dirs = new Set(['src/docs/content']);
  for (const collection of Array.isArray(collections) ? collections : []) {
    const contentDir = normalizePosixRelative(collection?.contentDir);
    if (contentDir) {
      dirs.add(contentDir);
    }
    const frameworkContentDir = normalizePosixRelative(collection?.frameworkContentDir);
    if (frameworkContentDir) {
      dirs.add(frameworkContentDir);
    }
  }
  return dirs;
}

function isSafeRelativeFilePath(relativePath) {
  const normalized = normalizePosixRelative(relativePath);
  if (!normalized || normalized.startsWith('/') || normalized.includes('\0')) {
    return false;
  }
  const segments = normalized.split('/');
  return !segments.some((segment) => !segment || segment === '.' || segment === '..');
}

function isInsideDir(baseDir, candidatePath) {
  const rel = relative(resolve(baseDir), resolve(candidatePath));
  return rel !== '' && !rel.startsWith('..') && !rel.includes('..\\');
}

function walkRegularFiles(rootDir, relativeDirectory, excludedDirs) {
  const normalizedDir = normalizePosixRelative(relativeDirectory);
  if (excludedDirs.has(normalizedDir)) {
    return { files: [], hasSymlink: false };
  }

  const directoryPath = join(rootDir, relativeDirectory);
  if (!existsSync(directoryPath)) {
    return { files: [], hasSymlink: false };
  }

  const dirStat = lstatSync(directoryPath);
  if (dirStat.isSymbolicLink()) {
    return { files: [], hasSymlink: true };
  }
  if (!dirStat.isDirectory()) {
    return { files: [], hasSymlink: false };
  }

  const entries = readdirSync(directoryPath, { withFileTypes: true }).sort((left, right) =>
    left.name.localeCompare(right.name)
  );
  const files = [];

  for (const entry of entries) {
    const childRelative = `${normalizedDir}/${entry.name}`;
    const childAbsolute = join(rootDir, childRelative);
    const childStat = lstatSync(childAbsolute);

    if (childStat.isSymbolicLink()) {
      return { files: [], hasSymlink: true };
    }

    if (childStat.isDirectory()) {
      if (excludedDirs.has(childRelative)) {
        continue;
      }
      const nested = walkRegularFiles(rootDir, childRelative, excludedDirs);
      if (nested.hasSymlink) {
        return { files: [], hasSymlink: true };
      }
      files.push(...nested.files);
    } else if (childStat.isFile()) {
      files.push(childRelative);
    }
  }

  return { files, hasSymlink: false };
}

function hashFileBuffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Compute a deterministic fingerprint for every input that affects Vite's
 * emitted app-shell bundle (index.html, assets/*, bundle-budget.json).
 * Markdown/MDX content directories are excluded because Vite does not import
 * them; shared/ (including documentation-config.js) and src/lib/generated/
 * remain included so navigation, theme, icon, and feature-flag changes always
 * invalidate the cache. Returns null when any input is a symlink.
 */
export function computeViteAppFingerprint({
  rootDir = process.cwd(),
  mode = 'production',
  env = process.env,
  collections = contentCollections,
} = {}) {
  const excludedDirs = getExcludedContentDirs(collections);
  const files = [];

  for (const rootFile of APP_SHELL_ROOT_FILES) {
    const filePath = join(rootDir, rootFile);
    if (!existsSync(filePath)) {
      continue;
    }
    const stats = lstatSync(filePath);
    if (stats.isSymbolicLink()) {
      return null;
    }
    if (stats.isFile()) {
      files.push(rootFile);
    }
  }

  for (const directory of APP_SHELL_DIRECTORIES) {
    const walked = walkRegularFiles(rootDir, directory, excludedDirs);
    if (walked.hasSymlink) {
      return null;
    }
    files.push(...walked.files);
  }

  const sortedFiles = Array.from(new Set(files)).sort();
  const hash = createHash('sha256');
  hash.update(`papers-vite-bundle-cache-v${VITE_BUNDLE_CACHE_SCHEMA_VERSION}\0`);
  hash.update(`${process.version}\0`);
  hash.update(`${mode}\0`);
  hash.update(`${env.NODE_ENV || 'production'}\0`);

  const viteEnv = loadViteEnv(rootDir, mode);
  for (const key of Object.keys(viteEnv).sort()) {
    hash.update(`env:${key}=${viteEnv[key]}\0`);
  }

  for (const relativePath of sortedFiles) {
    const absolutePath = join(rootDir, relativePath);
    const content = readFileSync(absolutePath);
    hash.update(relativePath);
    hash.update('\0');
    hash.update(String(content.length));
    hash.update('\0');
    hash.update(content);
    hash.update('\0');
  }

  return hash.digest('hex');
}

export function getViteBundleCacheRoot(rootDir = process.cwd()) {
  return join(rootDir, 'node_modules', '.cache', 'papers-vite-bundle');
}

export function restoreViteBundleCache({
  cacheRoot,
  distDir,
  publicDir,
  fingerprint,
}) {
  if (!fingerprint) {
    return null;
  }

  const entryDir = join(cacheRoot, fingerprint);
  const manifestPath = join(entryDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    return null;
  }

  const dropCorruptEntry = () => {
    rmSync(entryDir, { recursive: true, force: true });
    return null;
  };

  let manifest;
  try {
    const manifestStat = lstatSync(manifestPath);
    if (manifestStat.isSymbolicLink() || !manifestStat.isFile()) {
      return dropCorruptEntry();
    }
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return dropCorruptEntry();
  }

  if (
    manifest?.schemaVersion !== VITE_BUNDLE_CACHE_SCHEMA_VERSION ||
    manifest?.fingerprint !== fingerprint ||
    !Array.isArray(manifest?.files) ||
    manifest.files.length === 0
  ) {
    return dropCorruptEntry();
  }

  const filesDir = join(entryDir, 'files');
  const verifiedFiles = [];

  for (const record of manifest.files) {
    if (
      !record ||
      typeof record.path !== 'string' ||
      !isSafeRelativeFilePath(record.path) ||
      typeof record.size !== 'number' ||
      typeof record.sha256 !== 'string'
    ) {
      return dropCorruptEntry();
    }

    const cachedFilePath = join(filesDir, record.path);
    const targetFilePath = join(distDir, record.path);
    if (!isInsideDir(filesDir, cachedFilePath) || !isInsideDir(distDir, targetFilePath)) {
      return dropCorruptEntry();
    }

    if (!existsSync(cachedFilePath)) {
      return dropCorruptEntry();
    }

    const stats = lstatSync(cachedFilePath);
    if (stats.isSymbolicLink() || !stats.isFile() || stats.size !== record.size) {
      return dropCorruptEntry();
    }

    const content = readFileSync(cachedFilePath);
    if (hashFileBuffer(content) !== record.sha256) {
      return dropCorruptEntry();
    }

    verifiedFiles.push({ relativePath: record.path, content, targetFilePath });
  }

  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });

  if (existsSync(publicDir)) {
    cpSync(publicDir, distDir, { recursive: true });
  }

  for (const file of verifiedFiles) {
    mkdirSync(dirname(file.targetFilePath), { recursive: true });
    writeFileSync(file.targetFilePath, file.content);
  }

  return {
    fingerprint,
    fileCount: verifiedFiles.length,
  };
}

function pruneOldCacheEntries(cacheRoot, keepFingerprint) {
  if (!existsSync(cacheRoot)) {
    return;
  }

  const entries = readdirSync(cacheRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.includes('.tmp-'))
    .map((entry) => {
      const fullPath = join(cacheRoot, entry.name);
      return { name: entry.name, fullPath, mtimeMs: statSync(fullPath).mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  let kept = 0;
  for (const entry of entries) {
    if (entry.name === keepFingerprint || kept < MAX_CACHE_ENTRIES) {
      kept += 1;
      continue;
    }
    rmSync(entry.fullPath, { recursive: true, force: true });
  }
}

export function writeViteBundleCache({
  cacheRoot,
  distDir,
  fingerprint,
  emittedFiles,
}) {
  if (!fingerprint || !Array.isArray(emittedFiles) || emittedFiles.length === 0) {
    return false;
  }

  const normalizedFiles = Array.from(new Set(emittedFiles.map(normalizePosixRelative)))
    .filter(isSafeRelativeFilePath)
    .sort();

  if (
    !normalizedFiles.includes('index.html') ||
    !normalizedFiles.includes('bundle-budget.json')
  ) {
    return false;
  }

  mkdirSync(cacheRoot, { recursive: true });
  const finalDir = join(cacheRoot, fingerprint);
  const stagingDir = join(cacheRoot, `${fingerprint}.tmp-${process.pid}-${Date.now()}`);
  const stagingFilesDir = join(stagingDir, 'files');

  try {
    mkdirSync(stagingFilesDir, { recursive: true });
    const records = [];

    for (const relativePath of normalizedFiles) {
      const sourcePath = join(distDir, relativePath);
      const destinationPath = join(stagingFilesDir, relativePath);
      if (
        !isInsideDir(distDir, sourcePath) ||
        !isInsideDir(stagingFilesDir, destinationPath) ||
        !existsSync(sourcePath)
      ) {
        throw new Error(`Missing emitted Vite file: ${relativePath}`);
      }

      const stats = lstatSync(sourcePath);
      if (stats.isSymbolicLink() || !stats.isFile()) {
        throw new Error(`Refusing to cache non-regular Vite output: ${relativePath}`);
      }

      const content = readFileSync(sourcePath);
      mkdirSync(dirname(destinationPath), { recursive: true });
      writeFileSync(destinationPath, content);
      records.push({
        path: relativePath,
        size: content.length,
        sha256: hashFileBuffer(content),
      });
    }

    const manifest = {
      schemaVersion: VITE_BUNDLE_CACHE_SCHEMA_VERSION,
      fingerprint,
      files: records,
    };
    writeFileSync(join(stagingDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

    rmSync(finalDir, { recursive: true, force: true });
    renameSync(stagingDir, finalDir);
    pruneOldCacheEntries(cacheRoot, fingerprint);
    return true;
  } catch {
    rmSync(stagingDir, { recursive: true, force: true });
    return false;
  }
}
