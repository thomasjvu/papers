// Three-way upgrade of a site's copy of the Papers framework.
//
// A site records the Papers commit its framework files came from in
// papers.lock.json. Upgrading applies only what changed upstream between that
// commit and the target release, merging it with the site's own edits the same
// way `git merge` would. Site content and site-owned paths are never touched.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';

export const LOCK_FILE = 'papers.lock.json';
export const UPGRADE_CONFIG_FILE = 'papers.upgrade.json';
export const DEFAULT_REPOSITORY = 'https://github.com/thomasjvu/papers.git';
export const UPSTREAM_REF_PREFIX = 'refs/papers-upstream';

// Used when the target release does not ship papers.upgrade.json.
export const DEFAULT_SITE_OWNED = [
  '.github/**',
  '.forgejo/**',
  'AGENTS.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'README.md',
  'SECURITY.md',
  'docs/**',
  'packages/**',
  'plans/**',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'wrangler.toml',
  'public/docs-content/**',
  'src/docs/content/**',
  'src/data/**',
  'src/lib/generated/**',
  LOCK_FILE,
];

const SEMVER_TAG = /^v(\d+)\.(\d+)\.(\d+)$/;

export function globToRegExp(glob) {
  let source = '';
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    if (char === '*' && glob[index + 1] === '*') {
      const followedBySlash = glob[index + 2] === '/';
      source += followedBySlash ? '(?:.*/)?' : '.*';
      index += followedBySlash ? 2 : 1;
    } else if (char === '*') {
      source += '[^/]*';
    } else if (char === '?') {
      source += '[^/]';
    } else {
      source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${source}$`);
}

export function createPathFilter(globs) {
  const patterns = globs.map(globToRegExp);
  return (path) => patterns.some((pattern) => pattern.test(path));
}

export function compareSemverTags(left, right) {
  const a = left.match(SEMVER_TAG).slice(1).map(Number);
  const b = right.match(SEMVER_TAG).slice(1).map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

export function latestSemverTag(tags) {
  const releases = tags.filter((tag) => SEMVER_TAG.test(tag)).sort(compareSemverTags);
  return releases.at(-1) || null;
}

function git(cwd, args, options = {}) {
  return execFileSync('git', args, {
    cwd,
    encoding: options.buffer ? 'buffer' : 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['pipe', 'pipe', options.quiet ? 'ignore' : 'pipe'],
    input: options.input,
  });
}

function tryGit(cwd, args, options = {}) {
  try {
    return git(cwd, args, { ...options, quiet: true });
  } catch {
    return null;
  }
}

export function resolveSite(siteDir) {
  const site = resolve(siteDir);
  const root = git(site, ['rev-parse', '--show-toplevel']).trim();
  const prefix = relative(root, site).split('\\').join('/');
  return { site, root, prefix: prefix ? `${prefix}/` : '' };
}

export function readLock(site) {
  const path = join(site, LOCK_FILE);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeLock(site, lock) {
  writeFileSync(join(site, LOCK_FILE), `${JSON.stringify(lock, null, 2)}\n`);
}

export function fetchUpstream(root, repository) {
  git(root, [
    'fetch',
    '--quiet',
    '--no-tags',
    '--force',
    repository,
    `+refs/heads/main:${UPSTREAM_REF_PREFIX}/main`,
    `+refs/tags/*:${UPSTREAM_REF_PREFIX}/tags/*`,
  ]);
}

export function listUpstreamTags(root) {
  const out = git(root, [
    'for-each-ref',
    '--format=%(refname:strip=3)',
    `${UPSTREAM_REF_PREFIX}/tags/`,
  ]);
  return out.split('\n').filter(Boolean);
}

export function resolveUpstreamCommit(root, repository, ref) {
  const candidates = [];
  if (!ref || ref === 'latest') {
    const tag = latestSemverTag(listUpstreamTags(root));
    if (!tag) throw new Error('No vX.Y.Z release tag found upstream. Pass --to <ref>.');
    ref = tag;
  }
  candidates.push(`${UPSTREAM_REF_PREFIX}/tags/${ref}`, `${UPSTREAM_REF_PREFIX}/${ref}`, ref);
  for (const candidate of candidates) {
    const sha = tryGit(root, ['rev-parse', '--verify', '--quiet', `${candidate}^{commit}`]);
    if (sha) return { ref, commit: sha.trim() };
  }
  // A bare commit that is not on main or a tag: fetch it directly.
  if (/^[0-9a-f]{7,40}$/i.test(ref)) {
    tryGit(root, ['fetch', '--quiet', '--no-tags', repository, ref]);
    const sha = tryGit(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    if (sha) return { ref, commit: sha.trim() };
  }
  throw new Error(`Cannot resolve Papers ref "${ref}" in ${repository}.`);
}

function readBlob(root, commit, path) {
  return tryGit(root, ['cat-file', 'blob', `${commit}:${path}`], { buffer: true });
}

function readMode(root, commit, path) {
  const out = tryGit(root, ['ls-tree', commit, '--', path]);
  return out ? out.split(/\s/)[0] : null;
}

export function readSiteOwned(root, commit) {
  const config = readBlob(root, commit, UPGRADE_CONFIG_FILE);
  if (!config) return DEFAULT_SITE_OWNED;
  const parsed = JSON.parse(config.toString('utf8'));
  return Array.isArray(parsed.siteOwned) ? parsed.siteOwned : DEFAULT_SITE_OWNED;
}

function isBinary(buffer) {
  return buffer.subarray(0, 8000).includes(0);
}

function mergeText(base, ours, theirs, labels) {
  const dir = mkdtempSync(join(tmpdir(), 'papers-merge-'));
  try {
    const files = ['ours', 'base', 'theirs'].map((name) => join(dir, name));
    writeFileSync(files[0], ours);
    writeFileSync(files[1], base);
    writeFileSync(files[2], theirs);
    try {
      const merged = execFileSync(
        'git',
        ['merge-file', '-p', '-L', labels[0], '-L', labels[1], '-L', labels[2], ...files],
        { maxBuffer: 64 * 1024 * 1024 }
      );
      return { merged, conflicts: 0 };
    } catch (error) {
      if (typeof error.status === 'number' && error.status > 0 && error.stdout) {
        return { merged: error.stdout, conflicts: error.status };
      }
      throw error;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function listChangedPaths(root, base, target) {
  const out = git(root, ['diff', '--name-only', '--no-renames', '-z', base, target]);
  return out.split('\0').filter(Boolean);
}

/**
 * Apply upstream changes base..target to the site directory.
 * Returns a report with one entry per upstream-changed path.
 */
export async function applyUpgrade({ root, site, base, target, siteOwned, exclude = [] }) {
  const isSiteOwned = createPathFilter([...siteOwned, ...exclude]);
  const report = {
    updated: [],
    added: [],
    deleted: [],
    merged: [],
    conflicts: [],
    keptSiteRemoval: [],
    alreadyCurrent: [],
    skippedSiteOwned: [],
  };
  const labels = ['site', `papers ${base.slice(0, 7)}`, `papers ${target.slice(0, 7)}`];

  for (const path of listChangedPaths(root, base, target)) {
    if (isSiteOwned(path)) {
      report.skippedSiteOwned.push(path);
      continue;
    }
    const destination = join(site, path);
    const baseBlob = readBlob(root, base, path);
    const theirs = readBlob(root, target, path);
    const ours =
      existsSync(destination) && statSync(destination).isFile()
        ? await readFile(destination)
        : null;

    const writeTheirs = async () => {
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, theirs);
      if (readMode(root, target, path) === '100755') await chmod(destination, 0o755);
    };

    if (theirs === null) {
      if (ours === null) continue;
      if (baseBlob && ours.equals(baseBlob)) {
        await rm(destination);
        report.deleted.push(path);
      } else {
        report.conflicts.push({ path, reason: 'Papers deleted this file; the site changed it.' });
      }
      continue;
    }
    if (ours === null) {
      if (baseBlob === null) {
        await writeTheirs();
        report.added.push(path);
      } else {
        report.keptSiteRemoval.push(path);
      }
      continue;
    }
    if (ours.equals(theirs)) {
      report.alreadyCurrent.push(path);
      continue;
    }
    if (baseBlob && ours.equals(baseBlob)) {
      await writeTheirs();
      report.updated.push(path);
      continue;
    }
    if (isBinary(ours) || isBinary(theirs) || (baseBlob && isBinary(baseBlob))) {
      report.conflicts.push({ path, reason: 'Binary file changed by both Papers and the site.' });
      continue;
    }
    const { merged, conflicts } = mergeText(baseBlob || Buffer.alloc(0), ours, theirs, labels);
    await writeFile(destination, merged);
    if (conflicts > 0) {
      report.conflicts.push({ path, reason: `${conflicts} conflicting hunk(s); see markers.` });
    } else {
      report.merged.push(path);
    }
  }
  return report;
}

const FRAMEWORK_PROBE_PATHS = [
  'index.html',
  'vite.config.ts',
  'public/js',
  'scripts',
  'src/components',
  'src/hooks',
  'src/providers',
  'src/utils',
];

/** Find the upstream commit whose framework files differ least from the site's HEAD. */
export function detectBase(root, prefix) {
  const siteTree = `HEAD:${prefix}`;
  const commits = git(root, ['rev-list', `${UPSTREAM_REF_PREFIX}/main`])
    .split('\n')
    .filter(Boolean);
  let best = null;
  for (const commit of commits) {
    const out = git(root, ['diff', '--numstat', commit, siteTree, '--', ...FRAMEWORK_PROBE_PATHS]);
    let score = 0;
    for (const line of out.split('\n').filter(Boolean)) {
      const [added, removed] = line.split('\t');
      score += (Number(added) || 1) + (Number(removed) || 1);
    }
    if (!best || score < best.score) best = { commit, score };
  }
  return best;
}

export function formatReport(report, { from, to }) {
  const lines = [`Papers upgrade ${from} -> ${to}`, ''];
  const section = (title, items) => {
    if (items.length === 0) return;
    lines.push(`${title} (${items.length})`);
    for (const item of items) {
      lines.push(typeof item === 'string' ? `- ${item}` : `- ${item.path}: ${item.reason}`);
    }
    lines.push('');
  };
  section('Conflicts to resolve', report.conflicts);
  section('Merged with site changes', report.merged);
  section('Updated', report.updated);
  section('Added', report.added);
  section('Deleted', report.deleted);
  section('Kept removed by the site', report.keptSiteRemoval);
  lines.push(
    `Already current: ${report.alreadyCurrent.length}; site-owned and skipped: ${report.skippedSiteOwned.length}.`
  );
  return lines.join('\n');
}

function versionTuple(version) {
  const match = String(version || '').match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

/**
 * Run the codemods in the site's (already upgraded) scripts/migrations/ whose
 * version is newer than `fromVersion` and not newer than `toVersion`.
 */
export async function runMigrations({ root, site, target, fromVersion, toVersion }) {
  const from = versionTuple(fromVersion);
  const to = versionTuple(toVersion);
  const dir = join(site, 'scripts', 'migrations');
  if (!from || !to || !existsSync(dir)) return [];
  const upstreamPaths = new Set(
    git(root, ['ls-tree', '-r', '--name-only', target]).split('\n').filter(Boolean)
  );
  const isUpstreamPath = (path) => upstreamPaths.has(path);
  const { readdirSync } = await import('node:fs');
  const { pathToFileURL } = await import('node:url');
  const migrations = readdirSync(dir)
    .map((name) => ({ name, version: versionTuple(name) }))
    .filter((entry) => entry.version && /\.mjs$/.test(entry.name))
    .filter(
      (entry) => compareVersions(entry.version, from) > 0 && compareVersions(entry.version, to) <= 0
    )
    .sort((a, b) => compareVersions(a.version, b.version));
  const results = [];
  for (const migration of migrations) {
    const module = await import(pathToFileURL(join(dir, migration.name)).href);
    const changed = await module.run({ site, isUpstreamPath });
    results.push({
      version: migration.name.replace(/\.mjs$/, ''),
      description: module.description,
      changed,
    });
  }
  return results;
}
