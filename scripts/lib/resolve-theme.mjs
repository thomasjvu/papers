import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import { loadThemeManifest } from './lib/themeRegistry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const viteEnv = loadViteEnv(rootDir, resolveEnvMode());

const { id, manifest } = loadThemeManifest(viteEnv.VITE_PAPERS_THEME);
const themeActiveCss = `@import '../themes/${id}/tokens.css';\n`;
const themeActivePath = path.join(rootDir, 'src', 'theme-active.css');
const generatedDir = path.join(rootDir, 'src', 'lib', 'generated');
const generatedManifestPath = path.join(generatedDir, 'papers-theme.json');

mkdirSync(generatedDir, { recursive: true });
writeFileSync(themeActivePath, themeActiveCss, 'utf8');
writeFileSync(generatedManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const fontLinks = (manifest.fonts || [])
  .map((font) => `    <link rel="stylesheet" href="${font.href}" />`)
  .join('\n');
const fontSnippetPath = path.join(generatedDir, 'papers-theme-fonts.html');
writeFileSync(
  fontSnippetPath,
  fontLinks ? `${fontLinks}\n` : '',
  'utf8'
);

console.log(`Resolved papers theme: ${id}`);