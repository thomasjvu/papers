import assert from 'node:assert/strict';

import {
  createLastUpdatedManifest,
  gitLastCommitDate,
  normalizeLastUpdated,
} from '../scripts/lib/lastUpdated.mjs';
import { DEFAULT_OG_IMAGE_PATH, socialImagePathForRoute } from '../shared/seo.js';

import {
  buildSearchFilters,
  parseSearchScope,
  rankSearchResults,
  titleBoost,
} from '../src/lib/searchRanking.ts';
import { createPagefindRecords } from '../scripts/lib/pagefindArtifacts.mjs';

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
  {
    name: 'parseSearchScope reads docs: and api: prefixes',
    run: () => {
      assert.deepEqual(parseSearchScope('  api: users '), { query: 'users', section: 'api' });
      assert.deepEqual(parseSearchScope('DOCS:tabs'), { query: 'tabs', section: 'docs' });
      assert.deepEqual(parseSearchScope('tabs api:'), { query: 'tabs api:', section: null });
    },
  },
  {
    name: 'buildSearchFilters keeps API results unless scoped, and pins docs to the variant',
    run: () => {
      assert.deepEqual(buildSearchFilters({ section: null }), {});
      assert.deepEqual(buildSearchFilters({ section: 'api', version: 'v2' }), { section: 'api' });
      assert.deepEqual(buildSearchFilters({ section: 'docs', locale: 'fr' }), {
        section: 'docs',
        locale: 'fr',
      });
      assert.deepEqual(buildSearchFilters({ section: null, version: 'v2', locale: 'fr' }), {
        any: [{ section: 'docs', version: 'v2', locale: 'fr' }, { section: 'api' }],
      });
    },
  },
  {
    name: 'rankSearchResults boosts title matches and keeps ties stable',
    run: () => {
      assert.equal(titleBoost('Content Tabs', 'content tabs'), 3);
      assert.equal(titleBoost('Content Tabs Guide', 'content tabs'), 2.5);
      assert.equal(titleBoost('Guide to tabs and content', 'content tabs'), 2);
      assert.equal(titleBoost('Tabs', 'content tabs'), 1.25);
      assert.equal(titleBoost('Other', 'content tabs'), 1);
      const ranked = rankSearchResults(
        [
          { score: 1, meta: { title: 'Install' } },
          { score: 0.6, meta: { title: 'Content tabs' } },
          { score: 1, meta: { title: 'Deploy' } },
        ],
        'content tabs'
      );
      assert.deepEqual(
        ranked.map((result) => result.meta.title),
        ['Content tabs', 'Install', 'Deploy']
      );
    },
  },
  {
    name: 'Pagefind records carry section, collection, version, and locale filters',
    run: () => {
      const records = createPagefindRecords({
        collections: [{ id: 'docs', label: 'Docs', routePrefix: 'docs' }],
        artifactsByCollectionId: {
          docs: {
            index: { paths: ['a'], titles: { a: 'A' } },
            documents: { a: { title: 'A', content: '# A\n\nBody' } },
          },
        },
        openapiArtifacts: {
          specs: [
            {
              operations: [{ method: 'GET', path: '/x', summary: 'X', routePath: '/docs/x' }],
              schemas: [],
            },
          ],
        },
      });
      const doc = records.find((record) => record.meta.kind === 'documentation');
      const api = records.find((record) => record.meta.kind === 'openapi-operation');
      assert.deepEqual(doc?.filters, { section: ['docs'], collection: ['docs'] });
      assert.deepEqual(api?.filters, { section: ['api'] });
    },
  },
];
