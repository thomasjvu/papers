#!/usr/bin/env node
// Upgrade this site's Papers framework files to a newer Papers release.
// Run `node scripts/papers-upgrade.mjs --help` for usage.
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import {
  DEFAULT_REPOSITORY,
  LOCK_FILE,
  applyUpgrade,
  detectBase,
  fetchUpstream,
  formatReport,
  readLock,
  readSiteOwned,
  resolveSite,
  resolveUpstreamCommit,
  runMigrations,
  writeLock,
} from './lib/papersUpgrade.mjs';

const HELP = `Usage: node scripts/papers-upgrade.mjs [options]
       npx @thomasjvu/papers upgrade [options]

Upgrades the Papers framework files in this site to a newer Papers release with
a three-way merge. Site content, config edits and branding are kept; only what
changed upstream is applied. The site's ${LOCK_FILE} records the Papers release
the framework files currently match.

Options:
  --to <ref>           Release tag, branch or commit (default: latest vX.Y.Z tag)
  --site <dir>         Site directory (default: current directory)
  --repository <url>   Papers repository (default: from ${LOCK_FILE}, else ${DEFAULT_REPOSITORY})
  --check              Only report whether an upgrade is available (exit 10 if so)
  --init <ref>         Adopt the upgrader: record <ref> as the current base, change nothing else
  --detect-base        Print the Papers commit closest to this site's framework files
  --install-workflow   Write a weekly CI workflow that opens upgrade pull requests
  --allow-dirty        Run even if the site has uncommitted changes
  --report <file>      Also write the report as Markdown to <file>
  -h, --help           Show this help

Exit codes: 0 done, 3 upgraded with conflicts to resolve, 10 upgrade available (--check).`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    to: { type: 'string' },
    site: { type: 'string', default: '.' },
    repository: { type: 'string' },
    check: { type: 'boolean', default: false },
    init: { type: 'string' },
    'detect-base': { type: 'boolean', default: false },
    'install-workflow': { type: 'boolean', default: false },
    'allow-dirty': { type: 'boolean', default: false },
    report: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help) {
  console.log(HELP);
  process.exit(0);
}

if (positionals.length > 1 || (positionals[0] && positionals[0] !== 'upgrade')) {
  console.error(`Unknown command: ${positionals.join(' ')}\n\n${HELP}`);
  process.exit(2);
}

function output(key, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

function readVersion(root, commit) {
  try {
    const pkg = execFileSync('git', ['show', `${commit}:package.json`], {
      cwd: root,
      encoding: 'utf8',
    });
    return JSON.parse(pkg).version || null;
  } catch {
    return null;
  }
}

const { site, root, prefix } = resolveSite(values.site);
const lock = readLock(site);
const repository = values.repository || lock?.repository || DEFAULT_REPOSITORY;

if (values['install-workflow']) {
  const template = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'templates', 'papers-upgrade.workflow.yml'),
    'utf8'
  );
  const forge = existsSync(join(root, '.forgejo', 'workflows')) ? '.forgejo' : '.github';
  const destination = join(root, forge, 'workflows', 'papers-upgrade.yml');
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, template.replaceAll('__SITE_DIR__', prefix.replace(/\/$/, '') || '.'));
  console.log(`Wrote ${destination}`);
  process.exit(0);
}

fetchUpstream(root, repository);

if (values['detect-base']) {
  const best = detectBase(root, prefix);
  console.log(JSON.stringify({ commit: best.commit, differingLines: best.score }));
  process.exit(0);
}

if (values.init) {
  const resolved = resolveUpstreamCommit(root, repository, values.init);
  writeLock(site, {
    repository,
    version: readVersion(root, resolved.commit),
    ref: resolved.ref,
    commit: resolved.commit,
    exclude: lock?.exclude || [],
  });
  console.log(`Recorded Papers ${resolved.ref} (${resolved.commit.slice(0, 7)}) in ${LOCK_FILE}.`);
  process.exit(0);
}

if (!lock?.commit) {
  console.error(
    `No ${LOCK_FILE} in ${site}. Adopt the upgrader first:\n` +
      '  node scripts/papers-upgrade.mjs --detect-base\n' +
      '  node scripts/papers-upgrade.mjs --init <commit>'
  );
  process.exit(1);
}

const target = resolveUpstreamCommit(root, repository, values.to);
const version = readVersion(root, target.commit);
output('version', version || target.commit.slice(0, 7));
output('ref', target.ref);

if (target.commit === lock.commit) {
  console.log(`Already on Papers ${target.ref} (${target.commit.slice(0, 7)}).`);
  output('available', 'false');
  process.exit(0);
}

if (values.check) {
  console.log(
    `Papers ${target.ref} is available (site is on ${lock.ref || lock.commit.slice(0, 7)}).`
  );
  output('available', 'true');
  process.exit(10);
}

if (!values['allow-dirty']) {
  const dirty = execFileSync('git', ['status', '--porcelain', '--', '.'], {
    cwd: site,
    encoding: 'utf8',
  });
  if (dirty.trim()) {
    console.error('The site has uncommitted changes. Commit or stash them, or pass --allow-dirty.');
    process.exit(1);
  }
}

const report = await applyUpgrade({
  root,
  site,
  base: lock.commit,
  target: target.commit,
  siteOwned: readSiteOwned(root, target.commit),
  exclude: lock.exclude || [],
});

const migrations = await runMigrations({
  root,
  site,
  target: target.commit,
  fromVersion: lock.version || readVersion(root, lock.commit),
  toVersion: version,
});

writeLock(site, { ...lock, repository, version, ref: target.ref, commit: target.commit });

let text = formatReport(report, {
  from: lock.ref || lock.commit.slice(0, 7),
  to: `${target.ref} (${target.commit.slice(0, 7)})`,
});
for (const migration of migrations) {
  text += `\n\nMigration ${migration.version}: ${migration.description}`;
  text += migration.changed.length
    ? `\n${migration.changed.map((path) => `- ${path}`).join('\n')}`
    : '\n- nothing to change';
}
console.log(text);
if (values.report) writeFileSync(values.report, `${text}\n`);
const packageChanged = [...report.updated, ...report.merged].includes('package.json');
if (packageChanged) console.log('\npackage.json changed: reinstall to refresh the lockfile.');
output('conflicts', String(report.conflicts.length));
process.exit(report.conflicts.length > 0 ? 3 : 0);
