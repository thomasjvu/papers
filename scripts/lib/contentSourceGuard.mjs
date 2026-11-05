// Content sources are untrusted. A Markdown file that is a symlink, or that
// sits under a symlinked directory, could make the build publish any file
// readable on the build host. Every source read goes through this guard.
import { lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

export function isPathInside(parent, child) {
  const rel = relative(parent, child);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

/**
 * Throw unless `filePath` is a regular file (not a symlink) whose real path is
 * inside the real path of `contentRoot`. When `rootDir` is given, the real
 * content root must also stay inside the real repository root.
 * Returns the real path of the file.
 */
export function assertContainedRegularFile(filePath, contentRoot, rootDir) {
  const stat = lstatSync(filePath);
  if (stat.isSymbolicLink()) {
    throw new Error(`Content sources must be regular files, not symlinks: ${filePath}`);
  }
  if (!stat.isFile()) {
    throw new Error(`Content source is not a regular file: ${filePath}`);
  }
  const realRoot = realpathSync(resolve(contentRoot));
  if (rootDir && !isPathInside(realpathSync(resolve(rootDir)), realRoot)) {
    throw new Error(`Content root "${contentRoot}" escapes the repository root "${rootDir}".`);
  }
  const realFile = realpathSync(filePath);
  if (!isPathInside(realRoot, realFile)) {
    throw new Error(`Content source escapes its collection root "${contentRoot}": ${filePath}`);
  }
  return realFile;
}
