#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(packageRoot, '..', '..');
const manifestPath = join(packageRoot, 'template-manifest.json');
const defaultRepo = 'thomasjvu/papers';
const TEMPLATE_MARKERS = ['shared/documentation-config.js', 'src/docs/content', 'vite.config.ts'];
const COMMIT_PATTERN = /^[0-9a-f]{40}$/i;

const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  '.github',
  '.husky',
  '.cursor',
  '.vercel',
  '.wrangler',
  'dist',
  'node_modules',
  'packages',
  'plans',
]);

const EXCLUDED_FILES = new Set([
  '.DS_Store',
  '.env',
  '.env.local',
  '.env.development.local',
  '.env.production.local',
  '.env.test.local',
]);

function printUsage() {
  console.log(`Usage: npm create papers [directory]

Examples:
  npm create papers my-docs
  npx create-papers my-docs

Options:
  --repo <owner/name>   Advanced GitHub repository override; requires --ref
  --ref <commit>        Full 40-character commit SHA for a repository override
  --no-install          Skip npm install after scaffolding
  --version             Print the CLI and template contract versions

The default template is fetched from the immutable commit recorded in the
published package manifest. Set PAPERS_TEMPLATE_ROOT=local in this checkout,
or set it to a marker-complete local template path, for offline development.
`);
}

function parseArgs(argv) {
  const options = {
    targetDir: 'papers-docs',
    repo: process.env.PAPERS_TEMPLATE_REPO || defaultRepo,
    ref: process.env.PAPERS_TEMPLATE_REF || null,
    install: true,
    repoExplicit: false,
    help: false,
    version: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--version' || arg === '-v') {
      options.version = true;
      continue;
    }

    if (arg === '--no-install') {
      options.install = false;
      continue;
    }

    if (arg === '--repo' || arg === '--ref') {
      const value = argv[index + 1];
      if (!value || value.startsWith('-')) {
        throw new Error(`${arg} requires a value.`);
      }
      if (arg === '--repo') {
        options.repo = value;
        options.repoExplicit = true;
      } else {
        options.ref = value;
      }
      index += 1;
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (options.targetDir !== 'papers-docs' || options.targetDirWasSet) {
      throw new Error('Only one target directory may be provided.');
    }
    options.targetDir = arg;
    options.targetDirWasSet = true;
  }

  return options;
}

function assertValidRepository(repository) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error(`Invalid GitHub repository: ${repository}. Use owner/name.`);
  }
}

function assertPinnedRevision(revision) {
  if (!COMMIT_PATTERN.test(revision || '')) {
    throw new Error('The template revision must be a full 40-character commit SHA.');
  }
}

async function readTemplateManifest() {
  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (
      manifest?.schemaVersion !== 1 ||
      !manifest?.template?.repository ||
      !COMMIT_PATTERN.test(manifest?.template?.revision || '') ||
      !manifest?.template?.archive
    ) {
      throw new Error('The published template manifest is invalid.');
    }
    return manifest;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function readPackageMetadata() {
  return JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
}

export async function printVersion() {
  const packageMetadata = await readPackageMetadata();
  const manifest = await readTemplateManifest();

  console.log(`create-papers ${packageMetadata.version}`);
  if (manifest) {
    console.log(`template ${manifest.template.repository}@${manifest.template.revision}`);
    console.log(`node ${manifest.node}`);
  } else {
    console.log('template local-checkout (npm pack embeds an immutable revision)');
    console.log(`node ${packageMetadata.engines?.node || '>=24.0.0'}`);
  }
}

export async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function isPapersTemplateRoot(root) {
  const markerResults = await Promise.all(
    TEMPLATE_MARKERS.map((marker) => pathExists(join(root, marker)))
  );
  return markerResults.every(Boolean);
}

export async function shouldUseLocalTemplate(
  root,
  { forceLocal = false, repo = defaultRepo } = {}
) {
  const hasMarkers = await isPapersTemplateRoot(root);
  if (forceLocal && !hasMarkers) {
    throw new Error(
      `PAPERS_TEMPLATE_ROOT=local requires a papers template checkout with: ${TEMPLATE_MARKERS.join(', ')}`
    );
  }
  return hasMarkers && (forceLocal || repo === defaultRepo);
}

async function resolveConfiguredLocalTemplate() {
  const configuredRoot = process.env.PAPERS_TEMPLATE_ROOT;
  if (!configuredRoot) {
    return null;
  }

  const root = configuredRoot === 'local' ? docsRoot : resolve(process.cwd(), configuredRoot);
  if (!(await isPapersTemplateRoot(root))) {
    throw new Error(
      `PAPERS_TEMPLATE_ROOT must point to a marker-complete papers template with: ${TEMPLATE_MARKERS.join(', ')}`
    );
  }
  return root;
}

async function copyTemplateDirectory(sourceRoot, targetRoot) {
  await mkdir(targetRoot, { recursive: true });
  const entries = await readdir(sourceRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    if (!entry.isDirectory() && EXCLUDED_FILES.has(entry.name)) {
      continue;
    }

    const sourcePath = join(sourceRoot, entry.name);
    const targetPath = join(targetRoot, entry.name);

    if (entry.isDirectory()) {
      await copyTemplateDirectory(sourcePath, targetPath);
      continue;
    }

    await cp(sourcePath, targetPath);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

async function scaffoldFromLocalTemplate(targetDir, sourceRoot) {
  console.log(`Copying local papers template from ${sourceRoot}`);
  await copyTemplateDirectory(sourceRoot, targetDir);
}

function validateArchiveListing(listing, repository, revision) {
  const entries = listing
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    throw new Error('The template archive is empty.');
  }

  for (const entry of entries) {
    const normalized = entry.replace(/\\/g, '/');
    if (normalized.startsWith('/') || normalized.split('/').includes('..')) {
      throw new Error('The template archive contains an unsafe path.');
    }
  }

  const rootNames = new Set(entries.map((entry) => entry.split('/')[0]).filter(Boolean));
  const expectedRootSuffix = `-${revision.slice(0, 7)}`;
  const expectedRepositoryName = repository.split('/')[1];
  if (
    rootNames.size !== 1 ||
    ![...rootNames][0].startsWith(`${expectedRepositoryName}-`) ||
    ![...rootNames][0].endsWith(expectedRootSuffix)
  ) {
    throw new Error('The template archive root does not match the pinned repository revision.');
  }
}

async function findExtractedTemplateRoot(extractRoot) {
  const entries = await readdir(extractRoot, { withFileTypes: true });
  const candidates = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const candidate = join(extractRoot, entry.name);
    if (await isPapersTemplateRoot(candidate)) {
      candidates.push(candidate);
    }
  }

  if (candidates.length !== 1) {
    throw new Error('The template archive must contain exactly one marker-complete papers root.');
  }
  return candidates[0];
}

async function scaffoldFromGitHub(targetDir, repository, revision, archiveUrl) {
  assertValidRepository(repository);
  assertPinnedRevision(revision);

  const tempRoot = await mkdtemp(join(tmpdir(), 'papers-create-'));
  const archivePath = join(tempRoot, 'template.tar.gz');
  const extractRoot = join(tempRoot, 'extract');

  try {
    console.log(`Downloading ${repository}@${revision} from its immutable commit archive...`);
    const response = await fetch(archiveUrl, { redirect: 'error' });
    if (!response.ok) {
      throw new Error(`Template download failed with HTTP ${response.status}.`);
    }
    await writeFile(archivePath, Buffer.from(await response.arrayBuffer()));
    await mkdir(extractRoot);

    const listing = execFileSync('tar', ['-tzf', archivePath], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    validateArchiveListing(listing, repository, revision);
    run('tar', ['-xzf', archivePath, '-C', extractRoot]);

    const sourceRoot = await findExtractedTemplateRoot(extractRoot);
    await scaffoldFromLocalTemplate(targetDir, sourceRoot);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  if (options.version) {
    await printVersion();
    return;
  }

  assertValidRepository(options.repo);
  const targetDir = resolve(process.cwd(), options.targetDir);

  if (await pathExists(targetDir)) {
    const targetStats = await stat(targetDir);
    if (!targetStats.isDirectory()) {
      throw new Error(`Target path is not a directory: ${targetDir}`);
    }
    const entries = await readdir(targetDir);
    if (entries.length > 0) {
      throw new Error(`Target directory is not empty: ${targetDir}`);
    }
  }

  const localRoot = await resolveConfiguredLocalTemplate();
  const manifest = await readTemplateManifest();
  const useCheckoutTemplate =
    !localRoot &&
    (await shouldUseLocalTemplate(docsRoot, {
      repo: options.repo,
      forceLocal: false,
    }));

  if (localRoot || useCheckoutTemplate) {
    await scaffoldFromLocalTemplate(targetDir, localRoot || docsRoot);
  } else {
    const manifestRepository = manifest?.template?.repository;
    const revision =
      options.ref || (options.repo === manifestRepository ? manifest?.template?.revision : null);
    if (!revision) {
      throw new Error(
        'A pinned template commit is required. Use the published package or pass --repo <owner/name> --ref <full-commit-sha>.'
      );
    }
    const archiveUrl =
      options.repo === manifestRepository && manifest?.template?.archive
        ? manifest.template.archive
        : `https://codeload.github.com/${options.repo}/tar.gz/${revision}`;
    await scaffoldFromGitHub(targetDir, options.repo, revision, archiveUrl);
  }

  console.log(`\nCreated papers site at ${targetDir}`);

  if (options.install) {
    console.log('Installing dependencies...');
    run('npm', ['install'], { cwd: targetDir });
  }

  console.log('\nNext steps:');
  console.log(`  cd ${options.targetDir}`);
  if (!options.install) {
    console.log('  npm install');
  }
  console.log('  npm run dev');
  console.log('\nCustomize shared/documentation-config.js and src/docs/content/ first.');
}

const invokedScript = process.argv[1] ? realpathSync(process.argv[1]) : '';
const modulePath = realpathSync(fileURLToPath(import.meta.url));
if (invokedScript === modulePath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
