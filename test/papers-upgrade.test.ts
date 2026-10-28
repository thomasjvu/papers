import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createPathFilter, latestSemverTag } from '../scripts/lib/papersUpgrade.mjs';

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
          'package.json': '{ "version": "0.1.0" }\n',
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
          'package.json': '{ "version": "0.2.0" }\n',
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
        assert.equal(await read('package.json'), '{ "version": "0.2.0" }\n');
        const lock = JSON.parse(await read('papers.lock.json'));
        assert.equal(lock.commit, target);
        assert.equal(lock.ref, 'v0.2.0');
        assert.equal(lock.version, '0.2.0');
        assert.match(result.stdout, /Conflicts to resolve \(1\)/);
        assert.match(result.stdout, /Kept removed by the site \(1\)/);
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
