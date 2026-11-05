import { lstatSync } from 'fs';
import { join, relative, resolve, sep } from 'path';

import { buildDocsContentPath, getDocsVariantContexts } from '../../shared/docsRouting.js';
import { assertContainedRegularFile } from './contentSourceGuard.mjs';

const DOC_FILE_EXTENSIONS = ['.md', '.mdx'];

function normalizeDocPath(docPath = '') {
  return String(docPath || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
}

function createSourcePath(relativePath) {
  return relativePath.replace(/\\/g, '/');
}

export function createVariantSourceCandidates(docPath, options = {}) {
  const normalizedDocPath = normalizeDocPath(docPath);
  const version =
    typeof options.version === 'string' && options.version.trim() ? options.version.trim() : null;
  const locale =
    typeof options.locale === 'string' && options.locale.trim() ? options.locale.trim() : null;
  const rootDir = options.rootDir || process.cwd();
  const contentDir = String(options.contentDir || join('src', 'docs', 'content')).replaceAll(
    '\\',
    '/'
  );
  const candidateBases = [];

  if (version && locale) {
    candidateBases.push(
      join(contentDir, 'variants', 'versions', version, 'locales', locale, normalizedDocPath)
    );
  }

  if (version) {
    candidateBases.push(join(contentDir, 'variants', 'versions', version, normalizedDocPath));
  }

  if (locale) {
    candidateBases.push(join(contentDir, 'variants', 'locales', locale, normalizedDocPath));
  }

  candidateBases.push(join(contentDir, normalizedDocPath));

  return Array.from(new Set(candidateBases)).flatMap((candidateBase) =>
    DOC_FILE_EXTENSIONS.map((extension) => {
      const relativePath = `${candidateBase}${extension}`;

      const filePath = resolve(rootDir, relativePath);
      const sourcePath = createSourcePath(relative(rootDir, filePath).replaceAll(sep, '/'));

      return { filePath, sourcePath };
    })
  );
}

export function resolveDocFileInfo(docPath, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const contentRoot = resolve(
    rootDir,
    String(options.contentDir || join('src', 'docs', 'content')).replaceAll('\\', '/')
  );
  for (const candidate of createVariantSourceCandidates(docPath, options)) {
    // lstat, not exists: a dangling or outside symlink must fail, not be skipped.
    if (lstatSync(candidate.filePath, { throwIfNoEntry: false })) {
      assertContainedRegularFile(candidate.filePath, contentRoot, rootDir);
      return candidate;
    }
  }

  return null;
}

export function getDefaultDocsVariantContext(options = {}) {
  return (
    getDocsVariantContexts(options).find((context) => context.isDefault) || {
      version: null,
      locale: null,
      key: '',
      isDefault: true,
    }
  );
}

export function getGeneratedDocumentKeys(docPaths, options = {}) {
  const variantContexts = getDocsVariantContexts(options);
  const keys = new Set();

  for (const context of variantContexts) {
    for (const docPath of docPaths) {
      keys.add(
        buildDocsContentPath(docPath, {
          ...options,
          version: context.version,
          locale: context.locale,
        })
      );
    }
  }

  return Array.from(keys);
}
