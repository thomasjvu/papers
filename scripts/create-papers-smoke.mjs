import { cp, mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  assertCondition as assert,
  parseNpmPackJson,
  runCommand as run,
} from './lib/processRun.mjs';

const rootDir = process.cwd();
const fixtureSource = resolve(rootDir, 'test/fixtures/create-papers-template');

const tempRoot = await mkdtemp(join(tmpdir(), 'papers-create-smoke-'));
try {
  const fixtureRoot = join(tempRoot, 'template');
  const consumerRoot = join(tempRoot, 'consumer');
  await cp(fixtureSource, fixtureRoot, { recursive: true });
  await mkdir(consumerRoot);

  const packed = parseNpmPackJson(
    run('npm', ['pack', './packages/create-papers', '--json', '--pack-destination', tempRoot])
  );
  const archivePath = join(tempRoot, packed[0].filename);

  run('npm', ['init', '--yes'], { cwd: consumerRoot });
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', archivePath], {
    cwd: consumerRoot,
  });

  const targetRoot = join(consumerRoot, 'generated-site');
  const cliPath = join(consumerRoot, 'node_modules/create-papers/index.mjs');
  run(process.execPath, [cliPath, targetRoot, '--no-install'], {
    cwd: consumerRoot,
    env: { PAPERS_TEMPLATE_ROOT: fixtureRoot },
  });

  run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: targetRoot });
  run('npm', ['run', 'build'], { cwd: targetRoot });

  const routePath = join(targetRoot, 'dist/docs/getting-started/introduction.html');
  const routeHtml = await readFile(routePath, 'utf8');
  assert(routeHtml.includes('Getting started'), 'generated docs route is missing its title');
  assert(
    routeHtml.includes('Builds without network access.'),
    'generated docs route is missing fixture content'
  );
  assert(!(await readdir(targetRoot)).includes('plans'), 'generated consumer copied plans');

  console.log('packed-package clean-consumer smoke passed.');
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
