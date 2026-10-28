import assert from 'node:assert/strict';

import {
  BUILD_GENERATOR_VERSION,
  BUILD_MANIFEST_VERSION,
  validateBuildManifest,
} from '../scripts/lib/buildIdentity.mjs';

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
];
