// 0.2.0 moved to Tailwind 4 and prefixed theme tokens that clashed with
// Tailwind's namespaces. Rename them in the site's own CSS and themes.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

export const description =
  'Rename --text-*, --leading-*, --radius-*, --shadow-* tokens to --papers-*';

const TOKEN = /(?<![\w-])--((?:text|leading|radius|shadow)-[a-z0-9-]+)/g;
const RENAMED = new Set([
  'text-color',
  'text-secondary',
  'text-2xs',
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',
  'leading-tight',
  'leading-snug',
  'leading-normal',
  'leading-relaxed',
  'leading-loose',
  'radius-sm',
  'radius-md',
  'radius-lg',
  'radius-xl',
  'shadow-sm',
  'shadow-md',
  'shadow-lg',
  'shadow-focus',
]);

export function renameTokens(source) {
  return source.replace(TOKEN, (match, name) => (RENAMED.has(name) ? `--papers-${name}` : match));
}

async function* walk(dir) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (/\.(css|tsx?|jsx?|mjs)$/.test(entry.name)) yield path;
  }
}

/** Only files the site owns (not shipped by Papers) are rewritten. */
export async function run({ site, isUpstreamPath }) {
  const changed = [];
  for (const top of ['themes', 'src', 'shared']) {
    for await (const file of walk(join(site, top))) {
      const path = relative(site, file).split('\\').join('/');
      if (isUpstreamPath(path)) continue;
      const before = await readFile(file, 'utf8');
      const after = renameTokens(before);
      if (after !== before) {
        await writeFile(file, after);
        changed.push(path);
      }
    }
  }
  return changed;
}
