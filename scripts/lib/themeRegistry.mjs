import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const themesDir = path.join(rootDir, 'themes');

export function readRegistry() {
  const registryPath = path.join(themesDir, 'registry.json');
  const raw = readFileSync(registryPath, 'utf8');
  return JSON.parse(raw);
}

export function resolveThemeId(themeId) {
  const id = (themeId || process.env.VITE_PAPERS_THEME || 'default').trim();
  const registry = readRegistry();
  const entry = registry.themes.find((theme) => theme.id === id);
  if (!entry) {
    const available = registry.themes.map((theme) => theme.id).join(', ');
    throw new Error(`Unknown papers theme "${id}". Available: ${available}`);
  }
  return entry.id;
}

export function loadThemeManifest(themeId) {
  const id = resolveThemeId(themeId);
  const manifestPath = path.join(themesDir, id, 'theme.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing theme manifest at ${manifestPath}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const tokensPath = path.join(themesDir, id, manifest.css || 'tokens.css');
  if (!existsSync(tokensPath)) {
    throw new Error(`Missing theme tokens at ${tokensPath}`);
  }
  return { id, manifest, tokensPath, themeDir: path.join(themesDir, id) };
}