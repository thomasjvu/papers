#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(packageRoot, '..', '..');
const defaultRepo = 'thomasjvu/papers';

const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  '.husky',
  'dist',
  'node_modules',
  'packages',
  '.cursor',
]);

const EXCLUDED_FILES = new Set(['.DS_Store']);

function printUsage() {
  console.log(`Usage: npm create papers [directory]

Examples:
  npm create papers my-docs
  npx create-papers my-docs

Options:
  --repo <owner/name>   GitHub template repository (default: ${defaultRepo})
  --no-install          Skip npm install after scaffolding
`);
}

function parseArgs(argv) {
  const options = {
    targetDir: 'papers-docs',
    repo: process.env.PAPERS_TEMPLATE_REPO || defaultRepo,
    install: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--no-install') {
      options.install = false;
      continue;
    }

    if (arg === '--repo') {
      options.repo = argv[index + 1];
      index += 1;
      continue;
    }

    if (!arg.startsWith('-')) {
      options.targetDir = arg;
    }
  }

  return options;
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
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

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

async function scaffoldFromLocalTemplate(targetDir) {
  console.log(`Copying local papers template from ${docsRoot}`);
  await copyTemplateDirectory(docsRoot, targetDir);
}

async function scaffoldFromGitHub(targetDir, repo) {
  console.log(`Downloading ${repo} with degit...`);
  run('npx', ['--yes', 'degit', repo, targetDir]);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const targetDir = resolve(process.cwd(), options.targetDir);

  if (await pathExists(targetDir)) {
    const entries = await readdir(targetDir);
    if (entries.length > 0) {
      throw new Error(`Target directory is not empty: ${targetDir}`);
    }
  }

  const useLocalTemplate =
    process.env.PAPERS_TEMPLATE_ROOT === 'local' || (await pathExists(join(docsRoot, 'package.json')));

  if (useLocalTemplate && (process.env.PAPERS_TEMPLATE_ROOT === 'local' || options.repo === defaultRepo)) {
    await scaffoldFromLocalTemplate(targetDir);
  } else {
    await scaffoldFromGitHub(targetDir, options.repo);
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});