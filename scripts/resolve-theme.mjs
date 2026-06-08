import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import { loadThemeManifest } from './lib/themeRegistry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const viteEnv = loadViteEnv(rootDir, resolveEnvMode());

const { id, manifest, themeDir } = loadThemeManifest(viteEnv.VITE_PAPERS_THEME);
const themeImports = [`@import '../themes/${id}/tokens.css';`];

if (manifest.fontCss) {
  themeImports.push(`@import '../themes/${id}/${manifest.fontCss}';`);
}

const themeActivePath = path.join(rootDir, 'src', 'theme-active.css');
const generatedDir = path.join(rootDir, 'src', 'lib', 'generated');
const generatedManifestPath = path.join(generatedDir, 'papers-theme.json');
const publicFontsDir = path.join(rootDir, 'public', 'fonts');
const themeFontAssetsDir = path.join(themeDir, 'assets', 'fonts');

mkdirSync(generatedDir, { recursive: true });
mkdirSync(publicFontsDir, { recursive: true });

if (existsSync(themeFontAssetsDir)) {
  for (const fileName of readdirSync(themeFontAssetsDir)) {
    if (!/\.(woff2?|ttf|otf)$/i.test(fileName)) {
      continue;
    }

    cpSync(path.join(themeFontAssetsDir, fileName), path.join(publicFontsDir, fileName));
  }
}

writeFileSync(themeActivePath, `${themeImports.join('\n')}\n`, 'utf8');
writeFileSync(generatedManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const fontSnippets = (manifest.fonts || [])
  .map((font) => {
    if (font.preload) {
      const crossOrigin = font.crossOrigin === false ? '' : ' crossorigin';
      const type = font.type || 'font/woff2';
      return `    <link rel="preload" href="${font.preload}" as="font" type="${type}"${crossOrigin} />`;
    }

    if (font.href) {
      return `    <link rel="stylesheet" href="${font.href}" />`;
    }

    return null;
  })
  .filter(Boolean)
  .join('\n');

const fontSnippetPath = path.join(generatedDir, 'papers-theme-fonts.html');
writeFileSync(fontSnippetPath, fontSnippets ? `${fontSnippets}\n` : '', 'utf8');

console.log(`Resolved papers theme: ${id}`);