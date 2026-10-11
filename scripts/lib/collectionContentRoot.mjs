import { existsSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

export function resolveMonorepoRoot(startDir = process.cwd()) {
  let current = resolve(startDir);
  while (true) {
    if (
      existsSync(join(current, 'package.json')) &&
      existsSync(join(current, 'shared', 'documentation-config.js'))
    ) {
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
  const contentDir = String(collection?.contentDir || 'src/docs/content').replaceAll('\\', '/');
  const resolvedRoot = resolve(rootDir);
  const resolvedContentRoot = resolve(resolvedRoot, contentDir);
  const relativePath = relative(resolvedRoot, resolvedContentRoot);

  if (
    isAbsolute(contentDir) ||
    relativePath === '..' ||
    relativePath.startsWith(`..${sep}`) ||
    relativePath.startsWith(sep)
  ) {
    throw new Error(
      `Content collection root "${contentDir}" escapes the repository root "${resolvedRoot}".`
    );
  }

  return resolvedContentRoot;
}

export function resolveCollectionFrameworkContentRoot(collection, rootDir = process.cwd()) {
  return resolveCollectionContentRoot(
    {
      ...collection,
      contentDir: collection?.frameworkContentDir || collection?.contentDir || 'src/docs/content',
    },
    rootDir
  );
}
