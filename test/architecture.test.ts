import assert from 'node:assert/strict';

import { createDocsArtifacts } from '../scripts/lib/docsArtifacts.mjs';
import { combineSearchResults } from '../src/components/CommandPalette/searchUtils.ts';
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
        '2026-03-11T00:00:00.000Z'
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
      });
      assert.deepEqual(documents['user-guide/no-title'], {
        path: 'user-guide/no-title',
        title: 'no-title',
        description: undefined,
        frontmatter: {},
        content: 'Body only',
      });
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
];
