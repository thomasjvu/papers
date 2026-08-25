import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import { resolveAppDir, resolvePackageDir } from './lib/papersPaths.mjs';
import { loadThemeManifest } from './lib/themeRegistry.mjs';

const importMetaUrl = import.meta.url;
const packageDir = resolvePackageDir(importMetaUrl);
const appDir = resolveAppDir(packageDir);
const viteEnv = loadViteEnv(appDir, resolveEnvMode());

const { id, manifest, themeDir } = loadThemeManifest(viteEnv.VITE_PAPERS_THEME);
const themeImports = [`@import '../themes/${id}/tokens.css';`];

if (manifest.fontCss) {
  themeImports.push(`@import '../themes/${id}/${manifest.fontCss}';`);
}

const themeActivePath = path.join(packageDir, 'src', 'theme-active.css');
const generatedDir = path.join(packageDir, 'src', 'lib', 'generated');
const generatedManifestPath = path.join(generatedDir, 'papers-theme.json');
const publicFontsDir = path.join(appDir, 'public', 'fonts');
const themeAssetManifestPath = path.join(appDir, 'public', 'papers-theme-assets.json');
const themeFontAssetsDir = path.join(themeDir, 'assets', 'fonts');
const BASE_FONT_FILES = ['DMSerifDisplay-Regular.ttf', 'Hubot-Sans.ttf', 'Mona-Sans.ttf'];

function readPreviousThemeAssetManifest() {
  if (!existsSync(themeAssetManifestPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(themeAssetManifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not parse ${themeAssetManifestPath}: ${error.message}`);
  }
}

function removePreviouslyGeneratedFonts(previousManifest) {
  for (const fileName of previousManifest?.generatedFontFiles || []) {
    if (
      typeof fileName !== 'string' ||
      path.basename(fileName) !== fileName ||
      BASE_FONT_FILES.includes(fileName)
    ) {
      continue;
    }

    const filePath = path.join(publicFontsDir, fileName);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}

mkdirSync(generatedDir, { recursive: true });
mkdirSync(publicFontsDir, { recursive: true });

const previousThemeAssetManifest = readPreviousThemeAssetManifest();
removePreviouslyGeneratedFonts(previousThemeAssetManifest);

const generatedFontFiles = [];

if (existsSync(themeFontAssetsDir)) {
  for (const fileName of readdirSync(themeFontAssetsDir)) {
    if (!/\.(woff2?|ttf|otf)$/i.test(fileName)) {
      continue;
    }

    cpSync(path.join(themeFontAssetsDir, fileName), path.join(publicFontsDir, fileName));
    generatedFontFiles.push(fileName);
  }
}

writeFileSync(themeActivePath, `${themeImports.join('\n')}\n`, 'utf8');
writeFileSync(generatedManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
const themeAssetManifest = {
  schemaVersion: 1,
  themeId: id,
  baseFontFiles: BASE_FONT_FILES,
  generatedFontFiles: generatedFontFiles.sort(),
};
const themeAssetManifestJson = JSON.stringify(themeAssetManifest, null, 2)
  .replace(
    /"baseFontFiles": \[\n(?:\s+"[^\n]+"(?:,\n|\n))+\s+\]/,
    `"baseFontFiles": [${BASE_FONT_FILES.map((fileName) => JSON.stringify(fileName)).join(', ')}]`
  )
  .replace(
    /"generatedFontFiles": \[\n(?:\s+"[^\n]+"(?:,\n|\n))+\s+\]/,
    `"generatedFontFiles": [${generatedFontFiles
      .map((fileName) => JSON.stringify(fileName))
      .join(', ')}]`
  );
writeFileSync(
  themeAssetManifestPath,
  `${themeAssetManifestJson}\n`,
  'utf8'
);

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
