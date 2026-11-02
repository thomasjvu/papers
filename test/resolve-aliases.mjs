import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve as resolvePath, extname } from 'node:path';
import { statSync } from 'node:fs';

const testRoot = fileURLToPath(new URL('./', import.meta.url));
const repositoryRoot = resolvePath(testRoot, '..');

function resolveRepositoryFile(relativePath) {
  return pathToFileURL(resolvePath(repositoryRoot, relativePath)).href;
}

function resolveLocalFile(url) {
  if (!url.startsWith('file:')) return url;
  const file = fileURLToPath(url);
  const candidates =
    extname(file) === '.js'
      ? [file, file.slice(0, -3) + '.ts', file.slice(0, -3) + '.tsx']
      : [
          file,
          file + '.ts',
          file + '.tsx',
          resolvePath(file, 'index.ts'),
          resolvePath(file, 'index.tsx'),
        ];
  for (const candidate of candidates) {
    if (statSync(candidate, { throwIfNoEntry: false })?.isFile())
      return pathToFileURL(candidate).href;
  }
  return url;
}

export function resolve(specifier, context, nextResolve) {
  if (specifier === '@app-shared/documentation-config.js') {
    return {
      url: resolveRepositoryFile('shared/documentation-config.js'),
      shortCircuit: true,
    };
  }

  if (specifier.startsWith('@/')) {
    return {
      url: resolveLocalFile(resolveRepositoryFile(`src/${specifier.slice(2)}`)),
      shortCircuit: true,
    };
  }

  try {
    return nextResolve(specifier, context);
  } catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND' && error.code !== 'ERR_UNSUPPORTED_DIR_IMPORT') {
      throw error;
    }
    if ((specifier.startsWith('.') || specifier.startsWith('file:')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL).href;
      const resolved = resolveLocalFile(url);
      if (resolved !== url) return { url: resolved, shortCircuit: true };
    }
    throw error;
  }
}
