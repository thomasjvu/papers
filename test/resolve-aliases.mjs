import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';

const testRoot = fileURLToPath(new URL('./', import.meta.url));
const repositoryRoot = resolvePath(testRoot, '..');

function resolveRepositoryFile(relativePath) {
  return pathToFileURL(resolvePath(repositoryRoot, relativePath)).href;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@app-shared/documentation-config.js') {
    return {
      url: resolveRepositoryFile('shared/documentation-config.js'),
      shortCircuit: true,
    };
  }

  if (specifier.startsWith('@/')) {
    return {
      url: resolveRepositoryFile(`src/${specifier.slice(2)}`),
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}
