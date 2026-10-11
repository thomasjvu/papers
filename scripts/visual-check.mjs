#!/usr/bin/env node
// Builds every registered theme and compares (or with --update, records) visual snapshots.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const update = process.argv.includes('--update');
const only = process.argv.find((arg) => arg.startsWith('--theme='))?.slice('--theme='.length);
const registry = JSON.parse(readFileSync(new URL('../themes/registry.json', import.meta.url)));
const themes = registry.themes.map((theme) => theme.id).filter((id) => !only || id === only);

function run(command, args, env) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  });
  return result.status ?? 1;
}

let failures = 0;
for (const theme of themes) {
  console.log(`\n=== theme: ${theme} ===`);
  if (run('npm', ['run', 'build', '--silent'], { VITE_PAPERS_THEME: theme }) !== 0) {
    failures += 1;
    continue;
  }
  const args = ['playwright', 'test', '-c', 'playwright.visual.config.mjs'];
  if (update) args.push('--update-snapshots');
  if (run('npx', args, { PAPERS_VISUAL_THEME: theme }) !== 0) failures += 1;
}

// Leave the default theme resolved so the working tree matches the committed artifacts.
if (!only || only !== 'default') {
  run('npm', ['run', 'build', '--silent'], { VITE_PAPERS_THEME: 'default' });
}
process.exit(failures > 0 ? 1 : 0);
