import assert from 'node:assert/strict';

import {
  createLastUpdatedManifest,
  gitLastCommitDate,
  normalizeLastUpdated,
} from '../scripts/lib/lastUpdated.mjs';
import { DEFAULT_OG_IMAGE_PATH, socialImagePathForRoute } from '../shared/seo.js';

type TestCase = { name: string; run: () => void | Promise<void> };

export const docsParityTests: TestCase[] = [
  {
    name: 'normalizeLastUpdated accepts ISO dates and rejects junk',
    run: () => {
      assert.equal(normalizeLastUpdated('2026-01-02'), '2026-01-02T00:00:00.000Z');
      assert.equal(normalizeLastUpdated('not a date'), null);
      assert.equal(normalizeLastUpdated(''), null);
      assert.equal(normalizeLastUpdated(undefined), null);
    },
  },
  {
    name: 'createLastUpdatedManifest prefers frontmatter, falls back to git, and sorts keys',
    run: () => {
      const lookups: string[] = [];
      const manifest = createLastUpdatedManifest(
        [
          {
            sourcePath: 'b.md',
            metadata: { canonicalPath: '/docs/b' },
            frontmatter: {},
          },
          {
            sourcePath: 'a.md',
            metadata: { canonicalPath: '/docs/a' },
            frontmatter: { lastUpdated: '2025-05-05' },
          },
          { sourcePath: 'untracked.md', metadata: { canonicalPath: '/docs/c' } },
          { sourcePath: 'no-route.md', metadata: {} },
        ],
        (sourcePath: string) => {
          lookups.push(sourcePath);
          return sourcePath === 'b.md' ? '2026-03-04T05:06:07.000Z' : null;
        }
      );
      assert.deepEqual(manifest, {
        pages: {
          '/docs/a': '2025-05-05T00:00:00.000Z',
          '/docs/b': '2026-03-04T05:06:07.000Z',
        },
      });
      assert.deepEqual(lookups, ['b.md', 'untracked.md']);
    },
  },
  {
    name: 'gitLastCommitDate reads tracked files and returns null for unknown paths',
    run: () => {
      const tracked = gitLastCommitDate(process.cwd(), 'package.json');
      assert.ok(tracked && !Number.isNaN(Date.parse(tracked)), String(tracked));
      assert.equal(gitLastCommitDate(process.cwd(), 'does/not/exist.md'), null);
    },
  },
  {
    name: 'socialImagePathForRoute maps routes to per-page cards and rejects unsafe paths',
    run: () => {
      assert.equal(
        socialImagePathForRoute('/docs/getting-started/introduction'),
        '/images/og/docs/getting-started/introduction.svg'
      );
      assert.equal(socialImagePathForRoute('/docs/a/'), '/images/og/docs/a.svg');
      assert.equal(socialImagePathForRoute('/'), DEFAULT_OG_IMAGE_PATH);
      assert.equal(socialImagePathForRoute(''), DEFAULT_OG_IMAGE_PATH);
      assert.equal(socialImagePathForRoute(undefined), DEFAULT_OG_IMAGE_PATH);
      assert.equal(socialImagePathForRoute('/docs/../etc'), DEFAULT_OG_IMAGE_PATH);
      assert.equal(socialImagePathForRoute('/docs/a b'), DEFAULT_OG_IMAGE_PATH);
      assert.equal(socialImagePathForRoute('https://x.test/docs'), DEFAULT_OG_IMAGE_PATH);
    },
  },
];
