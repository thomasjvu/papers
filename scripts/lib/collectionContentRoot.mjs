import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function resolveMonorepoRoot(startDir = process.cwd()) {
  let current = resolve(startDir);
  while (true) {
    if (existsSync(join(current, 'package.json')) && existsSync(join(current, 'shared', 'documentation-config.js'))) {
      return current;
    }
    const parent = resolve(current, '..');
    if (parent === current) {
      return startDir;
    }
    current = parent;
  }
}

export function resolveCollectionContentRoot(collection, rootDir = process.cwd()) {
  const contentDir = collection?.contentDir || 'src/docs/content';
  return join(rootDir, contentDir);
}