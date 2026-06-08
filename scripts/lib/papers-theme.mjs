import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readRegistry, resolveThemeId } from './lib/themeRegistry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envLocalPath = path.join(rootDir, '.env.local');

const [command, themeArg] = process.argv.slice(2);

function readEnvLocal() {
  if (!existsSync(envLocalPath)) {
    return '';
  }
  return readFileSync(envLocalPath, 'utf8');
}

function upsertEnvValue(source, key, value) {
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  if (pattern.test(source)) {
    return source.replace(pattern, line);
  }
  const trimmed = source.trimEnd();
  return trimmed.length > 0 ? `${trimmed}\n${line}\n` : `${line}\n`;
}

if (command === 'list') {
  const registry = readRegistry();
  for (const theme of registry.themes) {
    console.log(`${theme.id}\t${theme.name}\t${theme.description}`);
  }
  process.exit(0);
}

if (command === 'use') {
  if (!themeArg) {
    console.error('Usage: node scripts/papers-theme.mjs use <theme-id>');
    process.exit(1);
  }
  const themeId = resolveThemeId(themeArg);
  const nextEnv = upsertEnvValue(readEnvLocal(), 'VITE_PAPERS_THEME', themeId);
  writeFileSync(envLocalPath, nextEnv, 'utf8');
  console.log(`Set VITE_PAPERS_THEME=${themeId} in .env.local`);
  console.log('Run: npm run resolve:theme && npm run dev');
  process.exit(0);
}

console.error('Usage:');
console.error('  node scripts/papers-theme.mjs list');
console.error('  node scripts/papers-theme.mjs use <theme-id>');
process.exit(1);