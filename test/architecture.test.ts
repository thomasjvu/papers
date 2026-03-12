import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createDocsArtifacts,
  serializeArtifactJson,
  stabilizeIndexGeneration,
} from '../scripts/lib/docsArtifacts.mjs';
import { loadViteEnv } from '../scripts/lib/loadViteEnv.mjs';
import { resolveDocFileInfo } from '../scripts/lib/docsVariants.mjs';
import {
  createRobotsTxt,
  createSeoRouteEntries,
  createSitemapXml,
} from '../scripts/lib/seoArtifacts.mjs';
import { combineSearchResults } from '../src/components/CommandPalette/searchUtils.ts';
import {
  buildCanonicalDocsPath,
  buildDocsContentPath,
  buildDocsRouteVariants,
  getDocsVariantContexts,
  getDocumentationFeatureValidationIssues,
  parseDocsRoutePath,
} from '../shared/docsRouting.js';
import { findPathToFile, mergeExpandedPaths } from '../src/components/FileTree/treeState.ts';
import { findDirectoryDefaultPath, findFirstDocumentPath } from '../src/lib/navigation.ts';
import { buildMarkdownRenderState } from '../src/utils/markdownCore.ts';

export interface ArchitectureTestCase {
  name: string;
  run: () => void | Promise<void>;
}

function createDeterministicIdGenerator() {
  let counter = 0;
  return (prefix: string) => {
    counter += 1;
    return `${prefix}-${counter}`;
  };
}

export const architectureTests: ArchitectureTestCase[] = [
  {
    name: 'createDocsArtifacts builds a manifest and per-page records',
    run: () => {
      const { index, documents } = createDocsArtifacts(
        {
          'getting-started/introduction':
            '\uFEFF---\ntitle: Custom Intro\ndescription: Setup page\n---\n\nHello world',
          'user-guide/no-title': 'Body only',
        },
        '2026-03-11T00:00:00.000Z',
        {
          'getting-started/introduction': 'src/docs/content/getting-started/introduction.mdx',
        }
      );

      assert.deepEqual(index, {
        generated: '2026-03-11T00:00:00.000Z',
        paths: ['getting-started/introduction', 'user-guide/no-title'],
        count: 2,
        titles: {
          'getting-started/introduction': 'Custom Intro',
          'user-guide/no-title': 'no-title',
        },
      });

      assert.deepEqual(documents['getting-started/introduction'], {
        path: 'getting-started/introduction',
        title: 'Custom Intro',
        description: 'Setup page',
        frontmatter: {
          title: 'Custom Intro',
          description: 'Setup page',
        },
        content: 'Hello world',
        sourcePath: 'src/docs/content/getting-started/introduction.mdx',
      });
      assert.deepEqual(documents['user-guide/no-title'], {
        path: 'user-guide/no-title',
        title: 'no-title',
        description: 'Body only',
        frontmatter: {},
        content: 'Body only',
      });
    },
  },
  {
    name: 'docs artifact helpers keep stable manifest metadata and trailing newlines',
    run: () => {
      const previousIndex = {
        generated: '2026-03-11T00:00:00.000Z',
        paths: ['getting-started/introduction'],
        count: 1,
        titles: {
          'getting-started/introduction': 'Introduction',
        },
      };
      const unchangedIndex = {
        generated: '2026-03-12T00:00:00.000Z',
        paths: ['getting-started/introduction'],
        count: 1,
        titles: {
          'getting-started/introduction': 'Introduction',
        },
      };
      const changedIndex = {
        generated: '2026-03-12T00:00:00.000Z',
        paths: ['guides/intro', 'guides/advanced'],
        count: 2,
        titles: {
          'getting-started/introduction': 'Introduction',
          'guides/advanced': 'Advanced',
        },
      };

      assert.deepEqual(
        stabilizeIndexGeneration(previousIndex, unchangedIndex, '2026-03-12T00:00:00.000Z'),
        {
          generated: '2026-03-11T00:00:00.000Z',
          paths: ['getting-started/introduction'],
          count: 1,
          titles: {
            'getting-started/introduction': 'Introduction',
          },
        }
      );

      assert.deepEqual(
        stabilizeIndexGeneration(previousIndex, changedIndex, '2026-03-12T00:00:00.000Z'),
        changedIndex
      );

      assert.equal(
        serializeArtifactJson({
          hello: 'world',
        }),
        '{\n  "hello": "world"\n}\n'
      );
    },
  },
  {
    name: 'navigation helpers derive default pages from the docs tree structure',
    run: () => {
      const items = [
        {
          type: 'directory' as const,
          name: 'Guides',
          path: 'guides',
          children: [
            {
              type: 'file' as const,
              name: 'Intro.mdx',
              path: 'guides/intro',
            },
            {
              type: 'directory' as const,
              name: 'Advanced',
              path: 'guides/advanced',
              children: [
                {
                  type: 'file' as const,
                  name: 'Caching.md',
                  path: 'guides/advanced/caching',
                },
              ],
            },
          ],
        },
      ];

      assert.equal(findFirstDocumentPath(items), 'guides/intro');
      assert.equal(findDirectoryDefaultPath('guides', items), 'guides/intro');
      assert.equal(findDirectoryDefaultPath('guides/advanced', items), 'guides/advanced/caching');
      assert.equal(findDirectoryDefaultPath('missing', items), null);
    },
  },
  {
    name: 'buildMarkdownRenderState keeps custom markdown blocks structurally intact',
    run: async () => {
      const markdown = [
        '# Demo',
        '',
        '```ts:TypeScript|js:JavaScript',
        'const value = 1;',
        '---',
        'const value = 1;',
        '```',
        '',
        '```html',
        '<button class="button-primary" type="button">Try me</button>',
        '```',
      ].join('\n');

      const result = await buildMarkdownRenderState(markdown, {
        createId: createDeterministicIdGenerator(),
      });

      assert.match(result.html, /data-codeblock-id="codeblock-1"/);
      assert.match(result.html, /data-liveexample-id="liveexample-2"/);
      assert.match(result.html, /data-language="html"/);
      assert.deepEqual(result.codeBlocks.get('codeblock-1'), [
        { language: 'ts', code: 'const value = 1;', label: 'TypeScript' },
        { language: 'js', code: 'const value = 1;', label: 'JavaScript' },
      ]);
    },
  },
  {
    name: 'file tree helpers expand only the directories needed for the active file',
    run: () => {
      const items = [
        {
          type: 'directory' as const,
          name: 'Guides',
          path: 'guides',
          children: [
            {
              type: 'directory' as const,
              name: 'Advanced',
              path: 'guides/advanced',
              children: [
                {
                  type: 'file' as const,
                  name: 'Caching.md',
                  path: 'guides/advanced/caching',
                },
              ],
            },
          ],
        },
      ];

      const pathsToExpand = findPathToFile(items, 'guides/advanced/caching');
      assert.deepEqual(pathsToExpand, ['guides', 'guides/advanced']);

      const merged = mergeExpandedPaths({ guides: true, other: true }, pathsToExpand ?? []);
      assert.deepEqual(merged, {
        guides: true,
        'guides/advanced': true,
        other: true,
      });
    },
  },
  {
    name: 'combineSearchResults deduplicates overlapping results and caps the merged list',
    run: () => {
      const filteredResults = [
        { path: '/docs/getting-started', title: 'Getting Started' },
        { path: '/docs/advanced-features', title: 'Advanced Features' },
      ];
      const pagefindResults = [
        { path: '/docs/advanced-features', title: 'Advanced Features (full text)' },
        { path: '/docs/pagefind', title: 'Pagefind' },
        { path: '/docs/content-pipeline', title: 'Content Pipeline' },
      ];

      const combined = combineSearchResults(filteredResults, pagefindResults, {
        query: 'page',
        pagefindAvailable: true,
        limit: 3,
      });

      assert.deepEqual(
        combined.map((result) => result.path),
        ['/docs/getting-started', '/docs/advanced-features', '/docs/pagefind']
      );
    },
  },
  {
    name: 'SEO helpers generate canonical routes, sitemap, and robots metadata',
    run: () => {
      const docsIndex = {
        generated: '2026-03-11T00:00:00.000Z',
        paths: ['getting-started/introduction', 'llms'],
        count: 2,
        titles: {
          'getting-started/introduction': 'Introduction',
          llms: 'LLMs.txt',
        },
      };
      const documents = {
        'getting-started/introduction': {
          path: 'getting-started/introduction',
          title: 'Introduction',
          description: 'Start here.',
          content: '# Introduction\n\nStart here.',
        },
        llms: {
          path: 'llms',
          title: 'LLMs.txt',
          description: 'AI exports.',
          content: '# LLMs.txt\n\nAI exports.',
        },
      };

      const routes = createSeoRouteEntries(docsIndex, documents, {
        siteName: 'papers',
        siteSubtitle: 'Static documentation template',
        siteDescription: 'Minimal docs starter.',
      });

      const canonicalDocRoute = routes.find((route) => route.routePath === '/docs/getting-started/introduction');
      const docsAliasRoute = routes.find((route) => route.routePath === '/docs');
      const llmsRoute = routes.find((route) => route.routePath === '/llms');

      assert.equal(canonicalDocRoute?.canonicalPath, '/docs/getting-started/introduction');
      assert.equal(docsAliasRoute?.canonicalPath, '/docs/getting-started/introduction');
      assert.equal(llmsRoute?.description, 'AI exports.');

      const sitemap = createSitemapXml(routes, 'https://docs.example.com', '2026-03-11T00:00:00.000Z');
      assert.match(sitemap, /<loc>https:\/\/docs\.example\.com\/<\/loc>/);
      assert.match(sitemap, /<loc>https:\/\/docs\.example\.com\/docs\/getting-started\/introduction<\/loc>/);
      assert.doesNotMatch(sitemap, /\/docs<\/loc>/);

      const robots = createRobotsTxt('https://docs.example.com');
      assert.match(robots, /Sitemap: https:\/\/docs\.example\.com\/sitemap\.xml/);
    },
  },
  {
    name: 'loadViteEnv follows Vite env precedence across mode files and process env',
    run: async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'papers-env-'));
      const previousValues = {
        VITE_SITE_NAME: process.env.VITE_SITE_NAME,
        VITE_SITE_URL: process.env.VITE_SITE_URL,
        VITE_GITHUB_BRANCH: process.env.VITE_GITHUB_BRANCH,
        VITE_GITHUB_URL: process.env.VITE_GITHUB_URL,
      };

      try {
        await writeFile(
          join(tempDir, '.env'),
          ['VITE_SITE_NAME=Base Name', 'VITE_SITE_URL=https://base.example.com'].join('\n')
        );
        await writeFile(
          join(tempDir, '.env.local'),
          ['VITE_GITHUB_BRANCH=local-branch', 'VITE_SITE_URL=https://local.example.com'].join(
            '\n'
          )
        );
        await writeFile(
          join(tempDir, '.env.production'),
          ['VITE_SITE_NAME=Production Name', 'VITE_SITE_URL=https://production.example.com'].join(
            '\n'
          )
        );
        await writeFile(
          join(tempDir, '.env.production.local'),
          'VITE_GITHUB_URL=https://github.com/example/papers'
        );

        process.env.VITE_SITE_URL = 'https://process.example.com';

        const env = loadViteEnv(tempDir, 'production');

        assert.deepEqual(env, {
          VITE_SITE_NAME: 'Production Name',
          VITE_SITE_URL: 'https://process.example.com',
          VITE_GITHUB_BRANCH: 'local-branch',
          VITE_GITHUB_URL: 'https://github.com/example/papers',
        });
      } finally {
        for (const [key, value] of Object.entries(previousValues)) {
          if (value === undefined) {
            delete process.env[key];
          } else {
            process.env[key] = value;
          }
        }

        await rm(tempDir, { recursive: true, force: true });
      }
    },
  },
  {
    name: 'docs routing helpers canonicalize versioned and localized aliases',
    run: () => {
      const versionConfig = {
        enabled: true,
        current: '2.0',
        versions: ['2.0', '1.0'],
        labels: {
          '2.0': 'Latest',
        },
      };
      const i18nConfig = {
        enabled: true,
        defaultLocale: 'en',
        locales: ['en', 'fr'],
      };

      assert.equal(
        buildCanonicalDocsPath('guides/intro', { versionConfig, i18nConfig }),
        '/docs/2.0/en/guides/intro'
      );
      assert.deepEqual(
        buildDocsRouteVariants('guides/intro', { versionConfig, i18nConfig }),
        [
          '/docs/guides/intro',
          '/docs/2.0/guides/intro',
          '/docs/1.0/guides/intro',
          '/docs/en/guides/intro',
          '/docs/fr/guides/intro',
          '/docs/2.0/en/guides/intro',
          '/docs/2.0/fr/guides/intro',
          '/docs/1.0/en/guides/intro',
          '/docs/1.0/fr/guides/intro',
        ]
      );
      assert.deepEqual(parseDocsRoutePath('2.0/fr/guides/intro', { versionConfig, i18nConfig }), {
        originalSlug: '2.0/fr/guides/intro',
        docPath: 'guides/intro',
        routeVersion: '2.0',
        routeLocale: 'fr',
        activeVersion: '2.0',
        activeLocale: 'fr',
        hasExplicitPrefix: true,
      });
    },
  },
  {
    name: 'docs routing validation flags ambiguous top-level prefixes',
    run: () => {
      const issues = getDocumentationFeatureValidationIssues({
        documentationTree: [
          {
            type: 'directory',
            name: 'English',
            path: 'en',
            children: [
              {
                type: 'file',
                name: 'Intro.md',
                path: 'en/intro',
              },
            ],
          },
        ],
        versionConfig: {
          enabled: false,
          current: '1.0',
          versions: ['1.0'],
          labels: {},
        },
        i18nConfig: {
          enabled: true,
          defaultLocale: 'en',
          locales: ['en'],
        },
      });

      assert.equal(issues.length, 1);
      assert.match(issues[0], /Top-level documentation paths conflict/);
    },
  },
  {
    name: 'docs routing helpers derive content keys and variant contexts',
    run: () => {
      const versionConfig = {
        enabled: true,
        current: '2.0',
        versions: ['2.0', '1.0'],
        labels: {},
      };
      const i18nConfig = {
        enabled: true,
        defaultLocale: 'en',
        locales: ['en', 'fr'],
      };

      assert.equal(
        buildDocsContentPath('guides/intro', { versionConfig, i18nConfig }),
        '2.0/en/guides/intro'
      );
      assert.deepEqual(getDocsVariantContexts({ versionConfig, i18nConfig }), [
        { version: '2.0', locale: 'en', key: '2.0/en', isDefault: true },
        { version: '2.0', locale: 'fr', key: '2.0/fr', isDefault: false },
        { version: '1.0', locale: 'en', key: '1.0/en', isDefault: false },
        { version: '1.0', locale: 'fr', key: '1.0/fr', isDefault: false },
      ]);
    },
  },
  {
    name: 'docs variant resolution falls back from overrides to base docs',
    run: async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'papers-doc-variants-'));

      try {
        await mkdir(join(tempDir, 'src', 'docs', 'content', 'guides'), { recursive: true });
        await mkdir(
          join(
            tempDir,
            'src',
            'docs',
            'content',
            'variants',
            'versions',
            '2.0',
            'locales',
            'fr',
            'guides'
          ),
          { recursive: true }
        );
        await mkdir(
          join(tempDir, 'src', 'docs', 'content', 'variants', 'versions', '2.0', 'guides'),
          { recursive: true }
        );
        await mkdir(
          join(tempDir, 'src', 'docs', 'content', 'variants', 'locales', 'fr', 'guides'),
          { recursive: true }
        );

        await writeFile(
          join(tempDir, 'src', 'docs', 'content', 'guides', 'full-precedence.md'),
          '# Base'
        );
        await writeFile(
          join(
            tempDir,
            'src',
            'docs',
            'content',
            'variants',
            'versions',
            '2.0',
            'locales',
            'fr',
            'guides',
            'full-precedence.md'
          ),
          '# Version Locale Override'
        );
        await writeFile(
          join(tempDir, 'src', 'docs', 'content', 'guides', 'version-fallback.md'),
          '# Base'
        );
        await writeFile(
          join(
            tempDir,
            'src',
            'docs',
            'content',
            'variants',
            'versions',
            '2.0',
            'guides',
            'version-fallback.mdx'
          ),
          '# Version Override'
        );
        await writeFile(
          join(tempDir, 'src', 'docs', 'content', 'guides', 'locale-fallback.md'),
          '# Base'
        );
        await writeFile(
          join(
            tempDir,
            'src',
            'docs',
            'content',
            'variants',
            'locales',
            'fr',
            'guides',
            'locale-fallback.md'
          ),
          '# Locale Override'
        );
        await writeFile(
          join(tempDir, 'src', 'docs', 'content', 'guides', 'base-fallback.md'),
          '# Base Only'
        );

        assert.equal(
          resolveDocFileInfo('guides/full-precedence', {
            rootDir: tempDir,
            version: '2.0',
            locale: 'fr',
          })?.sourcePath,
          'src/docs/content/variants/versions/2.0/locales/fr/guides/full-precedence.md'
        );
        assert.equal(
          resolveDocFileInfo('guides/version-fallback', {
            rootDir: tempDir,
            version: '2.0',
            locale: 'fr',
          })?.sourcePath,
          'src/docs/content/variants/versions/2.0/guides/version-fallback.mdx'
        );
        assert.equal(
          resolveDocFileInfo('guides/locale-fallback', {
            rootDir: tempDir,
            version: '2.0',
            locale: 'fr',
          })?.sourcePath,
          'src/docs/content/variants/locales/fr/guides/locale-fallback.md'
        );
        assert.equal(
          resolveDocFileInfo('guides/base-fallback', {
            rootDir: tempDir,
            version: '2.0',
            locale: 'fr',
          })?.sourcePath,
          'src/docs/content/guides/base-fallback.md'
        );
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    },
  },
  {
    name: 'SEO helpers emit canonical versioned docs routes alongside aliases',
    run: () => {
      const docsIndex = {
        generated: '2026-03-11T00:00:00.000Z',
        paths: ['getting-started/introduction'],
        count: 1,
        titles: {
          'getting-started/introduction': 'Introduction',
        },
      };
      const documents = {
        '2.0/en/getting-started/introduction': {
          path: 'getting-started/introduction',
          title: 'Introduction',
          description: 'English route aware docs.',
          content: '# Introduction\n\nEnglish route aware docs.',
        },
        '2.0/fr/getting-started/introduction': {
          path: 'getting-started/introduction',
          title: 'Introduction FR',
          description: 'Documentation route aware en francais.',
          content: '# Introduction FR\n\nDocumentation route aware en francais.',
        },
        '1.0/en/getting-started/introduction': {
          path: 'getting-started/introduction',
          title: 'Introduction 1.0',
          description: 'Legacy route aware docs.',
          content: '# Introduction 1.0\n\nLegacy route aware docs.',
        },
        '1.0/fr/getting-started/introduction': {
          path: 'getting-started/introduction',
          title: 'Introduction 1.0 FR',
          description: 'Legacy French route aware docs.',
          content: '# Introduction 1.0 FR\n\nLegacy French route aware docs.',
        },
      };
      const versionConfig = {
        enabled: true,
        current: '2.0',
        versions: ['2.0', '1.0'],
        labels: {},
      };
      const i18nConfig = {
        enabled: true,
        defaultLocale: 'en',
        locales: ['en', 'fr'],
      };

      const routes = createSeoRouteEntries(docsIndex, documents, {
        siteName: 'papers',
        siteSubtitle: 'Static documentation template',
        siteDescription: 'Minimal docs starter.',
        versionConfig,
        i18nConfig,
      });

      const canonicalRoute = routes.find(
        (route) => route.routePath === '/docs/2.0/en/getting-started/introduction'
      );
      const frenchRoute = routes.find(
        (route) => route.routePath === '/docs/2.0/fr/getting-started/introduction'
      );
      const aliasRoute = routes.find(
        (route) => route.routePath === '/docs/getting-started/introduction'
      );
      const docsRootAlias = routes.find((route) => route.routePath === '/docs');

      assert.equal(canonicalRoute?.canonicalPath, '/docs/2.0/en/getting-started/introduction');
      assert.equal(canonicalRoute?.includeInSitemap, true);
      assert.equal(aliasRoute?.canonicalPath, '/docs/2.0/en/getting-started/introduction');
      assert.equal(aliasRoute?.includeInSitemap, false);
      assert.equal(aliasRoute?.title, 'Introduction | papers');
      assert.equal(frenchRoute?.title, 'Introduction FR | papers');
      assert.equal(docsRootAlias?.canonicalPath, '/docs/2.0/en/getting-started/introduction');
      assert.equal(docsRootAlias?.title, 'Introduction | papers');
    },
  },
];
