import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frameworkRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const FORBIDDEN_LAZY_IMPORT_PREFIXES = [
  '../providers/',
  './providers/',
  'src/providers/',
] as const;

export const LAZY_IMPORTER_FILES = [
  'src/components/MarkdownRenderer.tsx',
] as const;

export function resolveFrameworkPath(relativePath: string): string {
  return join(frameworkRoot, '..', relativePath);
}

export function findLazyFeatureTargets(importerSource: string): string[] {
  const targets: string[] = [];
  const pattern = /lazy\(\s*\(\)\s*=>\s*import\(['"](\.\/[^'"]+)['"]\)/g;

  for (const match of importerSource.matchAll(pattern)) {
    const target = match[1];
    if (target) {
      targets.push(target);
    }
  }

  return targets;
}

export function validateLazyFeatureSource(source: string, modulePath: string): string[] {
  const issues: string[] = [];

  for (const prefix of FORBIDDEN_LAZY_IMPORT_PREFIXES) {
    const patterns = [
      `from '${prefix}`,
      `from "${prefix}`,
      `import('${prefix}`,
      `import("${prefix}`,
    ];

    if (patterns.some((pattern) => source.includes(pattern))) {
      issues.push(
        `${modulePath}: lazy-loaded feature modules must not import ${prefix} (use CSS, DOM APIs, or pass props from the parent shell instead)`
      );
    }
  }

  return issues;
}

export function validateViteManualChunks(source: string): string[] {
  const issues: string[] = [];

  if (/\/src\//.test(source) && /manualChunks/.test(source)) {
    const appChunkRules = source.match(/id\.includes\(['"][^'"]*\/src\//g) ?? [];
    for (const rule of appChunkRules) {
      issues.push(
        `vite.config.ts: avoid manualChunks rules for app source paths (${rule}); isolating src modules can create circular vendor-react chunks`
      );
    }
  }

  return issues;
}

export function collectLazyFeatureBoundaryIssues(rootDir = join(frameworkRoot, '..')): string[] {
  const issues: string[] = [];

  const viteConfigPath = join(rootDir, 'vite.config.ts');
  issues.push(...validateViteManualChunks(readFileSync(viteConfigPath, 'utf8')));

  for (const importerRelativePath of LAZY_IMPORTER_FILES) {
    const importerPath = join(rootDir, importerRelativePath);
    const importerSource = readFileSync(importerPath, 'utf8');
    const importerDir = dirname(importerPath);

    for (const targetImport of findLazyFeatureTargets(importerSource)) {
      const targetPath = resolve(importerDir, `${targetImport}.tsx`);
      const targetSource = readFileSync(targetPath, 'utf8');
      const targetRelativePath = targetPath.replace(`${rootDir}/`, '');
      issues.push(...validateLazyFeatureSource(targetSource, targetRelativePath));
    }
  }

  return issues;
}