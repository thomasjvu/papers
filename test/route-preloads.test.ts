import assert from 'node:assert/strict';

import { planHomepagePreloads, planRoutePreloads } from '../scripts/lib/routePreloads.mjs';

const docsCollection = {
  id: 'docs',
  routePrefix: '/docs',
  artifactNamespace: 'docs',
  variants: {
    versionConfig: {
      enabled: true,
      current: '2.0',
      versions: ['2.0', '1.0'],
      labels: {},
    },
    i18nConfig: {
      enabled: true,
      defaultLocale: 'en',
      locales: ['en', 'fr'],
      labels: {},
    },
  },
};

const alternateCollection = {
  id: 'reference',
  routePrefix: '/reference',
  artifactNamespace: 'reference',
  variants: {
    versionConfig: { enabled: false, current: '1.0', versions: ['1.0'], labels: {} },
    i18nConfig: { enabled: false, defaultLocale: 'en', locales: ['en'], labels: {} },
  },
};

const builtAssets = [
  'index-shell.js',
  'DocsPage-a1b2c3.js',
  'OpenApiPage-d4e5f6.js',
  'esm-heavy-optional.js',
  'MermaidDiagram-optional.js',
];

const deepDocsRoute = {
  routePath: '/docs/2.0/fr/guides/hello & "world"',
  canonicalPath: '/docs/2.0/fr/guides/hello & "world"',
};

export const routePreloadTests = [
  {
    name: 'homepage preload prioritizes a local hero artwork without trusting remote URLs',
    run: () => {
      assert.equal(
        planHomepagePreloads({ artwork: { src: '/images/hero.svg' } }),
        '<link rel="preload" as="image" fetchpriority="high" href="/images/hero.svg" />'
      );
      assert.equal(planHomepagePreloads({ artwork: { src: 'https://example.com/hero.svg' } }), '');
      assert.equal(planHomepagePreloads({ artwork: { src: '/images/hero.svg?x=1' } }), '');
    },
  },
  {
    name: 'route preload planner handles document, OpenAPI, and non-document routes',
    run: () => {
      const deepDocsPreloads = planRoutePreloads({
        routeEntry: deepDocsRoute,
        collections: [docsCollection, alternateCollection],
        assetFiles: builtAssets,
      });

      assert.match(deepDocsPreloads, /rel="modulepreload"/);
      assert.match(deepDocsPreloads, /href="\/assets\/DocsPage-a1b2c3\.js"/);
      assert.match(
        deepDocsPreloads,
        /rel="preload" as="fetch" crossorigin href="\/docs-content\/2\.0\/fr\/guides\/hello%20%26%20%22world%22\.json"/
      );
      assert.doesNotMatch(deepDocsPreloads, /OpenApiPage|esm-|Mermaid|https?:\/\//);

      const alternatePreloads = planRoutePreloads({
        routeEntry: {
          routePath: '/reference/getting-started/intro',
          canonicalPath: '/reference/getting-started/intro',
        },
        collections: [docsCollection, alternateCollection],
        assetFiles: builtAssets,
      });

      assert.match(alternatePreloads, /href="\/assets\/DocsPage-a1b2c3\.js"/);
      assert.match(alternatePreloads, /href="\/reference-content\/getting-started\/intro\.json"/);

      const openApiPreloads = planRoutePreloads({
        routeEntry: {
          routePath: '/docs/api-reference/openapi/operations/users/get-user',
          canonicalPath: '/docs/api-reference/openapi/operations/users/get-user',
          kind: 'openapi-operation',
        },
        collections: [docsCollection, alternateCollection],
        assetFiles: builtAssets,
      });

      assert.equal(
        openApiPreloads,
        '<link rel="modulepreload" crossorigin href="/assets/OpenApiPage-d4e5f6.js" />'
      );
      assert.doesNotMatch(openApiPreloads, /DocsPage|esm-|Mermaid|https?:\/\//);

      const openApiOverviewWithoutKind = planRoutePreloads({
        routeEntry: {
          routePath: '/docs/api-reference/openapi',
          canonicalPath: '/docs/api-reference/openapi',
        },
        collections: [docsCollection, alternateCollection],
        assetFiles: builtAssets,
      });

      assert.equal(
        openApiOverviewWithoutKind,
        '<link rel="modulepreload" crossorigin href="/assets/OpenApiPage-d4e5f6.js" />'
      );
      assert.doesNotMatch(
        openApiOverviewWithoutKind,
        /DocsPage|docs-content|esm-|Mermaid|https?:\/\//
      );

      for (const routeEntry of [
        { routePath: '/', canonicalPath: '/' },
        { routePath: '/404.html', canonicalPath: '/404.html' },
        { routePath: '/llms', canonicalPath: '/docs/llms' },
        { routePath: '/skill', canonicalPath: '/docs/skill' },
        { routePath: '/docs/llms', canonicalPath: '/docs/llms' },
        { routePath: '/docs/skill', canonicalPath: '/docs/skill' },
      ]) {
        assert.equal(
          planRoutePreloads({
            routeEntry,
            collections: [docsCollection, alternateCollection],
            assetFiles: builtAssets,
          }),
          '',
          `expected no route-specific preload for ${routeEntry.routePath}`
        );
      }

      assert.throws(
        () =>
          planRoutePreloads({
            routeEntry: deepDocsRoute,
            collections: [docsCollection],
            assetFiles: builtAssets.filter((asset) => !asset.startsWith('DocsPage-')),
          }),
        /expected exactly one built assets\/DocsPage-\*\.js file, found 0/
      );
      assert.throws(
        () =>
          planRoutePreloads({
            routeEntry: deepDocsRoute,
            collections: [docsCollection],
            assetFiles: [...builtAssets, 'DocsPage-another.js'],
          }),
        /expected exactly one built assets\/DocsPage-\*\.js file, found 2/
      );
    },
  },
];
