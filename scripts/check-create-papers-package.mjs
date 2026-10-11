import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const rootDir = process.cwd();
const packageDir = resolve(rootDir, 'packages/create-papers');
const expectedFiles = new Set([
  'LICENSE',
  'README.md',
  'index.mjs',
  'package.json',
  'template-manifest.json',
]);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed:\n${result.stdout || ''}\n${result.stderr || ''}`
    );
  }
  return result.stdout;
}

function parseNpmPackJson(output) {
  const jsonStart = output.indexOf('[');
  if (jsonStart < 0) {
    throw new Error(`npm pack did not return JSON:\n${output}`);
  }
  return JSON.parse(output.slice(jsonStart));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const rootPackage = JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf8'));
const starterPackage = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'));
assert(
  starterPackage.version === rootPackage.version,
  `starter version ${starterPackage.version} does not match framework version ${rootPackage.version}`
);
assert(
  starterPackage.engines?.node === rootPackage.engines?.node,
  'starter and framework Node ranges differ'
);

const releaseTag = process.env.RELEASE_TAG?.trim();
if (releaseTag) {
  assert(
    releaseTag === `v${starterPackage.version}`,
    `release tag ${releaseTag} does not match package version`
  );
}

const dryRun = parseNpmPackJson(
  run('npm', ['pack', './packages/create-papers', '--dry-run', '--json'])
);
assert(dryRun.length === 1, 'npm pack dry run returned an unexpected number of packages');
const dryRunFiles = new Set(dryRun[0].files.map(({ path }) => path));
assert(
  JSON.stringify([...dryRunFiles].sort()) === JSON.stringify([...expectedFiles].sort()),
  `unexpected package files: ${[...dryRunFiles].sort().join(', ')}`
);

const tempRoot = await mkdtemp(join(tmpdir(), 'papers-package-check-'));
try {
  const packed = parseNpmPackJson(
    run('npm', ['pack', './packages/create-papers', '--json', '--pack-destination', tempRoot])
  );
  const archivePath = join(tempRoot, packed[0].filename);
  const manifest = JSON.parse(
    execFileSync('tar', ['-xOf', archivePath, 'package/template-manifest.json'], {
      encoding: 'utf8',
    })
  );
  assert(manifest.schemaVersion === 1, 'template manifest schema version is invalid');
  assert(
    /^[0-9a-f]{40}$/.test(manifest.template?.revision || ''),
    'template revision is not pinned'
  );
  assert(
    manifest.template.archive.endsWith(`/tar.gz/${manifest.template.revision}`),
    'template archive is not pinned to the manifest revision'
  );
  assert(
    manifest.frameworkVersion === starterPackage.version,
    'manifest version drifted from package version'
  );
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

console.log('create-papers package checks passed.');
