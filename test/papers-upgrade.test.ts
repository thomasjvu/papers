import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createPathFilter,
  latestSemverTag,
  resolveUpstreamCommit,
} from '../scripts/lib/papersUpgrade.mjs';
import { assertNoArchiveLinks } from '../packages/create-papers/index.mjs';

const cli = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'papers-upgrade.mjs');

function git(cwd: string, ...args: string[]) {
  return execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    cwd,
    encoding: 'utf8',
  }).trim();
}

async function writeFiles(root: string, files: Record<string, string | null>) {
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path);
    if (content === null) {
      await rm(target, { force: true });
    } else {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content);
    }
  }
}

export const papersUpgradeTests = [
  {
    name: 'papers upgrade picks the newest semver release tag',
    run: async () => {
      assert.equal(latestSemverTag(['v0.9.0', 'v0.10.0', 'v0.2.1', 'nightly']), 'v0.10.0');
      assert.equal(latestSemverTag(['nightly']), null);
      const owned = createPathFilter(['src/docs/content/**', 'README.md']);
      assert.equal(owned('src/docs/content/a/b.md'), true);
      assert.equal(owned('README.md'), true);
      assert.equal(owned('src/README.md'), false);
    },
  },
  {
    name: 'papers upgrade merges upstream changes and keeps site edits and content',
    run: async () => {
      const temp = await mkdtemp(join(tmpdir(), 'papers-upgrade-'));
      try {
        const upstream = join(temp, 'upstream');
        await mkdir(upstream);
        git(upstream, 'init', '-q', '-b', 'main');
        const baseFiles = {
          'package.json': '{ "name": "papers", "version": "0.1.0" }\n',
          'scripts/shared.mjs': 'one\ntwo\nthree\nfour\nfive\n',
          'scripts/clash.mjs': 'value = 1\n',
          'scripts/gone.mjs': 'old\n',
          'scripts/site-removed.mjs': 'x\n',
          'src/docs/content/intro.md': '# Sample\n',
        };
        await writeFiles(upstream, baseFiles);
        git(upstream, 'add', '-A');
        git(upstream, 'commit', '-q', '-m', 'base');
        git(upstream, 'tag', 'v0.1.0');
        const base = git(upstream, 'rev-parse', 'HEAD');
        await writeFiles(upstream, {
          'package.json': '{ "name": "@thomasjvu/papers", "version": "0.2.0", "bin": "x.mjs" }\n',
          'scripts/shared.mjs': 'ONE\ntwo\nthree\nfour\nfive\n',
          'scripts/clash.mjs': 'value = 2\n',
          'scripts/gone.mjs': null,
          'scripts/site-removed.mjs': 'y\n',
          'scripts/new.mjs': 'new\n',
          'src/docs/content/intro.md': '# Sample v2\n',
        });
        git(upstream, 'add', '-A');
        git(upstream, 'commit', '-q', '-m', 'target');
        git(upstream, 'tag', 'v0.2.0');
        const target = git(upstream, 'rev-parse', 'HEAD');

        const repo = join(temp, 'site-repo');
        const site = join(repo, 'apps', 'docs');
        await mkdir(site, { recursive: true });
        git(repo, 'init', '-q', '-b', 'main');
        await writeFiles(site, {
          ...baseFiles,
          'scripts/shared.mjs': 'one\ntwo\nthree\nfour\nFIVE (site)\n',
          'scripts/clash.mjs': 'value = 99\n',
          'scripts/site-removed.mjs': null,
          'src/docs/content/intro.md': '# Our product\n',
          'papers.lock.json': JSON.stringify({ repository: upstream, ref: 'v0.1.0', commit: base }),
        });
        git(repo, 'add', '-A');
        git(repo, 'commit', '-q', '-m', 'site');

        const result = spawnSync(process.execPath, [cli, '--site', site], { encoding: 'utf8' });
        assert.equal(result.status, 3, result.stderr + result.stdout);

        const read = (path: string) => readFile(join(site, path), 'utf8');
        assert.equal(await read('scripts/shared.mjs'), 'ONE\ntwo\nthree\nfour\nFIVE (site)\n');
        assert.match(
          await read('scripts/clash.mjs'),
          /<<<<<<< site[\s\S]*value = 99[\s\S]*value = 2/
        );
        assert.equal(await read('scripts/new.mjs'), 'new\n');
        assert.equal(existsSync(join(site, 'scripts/gone.mjs')), false);
        assert.equal(existsSync(join(site, 'scripts/site-removed.mjs')), false);
        assert.equal(await read('src/docs/content/intro.md'), '# Our product\n');
        // An unedited site package.json still keeps its own identity.
        assert.deepEqual(JSON.parse(await read('package.json')), {
          name: 'papers',
          version: '0.1.0',
        });
        const lock = JSON.parse(await read('papers.lock.json'));
        assert.equal(lock.commit, target);
        assert.equal(lock.ref, 'v0.2.0');
        assert.equal(lock.version, '0.2.0');
        assert.match(result.stdout, /Conflicts to resolve \(1\)/);
        assert.match(result.stdout, /Kept removed by the site \(1\)/);

        // A site already past a release is never taken back to it.
        const back = spawnSync(
          process.execPath,
          [cli, '--site', site, '--check', '--to', 'v0.1.0'],
          {
            encoding: 'utf8',
          }
        );
        assert.equal(back.status, 0, back.stderr + back.stdout);
        assert.match(back.stdout, /already past Papers v0\.1\.0/);
      } finally {
        await rm(temp, { recursive: true, force: true });
      }
    },
  },
];

papersUpgradeTests.push({
  name: 'papers 0.2.0 migration renames Tailwind-clashing theme tokens once',
  run: async () => {
    const { renameTokens } = await import('../scripts/migrations/0.2.0.mjs');
    const css =
      ':root { --text-color: red; --radius-md: 4px; --text-custom: 1px; }\na { color: var(--text-color); }';
    const once = renameTokens(css);
    assert.equal(
      once,
      ':root { --papers-text-color: red; --papers-radius-md: 4px; --text-custom: 1px; }\na { color: var(--papers-text-color); }'
    );
    assert.equal(renameTokens(once), once);
  },
});

papersUpgradeTests.push({
  name: 'papers upgrade merges package.json by key and keeps site identity',
  run: async () => {
    const { mergePackageJson } = await import('../scripts/lib/papersUpgrade.mjs');
    const base = {
      name: 'papers',
      version: '0.1.0',
      scripts: { build: 'b1', test: 't1' },
      devDependencies: { vite: '^5' },
    };
    const ours = {
      name: '@site/docs',
      version: '3.0.0',
      scripts: { build: 'b1', test: 't-site', deploy: 'd' },
      devDependencies: { vite: '^5' },
    };
    const theirs = {
      name: 'papers',
      version: '0.2.0',
      scripts: { build: 'b2', test: 't2', 'package:check': 'p' },
      devDependencies: { vite: '^6', jscpd: '^4' },
    };
    const { text, conflicts } = mergePackageJson(
      JSON.stringify(base),
      JSON.stringify(ours),
      JSON.stringify(theirs),
      {
        skipFields: ['name', 'version'],
        skipScripts: ['package:check'],
        skipDependencies: ['jscpd'],
      }
    );
    assert.deepEqual(JSON.parse(text), {
      name: '@site/docs',
      version: '3.0.0',
      scripts: { build: 'b2', test: 't-site', deploy: 'd' },
      devDependencies: { vite: '^6' },
    });
    assert.deepEqual(conflicts, ['scripts.test']);
  },
});

papersUpgradeTests.push({
  name: 'papers upgrade rejects refs that git would read as options',
  run: () => {
    assert.throws(
      () =>
        resolveUpstreamCommit(
          process.cwd(),
          'https://example.invalid/papers.git',
          '--upload-pack=touch /tmp/x'
        ),
      /must not start with "-"/
    );
  },
});

papersUpgradeTests.push({
  name: 'create-papers rejects template archives that contain links',
  run: async () => {
    const temp = await mkdtemp(join(tmpdir(), 'papers-archive-'));
    try {
      const root = join(temp, 'papers-abc');
      await mkdir(root);
      await writeFile(join(root, 'README.md'), 'hi');
      const clean = join(temp, 'clean.tgz');
      execFileSync('tar', ['-czf', clean, '-C', temp, 'papers-abc']);
      assertNoArchiveLinks(execFileSync('tar', ['-tvzf', clean], { encoding: 'utf8' }));

      execFileSync('ln', ['-s', '/etc/passwd', join(root, 'escape')]);
      const linked = join(temp, 'linked.tgz');
      execFileSync('tar', ['-czf', linked, '-C', temp, 'papers-abc']);
      assert.throws(
        () => assertNoArchiveLinks(execFileSync('tar', ['-tvzf', linked], { encoding: 'utf8' })),
        /symbolic or hard link/
      );
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  },
});

// Security regression (audit F-1). A fetch-only look at another repository
// (`--check --repository <fork>`) must not make that repository's tags or
// commits eligible for a later upgrade from the locked repository.
// Ways this could fail, written before the fix:
// - stale fork tags stay in refs/papers-upstream/tags and win "latest";
// - a stale fork commit is accepted for an explicit --to <sha>;
// - the fork's migration runs with the operator's privileges;
// - the lock records the trusted URL next to a fork commit;
// - a repository whose fetch fails leaves the previous repository's refs usable.
papersUpgradeTests.push({
  name: 'papers upgrade ignores refs left behind by a different repository',
  run: async () => {
    const temp = await mkdtemp(join(tmpdir(), 'papers-upgrade-refs-'));
    try {
      const good = join(temp, 'good');
      await mkdir(good);
      git(good, 'init', '-q', '-b', 'main');
      await writeFiles(good, {
        'package.json': '{ "name": "papers", "version": "1.0.0" }\n',
        'scripts/framework.mjs': 'export const source = "good 1.0.0";\n',
      });
      git(good, 'add', '-A');
      git(good, 'commit', '-q', '-m', 'v1.0.0');
      git(good, 'tag', 'v1.0.0');
      const goodBase = git(good, 'rev-parse', 'HEAD');

      const evil = join(temp, 'evil');
      git(temp, 'clone', '-q', good, evil);
      await writeFiles(evil, {
        'package.json': '{ "name": "papers", "version": "9.0.0" }\n',
        'scripts/framework.mjs': 'export const source = "evil 9.0.0";\n',
        'scripts/migrations/9.0.0-marker.mjs':
          "import { writeFileSync } from 'node:fs';\n" +
          "import { join } from 'node:path';\n" +
          "export const description = 'dummy marker';\n" +
          "export function run({ site }) { writeFileSync(join(site, 'MIGRATION_MARKER'), 'x'); return []; }\n",
      });
      git(evil, 'add', '-A');
      git(evil, 'commit', '-q', '-m', 'v9.0.0');
      git(evil, 'tag', 'v9.0.0');
      const evilCommit = git(evil, 'rev-parse', 'HEAD');

      await writeFiles(good, {
        'package.json': '{ "name": "papers", "version": "1.1.0" }\n',
        'scripts/framework.mjs': 'export const source = "good 1.1.0";\n',
      });
      git(good, 'add', '-A');
      git(good, 'commit', '-q', '-m', 'v1.1.0');
      git(good, 'tag', 'v1.1.0');
      const goodTarget = git(good, 'rev-parse', 'HEAD');

      const site = join(temp, 'site');
      await mkdir(site);
      git(site, 'init', '-q', '-b', 'main');
      await writeFiles(site, {
        'package.json': '{ "name": "site", "version": "1.0.0" }\n',
        'scripts/framework.mjs': 'export const source = "good 1.0.0";\n',
        'papers.lock.json': JSON.stringify({
          repository: good,
          version: '1.0.0',
          ref: 'v1.0.0',
          commit: goodBase,
        }),
      });
      git(site, 'add', '-A');
      git(site, 'commit', '-q', '-m', 'site');

      const run = (...args: string[]) =>
        spawnSync(process.execPath, [cli, '--site', site, ...args], { encoding: 'utf8' });

      // 1. Fetch-only inspection of the fork.
      const peek = run('--check', '--repository', evil);
      assert.equal(peek.status, 10, peek.stderr + peek.stdout);
      assert.match(peek.stdout, /v9\.0\.0 is available/);

      // 2. A later check against the locked repository sees only its releases.
      const check = run('--check');
      assert.equal(check.status, 10, check.stderr + check.stdout);
      assert.match(check.stdout, /Papers v1\.1\.0 is available/);

      // 3. An explicit fork commit is not resolvable from the locked repository.
      const pinned = run('--check', '--to', evilCommit);
      assert.notEqual(pinned.status, 10, pinned.stderr + pinned.stdout);
      assert.doesNotMatch(pinned.stdout, /is available/);

      // 4. A failed fetch must not leave the fork's refs usable.
      const missing = run('--check', '--repository', join(temp, 'does-not-exist'));
      assert.notEqual(missing.status, 0);
      assert.notEqual(missing.status, 10);
      const leftover = git(site, 'for-each-ref', '--format=%(refname)', 'refs/papers-upstream/');
      assert.doesNotMatch(leftover, /v9\.0\.0/);

      // 5. The real upgrade installs the trusted release and runs no fork code.
      run('--check', '--repository', evil);
      const upgrade = run();
      assert.equal(upgrade.status, 0, upgrade.stderr + upgrade.stdout);
      assert.equal(existsSync(join(site, 'MIGRATION_MARKER')), false);
      assert.equal(
        await readFile(join(site, 'scripts/framework.mjs'), 'utf8'),
        'export const source = "good 1.1.0";\n'
      );
      const lock = JSON.parse(await readFile(join(site, 'papers.lock.json'), 'utf8'));
      assert.equal(lock.repository, good);
      assert.equal(lock.ref, 'v1.1.0');
      assert.equal(lock.commit, goodTarget);
      assert.notEqual(lock.commit, evilCommit);
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  },
});
