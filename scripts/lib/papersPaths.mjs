import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function resolvePackageDir(importMetaUrl) {
  const scriptDir = path.dirname(fileURLToPath(importMetaUrl));
  return path.resolve(scriptDir, '..');
}

export function resolveAppDir(packageDir) {
  return packageDir;
}

export function resolveScanDirs(_packageDir, appDir) {
  return [path.join(appDir, 'src'), path.join(appDir, 'shared')];
}