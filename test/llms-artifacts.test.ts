import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createAllLlmsArtifacts,
  createHostedSkillArtifact,
  createLlmsArtifacts,
} from '../scripts/lib/llmsArtifacts.mjs';

const fixtureDir = new URL('./fixtures/llms/', import.meta.url);
const updateGolden = process.env.UPDATE_LLMS_GOLDEN === '1';

const files: Record<string, string> = {
  'content/guides/intro.md':
    '\uFEFF---\ntitle: Intro\ndescription: "  Start here.  "\n---\n\n# Intro\n\nWelcome text.\n',
  'content/guides/advanced/deep.mdx':
    '---\ntitle: Deep\n---\n\n# Deep\n\n- a list\n- only\n\n```js\ncode();\n```\n\nThe first real paragraph explains deep things.\n\nSecond paragraph.',
  'content/guides/tables.md': '| a | b |\n| - | - |\n| 1 | 2 |\n',
  'api/guides/intro.md': '---\ntitle: Ref\n---\n\nAPI collection page.\n',
};

const tree = [
  {
    type: 'directory',
    name: 'Guides',
    path: 'guides',
    children: [
      { type: 'file', name: 'intro.md', path: 'guides/intro' },
      { type: 'file', name: 'tables.md', path: 'guides/tables' },
      { type: 'file', name: 'missing.md', path: 'guides/missing' },
      {
        type: 'directory',
        name: 'Advanced',
        path: 'guides/advanced',
        children: [{ type: 'file', name: 'deep.mdx', path: 'guides/advanced/deep' }],
      },
    ],
  },
  { type: 'file', name: 'root.md', path: 'root' },
  { type: 'directory', name: 'Empty' },
];

const openapiArtifacts = {
  specs: [
    {
      label: 'Pets API',
      operations: [
        {
          method: 'GET',
          path: '/pets',
          routePath: '/api/pets/get-pets',
          summary: 'List pets',
          description: 'Returns pets.',
          parameters: [{ in: 'query', name: 'limit' }],
          responses: [{ status: '200' }],
          codeSamples: { curl: 'curl https://x/pets' },
        },
        {
          method: 'POST',
          path: '/pets',
          routePath: '/api/pets/post-pets',
          parameters: [],
          responses: [],
          codeSamples: { curl: 'curl -X POST https://x/pets' },
        },
      ],
      schemas: [
        { name: 'Pet', routePath: '/api/pets/models/pet', typescript: 'type Pet = {}' },
        {
          name: 'Owner',
          routePath: '/api/pets/models/owner',
          description: 'Pet owner.',
          typescript: 'type Owner = {}',
        },
      ],
    },
    { label: 'Empty API', operations: [], schemas: [] },
    { label: 'No arrays' },
  ],
};

const homepageConfig = {
  hero: { title: 'Fixture', subtitle: 'Sub', description: 'Site description.' },
};

async function withFixtureRoot(run: (rootDir: string) => Promise<void> | void) {
  const rootDir = await mkdtemp(join(tmpdir(), 'papers-llms-'));
  const warn = console.warn;
  console.warn = () => {};
  try {
    for (const [relativePath, content] of Object.entries(files)) {
      const filePath = join(rootDir, relativePath);
      await mkdir(join(filePath, '..'), { recursive: true });
      await writeFile(filePath, content);
    }
    await run(rootDir);
  } finally {
    console.warn = warn;
    await rm(rootDir, { recursive: true, force: true });
  }
}

async function assertGolden(name: string, actual: string) {
  const url = new URL(name, fixtureDir);
  if (updateGolden) {
    await writeFile(url, actual);
  }
  assert.equal(actual, await readFile(url, 'utf8'), `${name} drifted`);
}

export const llmsArtifactTests = [
  {
    name: 'createLlmsArtifacts pins llms.txt and llms-full.txt for a single collection',
    run: () =>
      withFixtureRoot(async (rootDir) => {
        const result = createLlmsArtifacts({
          rootDir,
          contentDir: 'content',
          documentationTree: tree,
          homepageConfig,
          siteUrl: 'https://docs.example.com',
          openapiArtifacts,
        });
        assert.equal(result.resolvedFileCount, 3);
        assert.equal(result.expectedFileCount, 5);
        await assertGolden('single.llms.txt', result.llmsTxt);
        await assertGolden('single.llms-full.txt', result.llmsFullTxt);
      }),
  },
  {
    name: 'createLlmsArtifacts uses defaults when hero text and openapi are absent',
    run: () =>
      withFixtureRoot(async (rootDir) => {
        const result = createLlmsArtifacts({
          rootDir,
          contentDir: 'content',
          documentationTree: [tree[0]],
        });
        assert.match(result.llmsTxt, /^# Documentation Documentation\n\n## Advanced\n/);
        assert.doesNotMatch(result.llmsTxt, /API Reference|^> /m);
        assert.doesNotMatch(result.llmsFullTxt, /API Reference/);
        assert.match(result.llmsTxt, /\]\(\/docs\/guides\/intro\): Start here\.\n/);
        assert.ok(result.llmsTxt.endsWith('\n'));
      }),
  },
  {
    name: 'createLlmsArtifacts fails loudly when no documentation source resolves',
    run: () =>
      withFixtureRoot((rootDir) => {
        assert.throws(
          () =>
            createLlmsArtifacts({
              rootDir,
              contentDir: 'nowhere',
              documentationTree: tree,
            }),
          new RegExp(
            `resolved 0 documentation sources under ${rootDir}/src/docs/content \\(expected 5\\)`
          )
        );
        const empty = createLlmsArtifacts({ rootDir, documentationTree: [] });
        assert.equal(empty.expectedFileCount, 0);
      }),
  },
  {
    name: 'createAllLlmsArtifacts pins multi-collection output and single-collection passthrough',
    run: () =>
      withFixtureRoot(async (rootDir) => {
        const docs = { id: 'docs', label: 'Docs', tree, contentDir: 'content' };
        const api = {
          id: 'api',
          routePrefix: '/api-docs',
          tree: [tree[0]],
          contentDir: 'api',
        };
        const multi = createAllLlmsArtifacts({
          rootDir,
          collections: [docs, api],
          homepageConfig,
          siteUrl: 'https://docs.example.com',
        });
        assert.equal(multi.resolvedFileCount, 4);
        assert.equal(multi.expectedFileCount, 9);
        await assertGolden('multi.llms.txt', multi.llmsTxt);
        await assertGolden('multi.llms-full.txt', multi.llmsFullTxt);

        const single = createAllLlmsArtifacts({ rootDir, collections: [docs] });
        assert.deepEqual(
          single,
          createLlmsArtifacts({ rootDir, documentationTree: tree, contentDir: 'content' })
        );
        const none = createAllLlmsArtifacts({ rootDir });
        assert.equal(none.expectedFileCount, 0);
        assert.match(none.llmsTxt, /^# Documentation Documentation\n\n$/);
      }),
  },
  {
    name: 'createHostedSkillArtifact prefers options, then frontmatter, then defaults',
    run: () => {
      assert.equal(
        createHostedSkillArtifact('Body text\n'),
        '---\nname: documentation-agent\ndescription: Agent guidance for navigating and maintaining this documentation site.\n---\n\nBody text\n'
      );
      assert.equal(
        createHostedSkillArtifact('\uFEFF---\ndescription: From file\n---\n\n  Body  \n'),
        '---\nname: documentation-agent\ndescription: From file\n---\n\nBody\n'
      );
      assert.equal(
        createHostedSkillArtifact('---\ndescription: F\n---\nB', { name: 'n', description: 'd' }),
        '---\nname: n\ndescription: d\n---\n\nB\n'
      );
    },
  },
];
