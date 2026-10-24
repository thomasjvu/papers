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
} from '../src/lib/searchRanking.ts';

import {
  DEFAULT_UI_STRINGS,
  resolveUiStrings,
  validateUiStringsConfig,
} from '../shared/uiStrings.js';
import { uiStringsConfig, i18nConfig } from '../shared/documentation-config.js';

type TestCase = { name: string; run: () => void | Promise<void> };

export const docsParityTests: TestCase[] = [
  {
    name: 'parseSearchScope reads docs: and api: prefixes',
    run: () => {
      assert.deepEqual(parseSearchScope('  api: users '), { query: 'users', section: 'api' });
      assert.deepEqual(parseSearchScope('DOCS:tabs'), { query: 'tabs', section: 'docs' });
      assert.deepEqual(parseSearchScope('tabs api:'), { query: 'tabs api:', section: null });
    },
  },
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
    name: 'resolveUiStrings merges valid per-locale overrides over English defaults',
    run: () => {
      const config = {
        fr: { previous: 'Précédent', next: '', bogus: 'x' } as Record<string, string>,
      };
      const fr = resolveUiStrings('fr', config);
      assert.equal(fr.previous, 'Précédent');
      assert.equal(fr.next, DEFAULT_UI_STRINGS.next);
      assert.equal((fr as Record<string, string>).bogus, undefined);
      assert.deepEqual(resolveUiStrings('de', config), DEFAULT_UI_STRINGS);
      assert.deepEqual(resolveUiStrings(null, config), DEFAULT_UI_STRINGS);
    },
  },
  {
    name: 'validateUiStringsConfig reports unknown locales, keys, and empty values',
    run: () => {
      assert.deepEqual(
        validateUiStringsConfig({ fr: { previous: 'P', nope: 'x', next: ' ' }, de: {} }, [
          'en',
          'fr',
        ]),
        [
          'uiStringsConfig.fr.nope: unknown label',
          'uiStringsConfig.fr.next: must be a non-empty string',
          'uiStringsConfig.de: locale is not in i18nConfig.locales',
        ]
      );
      assert.deepEqual(validateUiStringsConfig(uiStringsConfig, i18nConfig.locales), []);
    },
  },
];
