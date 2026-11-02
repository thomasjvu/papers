// Failure modes: an old direct KaTeX override conflicts with the new dependency,
// a custom override is overwritten, or repeating an upgrade changes it again.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const description = 'Align obsolete KaTeX overrides with the maintained direct dependency';

export async function run({ site }) {
  const path = join(site, 'package.json');
  const source = await readFile(path, 'utf8');
  const pkg = JSON.parse(source);
  const override = pkg.overrides?.katex;
  if (!/^\^?0\.19\./.test(pkg.dependencies?.katex || '')) return [];
  if (typeof override !== 'string' || !/^[\s^~|0-9.<>=-]+$/.test(override)) return [];
  if (!/0\.(16|18)\./.test(override)) return [];
  pkg.overrides.katex = '$katex';
  await writeFile(path, JSON.stringify(pkg, null, 2) + '\n');
  return ['package.json'];
}
