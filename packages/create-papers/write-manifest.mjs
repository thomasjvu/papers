import { execFileSync } from 'node:child_process';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(packageRoot, '..', '..');
const manifestPath = join(packageRoot, 'template-manifest.json');
const defaultRepository = 'thomasjvu/papers';
const schemaVersion = 1;
const artifactSchemaVersion = 1;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isCommitRevision(value) {
  return /^[0-9a-f]{40}$/i.test(value);
}

function parseRepository(url) {
  const match = url.match(/github\.com[/:]([^/]+\/[^/.]+?)(?:\.git)?$/i);
  return match?.[1] || defaultRepository;
}

function getSourceRevision() {
  const configuredRevision = process.env.PAPERS_TEMPLATE_REF?.trim();
  if (configuredRevision) {
    assert(
      isCommitRevision(configuredRevision),
      'PAPERS_TEMPLATE_REF must be a full 40-character commit SHA.'
    );
    return configuredRevision.toLowerCase();
  }

  try {
    const revision = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    assert(isCommitRevision(revision), 'The current Git revision is not a full commit SHA.');
    return revision.toLowerCase();
  } catch {
    throw new Error(
      'Cannot determine the immutable template revision. Run this command from a Git checkout or set PAPERS_TEMPLATE_REF to a full commit SHA.'
    );
  }
}

async function readPackageMetadata() {
  return JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
}

export async function createTemplateManifest() {
  const packageMetadata = await readPackageMetadata();
  const repository = parseRepository(packageMetadata.repository?.url || defaultRepository);
  const revision = getSourceRevision();

  return {
    schemaVersion,
    frameworkVersion: packageMetadata.version,
    template: {
      repository,
      revision,
      archive: `https://codeload.github.com/${repository}/tar.gz/${revision}`,
    },
    node: packageMetadata.engines?.node || '>=24.0.0',
    artifactSchemaVersion,
  };
}

async function writeManifest() {
  const manifest = await createTemplateManifest();
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function cleanManifest() {
  try {
    await unlink(manifestPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

if (process.argv.includes('--write')) {
  await writeManifest();
} else if (process.argv.includes('--clean')) {
  await cleanManifest();
} else {
  console.error('Usage: node write-manifest.mjs --write|--clean');
  process.exitCode = 1;
}
