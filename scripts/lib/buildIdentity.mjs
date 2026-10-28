import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import {
  brandingConfig,
  documentationTree,
  homepageConfig,
} from '../../shared/documentation-config.js';
import { getDefaultDocumentPath } from '../../shared/seo.js';
import { loadViteEnv } from './loadViteEnv.mjs';

export const BUILD_MANIFEST_VERSION = 1;
export const BUILD_GENERATOR_VERSION = 'papers-build-v1';
export const BUILD_MANIFEST_FILENAME = 'build-manifest.json';

const ROOT_INPUT_FILES = [
  '.env.example',
  'FRAMEWORK.md',
  'README.md',
  'index.html',
  'package-lock.json',
  'package.json',
  'tsconfig.json',
  'vercel.json',
  'vite.config.ts',
  'wrangler.toml',
];

const ROOT_INPUT_DIRECTORIES = ['packages', 'public', 'scripts', 'shared', 'src', 'themes'];

const SKIPPED_DIRECTORIES = new Set(['node_modules', 'dist', '.git']);

function walkFiles(rootDir, relativeDirectory) {
  const directoryPath = join(rootDir, relativeDirectory);

  if (!existsSync(directoryPath)) {
    return [];
  }

  const entries = readdirSync(directoryPath, { withFileTypes: true }).sort((left, right) =>
    left.name.localeCompare(right.name)
  );
  const files = [];

  for (const entry of entries) {
    const relativePath = join(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        files.push(...walkFiles(rootDir, relativePath));
      }
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

export function getBuildInputFiles(rootDir) {
  const files = [
    ...ROOT_INPUT_FILES.filter((filePath) => existsSync(join(rootDir, filePath))),
    ...ROOT_INPUT_DIRECTORIES.flatMap((directory) => walkFiles(rootDir, directory)),
  ];

  return Array.from(new Set(files)).sort();
}

export function computeInputFingerprint(rootDir) {
  const hash = createHash('sha256');
  const files = getBuildInputFiles(rootDir);

  for (const relativePath of files) {
    const absolutePath = resolve(rootDir, relativePath);
    const stats = statSync(absolutePath);

    hash.update(relativePath);
    hash.update('\0');
    hash.update(String(stats.size));
    hash.update('\0');
    hash.update(readFileSync(absolutePath));
    hash.update('\0');
  }

  return {
    inputFingerprint: hash.digest('hex'),
    inputFiles: files.map((filePath) => relative(rootDir, resolve(rootDir, filePath))),
  };
}

function runGit(rootDir, args) {
  try {
    return execFileSync('git', args, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

/** 'dirty' when `git status --porcelain` lists anything outside plans/. */
export function summarizeWorktreeState(porcelainStatus) {
  const relevantLines = porcelainStatus
    .split('\n')
    .filter(Boolean)
    .filter((line) => !line.slice(3).startsWith('plans/'));

  return relevantLines.length > 0 ? 'dirty' : 'clean';
}

function getWorkingTreeState(rootDir) {
  return summarizeWorktreeState(
    runGit(rootDir, ['status', '--porcelain', '--untracked-files=all'])
  );
}

/** CI-provided revisions win over the local git HEAD; 'unknown' when neither exists. */
export function resolveSourceRevision(configuredRevision, gitRevision) {
  if (configuredRevision) {
    return { sourceRevision: configuredRevision, sourceRevisionSource: 'environment' };
  }
  if (gitRevision) {
    return { sourceRevision: gitRevision, sourceRevisionSource: 'git' };
  }
  return { sourceRevision: 'unknown', sourceRevisionSource: 'unknown' };
}

function getNpmVersion() {
  try {
    return execFileSync('npm', ['--version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

export function createBuildIdentity(rootDir, buildMode = process.env.NODE_ENV || 'production') {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  const { inputFingerprint, inputFiles } = computeInputFingerprint(rootDir);
  const configuredRevision = process.env.GITHUB_SHA || process.env.SOURCE_COMMIT;
  const gitRevision = runGit(rootDir, ['rev-parse', 'HEAD']);
  const viteEnv = loadViteEnv(rootDir, buildMode);
  const configuredGitHubUrl =
    brandingConfig.social?.find((item) => item.name === 'GitHub')?.href || '';

  return {
    schemaVersion: BUILD_MANIFEST_VERSION,
    generatorVersion: BUILD_GENERATOR_VERSION,
    packageVersion: packageJson.version,
    ...resolveSourceRevision(configuredRevision, gitRevision),
    worktreeState: getWorkingTreeState(rootDir),
    buildMode,
    nodeVersion: process.version,
    npmVersion: getNpmVersion(),
    siteName: viteEnv.VITE_SITE_NAME || homepageConfig.hero?.title || 'papers',
    siteUrl: viteEnv.VITE_SITE_URL || '',
    githubUrl: viteEnv.VITE_GITHUB_URL || configuredGitHubUrl,
    defaultDocumentPath: getDefaultDocumentPath(documentationTree) || '',
    inputFingerprint,
    inputFiles,
  };
}

export function readBuildManifest(distDir) {
  const manifestPath = join(distDir, BUILD_MANIFEST_FILENAME);

  if (!existsSync(manifestPath)) {
    throw new Error('Missing ' + manifestPath + '. Run npm run build first.');
  }

  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error('Could not parse ' + manifestPath + ': ' + error.message);
  }
}

/**
 * Throws when a dist manifest does not describe the current checkout: schema,
 * generator, build mode, revision, input fingerprint and (in CI) a clean tree.
 */
export function validateBuildManifest(
  manifest,
  current,
  { expectedBuildMode = 'production', isCi = process.env.CI === 'true' } = {}
) {
  if (manifest.schemaVersion !== BUILD_MANIFEST_VERSION) {
    throw new Error(
      'Unsupported build manifest schema ' +
        manifest.schemaVersion +
        '; expected ' +
        BUILD_MANIFEST_VERSION +
        '.'
    );
  }

  if (manifest.generatorVersion !== BUILD_GENERATOR_VERSION) {
    throw new Error(
      'Build manifest generator mismatch: ' + (manifest.generatorVersion || 'missing') + '.'
    );
  }

  if (manifest.buildMode !== expectedBuildMode) {
    throw new Error(
      'Build mode mismatch: artifact is ' +
        (manifest.buildMode || 'missing') +
        ', expected ' +
        expectedBuildMode +
        '.'
    );
  }

  if (!manifest.sourceRevision || manifest.sourceRevision !== current.sourceRevision) {
    throw new Error(
      'Build revision mismatch: artifact is ' +
        (manifest.sourceRevision || 'missing') +
        ', current checkout is ' +
        current.sourceRevision +
        '.'
    );
  }

  if (!manifest.inputFingerprint || manifest.inputFingerprint !== current.inputFingerprint) {
    throw new Error(
      'Build input fingerprint mismatch. Run npm run build to regenerate dist for the current checkout.'
    );
  }

  if (isCi && manifest.worktreeState !== 'clean') {
    throw new Error('CI release artifacts must be built from a clean working tree.');
  }

  return manifest;
}

export function assertBuildManifest(distDir, { expectedBuildMode = 'production' } = {}) {
  const manifest = readBuildManifest(distDir);
  const current = createBuildIdentity(resolve(distDir, '..'), expectedBuildMode);

  return validateBuildManifest(manifest, current, { expectedBuildMode });
}
