import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

import { createOpenApiRouteEntries } from '../scripts/lib/openapiArtifacts.mjs';
import { createAllCollectionSeoRouteEntries } from '../scripts/lib/seoArtifacts.mjs';

const updateGolden = process.env.UPDATE_SEO_ROUTES_GOLDEN === '1';

async function assertGolden(name: string, value: unknown) {
  const url = new URL(`./fixtures/seo-routes/${name}.json`, import.meta.url);
  const actual = `${JSON.stringify(value, null, 2)}\n`;
  if (updateGolden) {
    await writeFile(url, actual);
  }
  assert.equal(actual, await readFile(url, 'utf8'), `${name} drifted`);
}

const openapiArtifacts = {
  specs: [
    {
      id: 'main',
      label: 'Main API',
      title: 'Main API Reference',
      description: 'Everything.',
      operations: [
        {
          method: 'GET',
          path: '/pets',
          routePath: '/docs/api/get-pets',
          canonicalPath: '/docs/api/get-pets/',
          summary: 'List pets',
          description: 'Lists every pet.',
        },
        { method: 'POST', path: '/pets', routePath: '/docs/api/post-pets', summary: 'Create' },
        { method: 'DELETE', path: '/pets/{id}', routePath: '/docs/api/delete-pet' },
      ],
      schemas: [
        { name: 'Pet', routePath: '/docs/api/models/pet', description: 'A pet.' },
        { name: 'Owner', routePath: '/docs/api/models/owner', canonicalPath: '/owner' },
      ],
    },
    { id: 'billing', label: 'Billing' },
    { id: 'main', label: 'Explicit', routePath: '/custom/route' },
  ],
};

function doc(path: string, title: string, description?: string) {
  return { path, title, description, content: `# ${title}\n\n${description || 'Body.'}` };
}

const docsTree = [
  {
    type: 'directory',
    name: 'Start',
    path: 'start',
    children: [{ type: 'file', name: 'intro.md', path: 'start/intro' }],
  },
];

export const seoRouteTests = [
  {
    name: 'createOpenApiRouteEntries pins overview, operation and model entries',
    run: async () => {
      const config = {
        enabled: true,
        routeBase: '/docs/api',
        defaultSpecId: 'main',
        specs: [{ id: 'main' }, { id: 'billing' }],
      };
      await assertGolden('openapi', createOpenApiRouteEntries(openapiArtifacts, config, 'Site'));
      assert.deepEqual(createOpenApiRouteEntries(null, config), []);
      assert.equal(
        createOpenApiRouteEntries(openapiArtifacts)[0].title,
        'Main API Reference | papers'
      );
    },
  },
  {
    name: 'createAllCollectionSeoRouteEntries pins collection, hosted and openapi entries',
    // Pins the Papers repo's own sample content and config.
    requires: 'packages/create-papers',
    run: async () => {
      const collections = [
        { id: 'guides', label: 'Guides', routePrefix: '/guides', tree: [] },
        { id: 'docs', label: 'Docs', routePrefix: '/docs', tree: docsTree },
        { id: 'missing', label: 'Missing', routePrefix: '/missing', tree: [] },
      ];
      const artifactsByCollectionId = {
        docs: {
          index: { paths: ['start/intro', 'llms'] },
          documents: {
            'start/intro': doc('start/intro', 'Intro', 'Start here.'),
            llms: doc('llms', 'LLMs.txt', 'AI exports.'),
            skill: doc('skill', 'Skill'),
          },
        },
        guides: {
          index: { paths: ['how-to'] },
          documents: { 'how-to': doc('how-to', 'How to') },
        },
      };
      const entries = createAllCollectionSeoRouteEntries(collections, artifactsByCollectionId, {
        siteName: 'Site',
        siteSubtitle: 'Sub',
        siteDescription: 'Desc.',
        openapiArtifacts,
        collections,
      });
      await assertGolden('all-collections', entries);

      const noDocs = createAllCollectionSeoRouteEntries(
        [collections[0]],
        artifactsByCollectionId,
        {}
      );
      await assertGolden('guides-only', noDocs);
      assert.deepEqual(createAllCollectionSeoRouteEntries([], {}, {}), []);
    },
  },
];
