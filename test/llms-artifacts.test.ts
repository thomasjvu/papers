import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createAllLlmsArtifacts,
  createHostedSkillArtifact,
  createLlmsArtifacts,
} from '../scripts/lib/llmsArtifacts.mjs';
import { createContentSchemaAdapter } from '../shared/contentSchema.js';

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

type Warning = { message: string; error: unknown };

/** Writes `docs` under `<root>/content/d/<name>.md` and builds a one-directory tree for them. */
async function withDocs(
  docs: Record<string, string>,
  run: (args: { rootDir: string; tree: unknown[]; warnings: Warning[] }) => Promise<void> | void
) {
  const rootDir = await mkdtemp(join(tmpdir(), 'papers-llms-docs-'));
  const warnings: Warning[] = [];
  const warn = console.warn;
  console.warn = (message: string, error: unknown) => warnings.push({ message, error });
  try {
    await mkdir(join(rootDir, 'content/d'), { recursive: true });
    for (const [name, content] of Object.entries(docs)) {
      await writeFile(join(rootDir, `content/d/${name}.md`), content);
    }
    const children = Object.keys(docs).map((name) => ({
      type: 'file',
      name: `${name}.md`,
      path: `d/${name}`,
    }));
    await run({ rootDir, tree: [{ type: 'directory', name: 'D', path: 'd', children }], warnings });
  } finally {
    console.warn = warn;
    await rm(rootDir, { recursive: true, force: true });
  }
}

function descriptionLines(llmsTxt: string): Record<string, string | null> {
  const lines: Record<string, string | null> = {};
  for (const match of llmsTxt.matchAll(/^- \[([^\]]+)\]\([^)]+\)(?:: (.*))?$/gm)) {
    lines[match[1]] = match[2] ?? null;
  }
  return lines;
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
  {
    name: 'llms descriptions skip list-only paragraphs but keep everything else',
    run: () =>
      withDocs(
        {
          ws: '---\ndescription: "   "\n---\n\nBody wins.\n',
          midDash: 'Use a---b and c---d.\n\nSecond.\n',
          spacedBlank: '- a\n- b\n \nReal after spaced blank.\n',
          mixed: '- item\nplain line\n\nNext.\n',
          ten: '10. ten\n11. eleven\n\nAfter ten.\n',
          one: '1. a\n2. b\n\nAfter one.\n',
          indented: '  - a\n  - b\n\nAfter indented.\n',
          midList: 'Pros - fast\nCons - none\n\nAfter mid.\n',
          hashEnd: 'Ref #\n\nAfter hash.\n',
          fenceEnd: 'Use ```\n\nAfter fence.\n',
          image: '![](a.png)\n\nAfter image.\n',
          headingOnly: '# Only a heading\n',
          bomMid: '\uFEFFa\uFEFFb text.\n',
        },
        ({ rootDir, tree }) => {
          const result = createLlmsArtifacts({
            rootDir,
            contentDir: 'content',
            documentationTree: tree,
          });
          assert.deepEqual(descriptionLines(result.llmsTxt), {
            ws: 'Body wins.',
            midDash: 'Use a---b and c---d.',
            spacedBlank: 'Real after spaced blank.',
            mixed: 'item plain line',
            ten: 'After ten.',
            one: 'After one.',
            indented: 'After indented.',
            midList: 'Pros - fast Cons - none',
            hashEnd: 'Ref #',
            fenceEnd: 'Use ```',
            image: 'After image.',
            headingOnly: null,
            bomMid: 'a b text.',
          });
        }
      ),
  },
  {
    name: 'llms descriptions honour the collection frontmatter schema and warn on bad files',
    run: () =>
      withDocs(
        {
          custom: '---\nsummary: S\ndescription: Custom.\n---\n\nBody.\n',
          broken: '---\ntitle: never closed\n\nBroken body.\n',
        },
        ({ rootDir, tree, warnings }) => {
          const fields = { summary: { type: 'string' }, description: { type: 'string' } };
          const base = { rootDir, contentDir: 'content', documentationTree: tree };

          assert.deepEqual(descriptionLines(createLlmsArtifacts(base).llmsTxt), {
            custom: null,
            broken: null,
          });
          assert.deepEqual(
            warnings.map((warning) => warning.message),
            ['Could not read file d/custom:', 'Could not read file d/broken:']
          );
          assert.match(String(warnings[0].error), /unsupported key "summary"/);

          for (const options of [
            { frontmatterSchema: fields },
            { schemaAdapter: createContentSchemaAdapter({ fields }) },
          ]) {
            const lines = descriptionLines(createLlmsArtifacts({ ...base, ...options }).llmsTxt);
            assert.equal(lines.custom, 'Custom.');
          }

          const viaCollection = createAllLlmsArtifacts({
            rootDir,
            collections: [
              {
                id: 'docs',
                tree,
                contentDir: 'content',
                schema: createContentSchemaAdapter({ fields }),
              },
            ],
          });
          assert.equal(descriptionLines(viaCollection.llmsTxt).custom, 'Custom.');
        }
      ),
  },
  {
    name: 'llms warns once per unreadable doc and skips non-file tree items',
    run: () =>
      withDocs({ ok: 'Fine.\n' }, ({ rootDir, tree, warnings }) => {
        const [section] = tree as Array<{ children: unknown[] }>;
        const documentationTree = [
          {
            ...section,
            children: [...section.children, { type: 'file', name: 'lost.md', path: 'd/lost' }],
          },
          { type: 'file', name: 'gone.md', path: 'd/gone' },
          { type: 'directory', name: 'Hollow' },
          {
            type: 'directory',
            name: 'Parent',
            children: [{ type: 'directory', name: 'Inner', children: [] }],
          },
        ];
        const result = createLlmsArtifacts({ rootDir, contentDir: 'content', documentationTree });
        assert.equal(result.expectedFileCount, 3);
        assert.equal(result.resolvedFileCount, 1);
        assert.doesNotMatch(result.llmsTxt, /## Parent|## Inner|## Hollow/);
        assert.match(result.llmsTxt, /- \[lost\]\(\/docs\/d\/lost\)\n/);
        assert.deepEqual(
          warnings.map((warning) => warning.message).sort(),
          // llms.txt lists the section file (one read); llms-full.txt reads both once.
          [
            'Could not read file d/gone:',
            'Could not read file d/lost:',
            'Could not read file d/lost:',
          ]
        );
        assert.equal((warnings[0].error as Error).message, 'File not found');
      }),
  },
  {
    name: 'llms output strips trailing whitespace and lists every parameter and response',
    run: () =>
      withDocs({ ws: 'Line with spaces.  \t\nNext line.\n' }, ({ rootDir, tree }) => {
        const result = createLlmsArtifacts({
          rootDir,
          contentDir: 'content',
          documentationTree: tree,
          homepageConfig: { hero: { subtitle: 'Sub  ' } },
          openapiArtifacts: {
            specs: [
              {
                label: 'Models only',
                schemas: [
                  { name: 'Thing', routePath: '/api/thing', typescript: 'type Thing = {}' },
                ],
              },
              {
                label: 'Ops',
                operations: [
                  {
                    method: 'GET',
                    path: '/x',
                    routePath: '/api/x',
                    parameters: [
                      { in: 'query', name: 'a' },
                      { in: 'header', name: 'b' },
                    ],
                    responses: [{ status: '200' }, { status: '404' }],
                    codeSamples: { curl: 'curl x' },
                  },
                ],
              },
            ],
          },
        });
        assert.doesNotMatch(result.llmsTxt, /[ \t]$/m);
        assert.doesNotMatch(result.llmsFullTxt, /[ \t]$/m);
        assert.match(result.llmsFullTxt, /\nLine with spaces\.\nNext line\.\n/);
        assert.match(
          result.llmsTxt,
          /### Models only\n\n- \[Thing\]\(\/api\/thing\): OpenAPI schema model\.\n/
        );
        assert.match(result.llmsFullTxt, /Parameters: query\.a, header\.b\n/);
        assert.match(result.llmsFullTxt, /Responses: 200, 404\n/);
      }),
  },
  {
    name: 'createAllLlmsArtifacts labels collections and keeps each first section heading',
    run: () =>
      withDocs({ x: 'Text.  \n' }, async ({ rootDir, tree }) => {
        await mkdir(join(rootDir, 'other/d'), { recursive: true });
        await writeFile(join(rootDir, 'other/d/x.md'), 'Other.\n');
        const collections = [
          { id: 'a', tree, contentDir: 'content' },
          { tree, contentDir: 'other', routePrefix: '/b' },
        ];
        const bare = createAllLlmsArtifacts({ rootDir, collections });
        // Regression: without a hero description the header strip used to eat each
        // collection's first "## D" section heading.
        assert.equal(
          bare.llmsTxt,
          '# Documentation Documentation\n\n## a\n\n## D\n\n- [x](/docs/d/x): Text.\n\n## Collection\n\n## D\n\n- [x](/b/d/x): Other.\n'
        );
        assert.match(
          bare.llmsFullTxt,
          /^# Documentation Documentation - Full Content\n\n> Complete/
        );
        assert.match(bare.llmsFullTxt, /\n## a\n\n> Complete[^\n]*\n\n\n## D\n/);
        assert.doesNotMatch(bare.llmsFullTxt, /[ \t]$/m);
        assert.match(bare.llmsFullTxt, /\n## Collection\n\n> Complete/);

        const titled = createAllLlmsArtifacts({
          rootDir,
          collections,
          homepageConfig: { hero: { title: 'T', subtitle: 'S  ' } },
        });
        assert.match(titled.llmsTxt, /^# T Documentation\n\n> S\n\n## a\n\n## D\n\n- \[x\]/);
        const described = createAllLlmsArtifacts({
          rootDir,
          collections,
          homepageConfig: { hero: { subtitle: 'S', description: 'Line one.\nLine two.' } },
        });
        assert.match(
          described.llmsTxt,
          /^# Documentation Documentation\n\n> S\n\nLine one\.\nLine two\.\n\n## a\n\n## D\n/
        );
        assert.equal(described.llmsTxt.match(/Line one/g)?.length, 1);
        assert.equal(
          createAllLlmsArtifacts({ rootDir, collections, homepageConfig: {} }).llmsTxt,
          bare.llmsTxt
        );

        const single = createAllLlmsArtifacts({
          rootDir,
          collections: [
            { id: 'api', label: 'API', tree, contentDir: 'content', routePrefix: '/api' },
          ],
        });
        assert.match(single.llmsTxt, /^# API Documentation\n\n## D\n\n- \[x\]\(\/api\/d\/x\)/);
      }),
  },
];
