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

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

export function suggestThemeId(id, ids) {
  const needle = id.toLowerCase();
  let best = null;
  let bestDistance = Infinity;
  for (const candidate of ids) {
    const distance = editDistance(needle, candidate.toLowerCase());
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return bestDistance <= Math.max(2, Math.floor(needle.length / 3)) ? best : null;
}

export function resolveThemeId(themeId) {
  const id = (themeId || process.env.VITE_PAPERS_THEME || 'default').trim();
  const registry = readRegistry();
  const entry = registry.themes.find((theme) => theme.id === id);
  if (!entry) {
    const ids = registry.themes.map((theme) => theme.id);
    const suggestion = suggestThemeId(id, ids);
    throw new Error(
      [
        `Unknown papers theme "${id}" (from VITE_PAPERS_THEME in .env.local, .env, or the build environment).`,
        suggestion ? `Did you mean "${suggestion}"?` : null,
        `Available themes: ${ids.join(', ')}.`,
        'Fix the value or run `npm run papers:theme -- use <id>`; unset it to use "default".',
      ]
        .filter(Boolean)
        .join(' ')
    );
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
