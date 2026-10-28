import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  BUILD_GENERATOR_VERSION,
  BUILD_MANIFEST_VERSION,
  computeInputFingerprint,
  getBuildInputFiles,
  readBuildManifest,
  resolveSourceRevision,
  summarizeWorktreeState,
  validateBuildManifest,
} from '../scripts/lib/buildIdentity.mjs';

async function withTree(files: Record<string, string>, run: (rootDir: string) => void) {
  const rootDir = await mkdtemp(join(tmpdir(), 'papers-build-identity-'));
  try {
    for (const [path, content] of Object.entries(files)) {
      await mkdir(join(rootDir, path, '..'), { recursive: true });
      await writeFile(join(rootDir, path), content);
    }
    run(rootDir);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
}

const current = { sourceRevision: 'abc123', inputFingerprint: 'f00d' };
const manifest = {
  schemaVersion: BUILD_MANIFEST_VERSION,
  generatorVersion: BUILD_GENERATOR_VERSION,
  buildMode: 'production',
  sourceRevision: 'abc123',
  inputFingerprint: 'f00d',
  worktreeState: 'dirty',
};

function rejects(overrides: Record<string, unknown>, message: string, options = {}) {
  assert.throws(
    () =>
      validateBuildManifest({ ...manifest, ...overrides }, current, { isCi: false, ...options }),
    (error: Error) => error.message === message
  );
}

export const buildIdentityTests = [
  {
    name: 'validateBuildManifest accepts a manifest for the current checkout',
    run: () => {
      const ok = { ...manifest };
      assert.equal(validateBuildManifest(ok, current, { isCi: false }), ok);
      const clean = { ...ok, worktreeState: 'clean' };
      assert.equal(validateBuildManifest(clean, current, { isCi: true }), clean);
      assert.doesNotThrow(() =>
        validateBuildManifest({ ...ok, buildMode: 'development' }, current, {
          expectedBuildMode: 'development',
          isCi: false,
        })
      );
    },
  },
  {
    name: 'validateBuildManifest reports each mismatch with its exact message',
    run: () => {
      rejects(
        { schemaVersion: 99 },
        `Unsupported build manifest schema 99; expected ${BUILD_MANIFEST_VERSION}.`
      );
      rejects({ generatorVersion: 'other' }, 'Build manifest generator mismatch: other.');
      rejects({ generatorVersion: undefined }, 'Build manifest generator mismatch: missing.');
      rejects(
        { buildMode: 'development' },
        'Build mode mismatch: artifact is development, expected production.'
      );
      rejects(
        { buildMode: undefined },
        'Build mode mismatch: artifact is missing, expected production.'
      );
      rejects(
        { buildMode: 'production' },
        'Build mode mismatch: artifact is production, expected preview.',
        {
          expectedBuildMode: 'preview',
        }
      );
      rejects(
        { sourceRevision: 'zzz' },
        'Build revision mismatch: artifact is zzz, current checkout is abc123.'
      );
      rejects(
        { sourceRevision: '' },
        'Build revision mismatch: artifact is missing, current checkout is abc123.'
      );
      const fingerprint =
        'Build input fingerprint mismatch. Run npm run build to regenerate dist for the current checkout.';
      rejects({ inputFingerprint: 'beef' }, fingerprint);
      rejects({ inputFingerprint: '' }, fingerprint);
      rejects({}, 'CI release artifacts must be built from a clean working tree.', { isCi: true });
    },
  },
  {
    name: 'getBuildInputFiles lists root files and walks input directories sorted',
    run: () =>
      withTree(
        {
          'package.json': '{}',
          'README.md': 'r',
          'notes.txt': 'not an input',
          'src/b.ts': 'b',
          'src/a/z.ts': 'z',
          'src/node_modules/x.js': 'skip',
          'src/dist/y.js': 'skip',
          'src/.git/HEAD': 'skip',
          'scripts/s.mjs': 's',
          'other/o.ts': 'not an input',
        },
        (rootDir) => {
          assert.deepEqual(getBuildInputFiles(rootDir), [
            'README.md',
            'package.json',
            'scripts/s.mjs',
            'src/a/z.ts',
            'src/b.ts',
          ]);
        }
      ),
  },
  {
    name: 'getBuildInputFiles is empty for a tree without inputs',
    run: () =>
      withTree({ 'other/x.ts': 'x' }, (rootDir) => {
        assert.deepEqual(getBuildInputFiles(rootDir), []);
      }),
  },
  {
    name: 'computeInputFingerprint changes with content and paths but not unrelated files',
    run: async () => {
      const fingerprints: Record<string, string> = {};
      const trees: Record<string, Record<string, string>> = {
        base: { 'package.json': '{}', 'src/a.ts': 'one' },
        same: { 'package.json': '{}', 'src/a.ts': 'one', 'other/x.ts': 'ignored' },
        content: { 'package.json': '{}', 'src/a.ts': 'two' },
        renamed: { 'package.json': '{}', 'src/b.ts': 'one' },
        // Same bytes split differently across files must not collide.
        split: { 'package.json': '{}', 'src/a.ts': 'on', 'src/b.ts': 'e' },
      };
      for (const [name, files] of Object.entries(trees)) {
        await withTree(files, (rootDir) => {
          const result = computeInputFingerprint(rootDir);
          assert.match(result.inputFingerprint, /^[0-9a-f]{64}$/);
          assert.deepEqual(result.inputFiles, getBuildInputFiles(rootDir));
          fingerprints[name] = result.inputFingerprint;
        });
      }
      assert.equal(fingerprints.same, fingerprints.base);
      assert.notEqual(fingerprints.content, fingerprints.base);
      assert.notEqual(fingerprints.renamed, fingerprints.base);
      assert.notEqual(fingerprints.split, fingerprints.base);
    },
  },
  {
    name: 'readBuildManifest reads JSON and explains missing or broken manifests',
    run: () =>
      withTree(
        {
          'ok/build-manifest.json': '{"schemaVersion":1}',
          'bad/build-manifest.json': '{nope',
        },
        (rootDir) => {
          assert.deepEqual(readBuildManifest(join(rootDir, 'ok')), { schemaVersion: 1 });
          assert.throws(
            () => readBuildManifest(join(rootDir, 'none')),
            (error: Error) =>
              error.message ===
              `Missing ${join(rootDir, 'none', 'build-manifest.json')}. Run npm run build first.`
          );
          assert.throws(
            () => readBuildManifest(join(rootDir, 'bad')),
            (error: Error) =>
              error.message.startsWith(
                `Could not parse ${join(rootDir, 'bad', 'build-manifest.json')}: `
              ) && error.message.length > 40
          );
        }
      ),
  },
  {
    name: 'resolveSourceRevision prefers the environment, then git, then unknown',
    run: () => {
      assert.deepEqual(resolveSourceRevision('env1', 'git1'), {
        sourceRevision: 'env1',
        sourceRevisionSource: 'environment',
      });
      assert.deepEqual(resolveSourceRevision(undefined, 'git1'), {
        sourceRevision: 'git1',
        sourceRevisionSource: 'git',
      });
      assert.deepEqual(resolveSourceRevision('', ''), {
        sourceRevision: 'unknown',
        sourceRevisionSource: 'unknown',
      });
    },
  },
  {
    name: 'summarizeWorktreeState ignores plans/ and blank lines',
    run: () => {
      assert.equal(summarizeWorktreeState(''), 'clean');
      assert.equal(summarizeWorktreeState('\n\n'), 'clean');
      assert.equal(summarizeWorktreeState('?? plans/a.md\n M plans/b.md\n'), 'clean');
      assert.equal(summarizeWorktreeState('?? plans/a.md\n M src/a.ts\n'), 'dirty');
      assert.equal(summarizeWorktreeState(' M src/plans/a.ts'), 'dirty');
      assert.equal(summarizeWorktreeState('?? plansx.md'), 'dirty');
    },
  },
];
