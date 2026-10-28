import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

import { createRouteModel } from '../scripts/lib/contentValidation.mjs';
import {
  normalizeDocsBasePath,
  stripDocsBasePath,
  withDocsBasePath,
} from '../shared/docsBasePath.js';
import { buildCollectionRoutePath, getCollectionRouteSlug } from '../shared/docsRouting.js';

const updateGolden = process.env.UPDATE_ROUTE_MODEL_GOLDEN === '1';

const tree = [
  {
    type: 'directory',
    name: 'Guides',
    path: 'guides',
    children: [
      { type: 'file', name: 'intro.md', path: 'guides/intro' },
      { type: 'file', name: 'setup.md', path: 'guides/setup' },
    ],
  },
  { type: 'file', name: 'openapi.md', path: 'api-reference/openapi' },
];
const documentPaths = ['guides/intro', 'guides/setup', 'api-reference/openapi'];
const versionConfig = { enabled: true, current: '2.0', versions: ['2.0', '1.0'], labels: {} };
const i18nConfig = { enabled: true, defaultLocale: 'en', locales: ['en', 'fr'], labels: {} };
const openapiConfig = {
  enabled: true,
  pagePath: '/api-reference/openapi/',
  defaultSpecId: 'main',
  specs: [{ id: 'main' }, { id: 'billing' }],
};

function serialize(model: ReturnType<typeof createRouteModel>) {
  return {
    routes: [...model.routeMap.entries()].sort(([a], [b]) => a.localeCompare(b)),
    ambiguous: [...model.ambiguousRoutes].sort(),
  };
}

async function assertGolden(name: string, model: ReturnType<typeof createRouteModel>) {
  const url = new URL(`./fixtures/route-model/${name}.json`, import.meta.url);
  const actual = `${JSON.stringify(serialize(model), null, 2)}\n`;
  if (updateGolden) {
    await writeFile(url, actual);
  }
  assert.equal(actual, await readFile(url, 'utf8'), `${name} route model drifted`);
}

export const routeModelTests = [
  {
    name: 'createRouteModel pins docs routes with versions, locales, aliases and openapi',
    run: () =>
      assertGolden(
        'docs-variants',
        createRouteModel({
          documentationTree: tree,
          documentPaths,
          openapiConfig,
          versionConfig,
          i18nConfig,
        })
      ),
  },
  {
    name: 'createRouteModel pins multi-collection routes and skips docs-only routes elsewhere',
    run: async () => {
      const guides = { id: 'guides', routePrefix: '/guides/' };
      const docs = { id: 'docs', routePrefix: '/docs' };
      const routeCollections = [
        { collection: docs, documentationTree: tree, documentPaths },
        {
          collection: guides,
          documentationTree: [],
          documentPaths: ['start', 'guides/intro'],
        },
        { collection: { id: 'empty' }, documentationTree: [], documentPaths: [] },
      ];
      const model = createRouteModel({
        collection: guides,
        documentationTree: [],
        documentPaths: ['start'],
        openapiConfig: { ...openapiConfig, specs: undefined },
        routeCollections,
      });
      assert.equal(model.routeMap.has('/llms'), false);
      await assertGolden('multi-collection', model);

      const disabled = createRouteModel({
        collection: docs,
        documentationTree: [],
        documentPaths: [],
        openapiConfig: { ...openapiConfig, enabled: false },
      });
      assert.deepEqual(
        serialize(disabled).routes.map(([path]) => path),
        ['/', '/llms', '/skill']
      );

      const withDesignBook = createRouteModel({
        collection: docs,
        documentationTree: [],
        documentPaths: [],
        openapiConfig: { ...openapiConfig, enabled: false },
        designBookConfig: { enabled: true, route: '/design' },
      });
      assert.equal(withDesignBook.routeMap.has('/design'), true);
    },
  },
  {
    name: 'docs base path: /docs by default, root mode serves docs at /',
    run: () => {
      assert.equal(normalizeDocsBasePath(undefined), '/docs');
      assert.equal(normalizeDocsBasePath('/guide/'), '/guide');
      assert.equal(normalizeDocsBasePath(''), '');
      assert.equal(normalizeDocsBasePath('/'), '');
      assert.equal(withDocsBasePath('a/b'), '/docs/a/b');
      assert.equal(withDocsBasePath('a/b', ''), '/a/b');
      assert.equal(stripDocsBasePath('/docs/a', '/docs'), 'a');
      assert.equal(stripDocsBasePath('/design', '/docs'), null);
      assert.equal(stripDocsBasePath('/a/b/', ''), 'a/b');

      const root = { id: 'docs', routePrefix: '/' };
      assert.equal(buildCollectionRoutePath(root, 'guides/intro'), '/guides/intro');
      assert.equal(getCollectionRouteSlug(root, '/guides/intro'), 'guides/intro');

      const model = createRouteModel({
        collection: root,
        documentationTree: tree,
        documentPaths,
        openapiConfig: { ...openapiConfig, enabled: false },
        routeCollections: [{ collection: root, documentationTree: tree, documentPaths }],
      });
      assert.deepEqual(model.routeMap.get('/'), { type: 'site' });
      assert.equal(model.routeMap.get('/guides/intro')?.documentPath, 'guides/intro');
      assert.equal(model.routeMap.get('/guides')?.documentPath, 'guides/intro');
      assert.equal(model.routeMap.has('/docs/guides/intro'), false);
      assert.deepEqual([...model.ambiguousRoutes], []);
    },
  },
];
