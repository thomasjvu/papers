import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const LAST_UPDATED_FILENAME = 'docs-last-updated.json';

/** Normalize a frontmatter `lastUpdated` value (string or Date) to ISO 8601, or null. */
export function normalizeLastUpdated(value) {
  if (value === undefined || value === null || value === '' || value === false) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Committer date of the last commit touching `sourcePath`, or null when untracked. */
export function gitLastCommitDate(rootDir, sourcePath) {
  try {
    const output = execFileSync('git', ['log', '-1', '--format=%cI', '--', sourcePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return normalizeLastUpdated(output);
  } catch {
    return null;
  }
}

/**
 * Build `{ pages: { canonicalPath: iso } }` from document artifacts.
 * A frontmatter `lastUpdated` date wins over the git date.
 */
export function createLastUpdatedManifest(documents, lookupGitDate) {
  const pages = {};
  for (const document of documents) {
    const canonicalPath = document?.metadata?.canonicalPath;
    const sourcePath = document?.sourcePath || document?.metadata?.sourcePath;
    if (!canonicalPath) continue;
    const override = document?.frontmatter?.lastUpdated;
    const iso = normalizeLastUpdated(override) || (sourcePath ? lookupGitDate(sourcePath) : null);
    if (iso) pages[canonicalPath] = iso;
  }
  const sorted = Object.fromEntries(
    Object.entries(pages).sort(([left], [right]) => left.localeCompare(right))
  );
  return { pages: sorted };
}

/** Read every document artifact under `<distDir>/*-content/**.json`. */
export async function readDistDocumentArtifacts(distDir) {
  const documents = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.json')) {
        try {
          documents.push(JSON.parse(await readFile(full, 'utf8')));
        } catch {
          // Non-document JSON is ignored.
        }
      }
    }
  };
  for (const entry of await readdir(distDir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.endsWith('-content')) {
      await walk(join(distDir, entry.name));
    }
  }
  return documents;
}
