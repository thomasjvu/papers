import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { JSDOM } from 'jsdom';

import { buildPaddedViewBox } from '../src/utils/mermaidLayout.ts';
import {
  createDocsArtifacts,
  enrichDocumentArtifact,
  extractDocumentLinks,
  parseFrontmatter,
  serializeArtifactJson,
  stabilizeIndexGeneration,
} from '../scripts/lib/docsArtifacts.mjs';
import { validateDocumentationContent } from '../scripts/lib/contentValidation.mjs';
import { compileMdxToHtml } from '../scripts/lib/mdxCompile.mjs';
import {
  addFileToTree,
  replaceDocumentationTreeExport,
  serializeDocumentationTree,
} from '../scripts/lib/documentationTreeWriter.mjs';
import { loadViteEnv } from '../scripts/lib/loadViteEnv.mjs';
import { resolveDocFileInfo } from '../scripts/lib/docsVariants.mjs';
import { routeHtmlPath } from '../scripts/lib/routeHtmlPaths.mjs';
import {
  createRobotsTxt,
  createSeoRouteEntries,
  createSitemapXml,
} from '../scripts/lib/seoArtifacts.mjs';
import { computeInputFingerprint, createBuildIdentity } from '../scripts/lib/buildIdentity.mjs';
import { combineSearchResults } from '../src/components/CommandPalette/searchUtils.ts';
import {
  buildCanonicalDocsPath,
  buildDocsContentPath,
  buildDocsRouteVariants,
  getDocsVariantContexts,
  getDocumentationFeatureValidationIssues,
  parseDocsRoutePath,
} from '../shared/docsRouting.js';
import { buildOpenApiRoutePath, getOpenApiRoutePrefix } from '../shared/openapiRouting.js';
import { findPathToFile, mergeExpandedPaths } from '../src/components/FileTree/treeState.ts';
import { findDirectoryDefaultPath, findFirstDocumentPath } from '../src/lib/navigation.ts';
import { buildMarkdownRenderState } from '../src/utils/markdownCore.ts';
import { sanitizeMermaidSvg } from '../src/utils/sanitizeMermaidSvg.ts';
import { loadThemeManifest, readRegistry, resolveThemeId } from '../scripts/lib/themeRegistry.mjs';
import { collectLazyFeatureBoundaryIssues } from '../src/framework/lazyFeatureBoundaries.ts';
import { isPapersTemplateRoot, shouldUseLocalTemplate } from '../packages/create-papers/index.mjs';
import { assertValidOpenApiConfig, validateOpenApiSpecUrl } from '../shared/openapiSpecUrls.js';
import { createDocumentReferenceGraph } from '../scripts/lib/referenceGraph.mjs';
import { createOpenApiArtifacts } from '../scripts/lib/openapiArtifacts.mjs';

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

const seoTestDocumentationTree = [
  {
    type: 'directory' as const,
    name: 'Getting Started',
    path: 'getting-started',
    children: [
      {
        type: 'file' as const,
        name: 'Introduction.md',
        path: 'getting-started/introduction',
      },
    ],
  },
];

export const architectureTests: ArchitectureTestCase[] = [
  {
    name: 'build identity fingerprints published inputs and records release metadata',
    run: async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'papers-build-identity-'));
      try {
        await writeFile(join(tempDir, 'package.json'), '{"version":"0.0.0"}');
        await mkdir(join(tempDir, 'src'), { recursive: true });
        await writeFile(join(tempDir, 'src', 'input.md'), 'first');

        const firstFingerprint = computeInputFingerprint(tempDir);
        const firstIdentity = createBuildIdentity(tempDir, 'production');

        assert.deepEqual(firstIdentity.inputFiles, ['package.json', 'src/input.md']);
        assert.equal(firstIdentity.inputFingerprint, firstFingerprint.inputFingerprint);
        assert.equal(firstIdentity.buildMode, 'production');
        assert.equal(firstIdentity.packageVersion, '0.0.0');
        assert.equal(firstIdentity.siteName, 'papers');
        assert.equal(firstIdentity.defaultDocumentPath, 'getting-started/introduction');
        assert.equal(firstIdentity.siteUrl, '');

        await writeFile(join(tempDir, 'src', 'input.md'), 'changed');
        const secondFingerprint = computeInputFingerprint(tempDir);
        assert.notEqual(secondFingerprint.inputFingerprint, firstFingerprint.inputFingerprint);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    },
  },
  {
    name: 'content-engine fixture exercises native artifacts and validation',
    run: async () => {
      const fixtureRoot = join(process.cwd(), 'test/fixtures/content-engine');
      const fixtureSource = await readFile(join(fixtureRoot, 'fixture.mdx'), 'utf8');
      const navigation = JSON.parse(await readFile(join(fixtureRoot, 'navigation.json'), 'utf8'));
      const parsed = parseFrontmatter(fixtureSource);

      assert.deepEqual(parsed.frontmatter, {
        title: 'Content Engine Fixture',
        description: 'Representative source for the native content-engine benchmark.',
        tags: ['benchmark', 'mdx', 'api'],
      });
      assert.equal(navigation.children[0].children[0].path, 'content-engine/guides/fixture');

      const { documents } = createDocsArtifacts(
        { 'guides/fixture': fixtureSource },
        '2026-08-24T00:00:00.000Z',
        { 'guides/fixture': 'test/fixtures/content-engine/fixture.mdx' }
      );
      const document = await enrichDocumentArtifact(documents['guides/fixture']);

      assert.equal(document.contentFormat, 'html');
      assert.match(document.content, /papers-callout--note/);
      assert.match(document.content, /papers-tabs/);
      assert.deepEqual(document.toc, [
        { depth: 1, id: 'content-engine-fixture', text: 'Content Engine Fixture' },
        { depth: 2, id: 'details', text: 'Details' },
      ]);
      assert.deepEqual(document.references, [
        { target: '/openapi-v1.yaml', line: 13 },
        { target: '#details', line: 13 },
      ]);

      const tempDir = await mkdtemp(join(tmpdir(), 'papers-content-engine-fixture-'));
      try {
        await mkdir(join(tempDir, 'content', 'guides'), { recursive: true });
        await mkdir(join(tempDir, 'public'), { recursive: true });
        await writeFile(join(tempDir, 'content', 'guides', 'fixture.mdx'), fixtureSource);
        await writeFile(
          join(tempDir, 'public', 'openapi-v1.yaml'),
          'openapi: 3.0.0\ninfo:\n  title: Fixture\n  version: 1.0.0\n'
        );

        const validation = await validateDocumentationContent({
          rootDir: tempDir,
          contentRoot: 'content',
          publicDir: 'public',
          documentationTree: [
            {
              type: 'file' as const,
              name: 'Fixture.mdx',
              path: 'guides/fixture',
            },
          ],
          versionConfig: {
            enabled: false,
            current: '1.0',
            versions: ['1.0'],
            labels: {},
          },
          i18nConfig: {
            enabled: false,
            defaultLocale: 'en',
            locales: ['en'],
          },
          openapiConfig: {
            enabled: false,
            pagePath: 'api-reference/openapi',
            defaultSpecId: 'public',
            specs: [],
          },
        });

        assert.deepEqual(validation.issues, []);
        assert.deepEqual(validation.externalLinks, [
          {
            sourcePath: 'content/guides/fixture.mdx',
            line: 14,
            target: 'https://example.com/reference',
          },
        ]);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    },
  },
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
        contentFormat: 'markdown',
        toc: [],
        metadata: {
          title: 'Custom Intro',
          description: 'Setup page',
          canonicalPath: '/docs/getting-started/introduction',
          contentFormat: 'markdown',
          sourcePath: 'src/docs/content/getting-started/introduction.mdx',
        },
        references: [],
        links: [],
        sourcePath: 'src/docs/content/getting-started/introduction.mdx',
      });
      assert.deepEqual(documents['user-guide/no-title'], {
        path: 'user-guide/no-title',
        title: 'no-title',
        description: 'Body only',
        frontmatter: {},
        content: 'Body only',
        contentFormat: 'markdown',
        toc: [],
        metadata: {
          title: 'no-title',
          description: 'Body only',
          canonicalPath: '/docs/user-guide/no-title',
          contentFormat: 'markdown',
        },
        references: [],
        links: [],
      });
    },
  },
  {
    name: 'native frontmatter schema and reference graph produce typed relationships',
    run: () => {
      const parsed = parseFrontmatter(
        [
          '---',
          'title: Typed page',
          'keywords: [native, collections]',
          'order: 2',
          'draft: true',
          'toc: false',
          '---',
          '',
          'See [the next page](/docs/guides/next).',
        ].join('\n')
      );

      assert.deepEqual(parsed.frontmatter, {
        title: 'Typed page',
        keywords: ['native', 'collections'],
        order: 2,
        draft: true,
        toc: false,
      });

      const { documents } = createDocsArtifacts(
        {
          'guides/current': parsed.body,
          'guides/next': '# Next page',
        },
        '2026-08-25T00:00:00.000Z'
      );
      const graph = createDocumentReferenceGraph({
        documents,
        paths: ['guides/current', 'guides/next'],
        documentationTree: [
          {
            type: 'directory',
            name: 'Guides',
            path: 'guides',
            children: [
              { type: 'file', name: 'Current.md', path: 'guides/current' },
              { type: 'file', name: 'Next.md', path: 'guides/next' },
            ],
          },
        ],
        generated: '2026-08-25T00:00:00.000Z',
      });

      assert.deepEqual(graph.edges, [
        {
          source: 'guides/current',
          target: 'guides/next',
          href: '/docs/guides/next',
          line: 1,
        },
      ]);
      assert.deepEqual(graph.backlinks['guides/next'], [
        {
          source: 'guides/current',
          href: '/docs/guides/current',
          line: 1,
        },
      ]);
    },
  },
  {
    name: 'OpenAPI artifacts expose operations parameters examples and schemas',
    run: async () => {
      const artifacts = await createOpenApiArtifacts({ rootDir: process.cwd() });
      const publicSpec = artifacts.specs.find((spec) => spec.id === 'public');
      const internalSpec = artifacts.specs.find((spec) => spec.id === 'internal');

      assert(publicSpec);
      assert(internalSpec);
      assert.equal(publicSpec.counts.operations, 2);
      assert.equal(publicSpec.counts.schemas, 1);
      assert.equal(publicSpec.operations?.[0]?.method, 'GET');
      assert.equal(publicSpec.operations?.[0]?.path, '/docs');
      assert.equal(publicSpec.operations?.[0]?.parameters[0]?.name, 'limit');
      assert.equal(publicSpec.operations?.[0]?.responses[0]?.content[0]?.schema, 'DocsManifest');
      assert.equal(publicSpec.schemas?.[0]?.properties[0]?.name, 'count');
      assert.equal(internalSpec.operations?.[0]?.requestBody?.content[0]?.schema, 'BuildRequest');
      assert.equal(internalSpec.schemas?.length, 2);
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
    name: 'content link validation distinguishes action anchors from heading anchors',
    run: async () => {
      const links = extractDocumentLinks(
        ['# Guide', '', '<a href="#">Copy</a>', '<a href="#guide">Heading</a>'].join('\n')
      );

      assert.deepEqual(links, [
        { target: '#', line: 3, type: 'action' },
        { target: '#guide', line: 4, type: 'internal' },
      ]);

      const tempDir = await mkdtemp(join(tmpdir(), 'papers-content-links-'));
      const sourcePath = join(tempDir, 'content', 'guide', 'page.md');
      const documentationTree = [
        {
          type: 'file' as const,
          name: 'Page.md',
          path: 'guide/page',
        },
      ];
      const validationOptions = {
        rootDir: tempDir,
        contentRoot: 'content',
        publicDir: 'public',
        documentationTree,
        versionConfig: {
          enabled: false,
          current: '1.0',
          versions: ['1.0'],
          labels: {},
        },
        i18nConfig: {
          enabled: false,
          defaultLocale: 'en',
          locales: ['en'],
        },
        openapiConfig: {
          enabled: false,
          pagePath: 'api-reference/openapi',
          defaultSpecId: 'public',
          specs: [],
        },
      };

      try {
        await mkdir(join(tempDir, 'content', 'guide'), { recursive: true });
        await mkdir(join(tempDir, 'public'), { recursive: true });
        await writeFile(
          sourcePath,
          ['# Guide', '', '<a href="#">Copy</a>', '<a href="#guide">Heading</a>'].join('\n')
        );

        const validResult = await validateDocumentationContent(validationOptions);
        assert.deepEqual(validResult.issues, []);

        await writeFile(
          sourcePath,
          ['# Guide', '', '<a href="#">Copy</a>', '<a href="#missing">Heading</a>'].join('\n')
        );

        const invalidResult = await validateDocumentationContent(validationOptions);
        assert.equal(invalidResult.issues.length, 1);
        assert.match(
          invalidResult.issues[0],
          /content\/guide\/page\.md:4: unresolved heading anchor "#missing"/
        );
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
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
    name: 'buildMarkdownRenderState emits mermaid placeholders instead of code blocks',
    run: async () => {
      const markdown = ['```mermaid', 'flowchart LR', '  A --> B', '```'].join('\n');

      const result = await buildMarkdownRenderState(markdown, {
        createId: createDeterministicIdGenerator(),
      });

      assert.match(result.html, /data-mermaid-id="mermaid-1"/);
      assert.equal(result.codeBlocks.size, 0);
      assert.deepEqual(result.mermaidBlocks.get('mermaid-1'), {
        chart: 'flowchart LR\n  A --> B',
      });
    },
  },
  {
    name: 'compileMdxToHtml renders callouts and enrichDocumentArtifact marks html output',
    run: async () => {
      const html = await compileMdxToHtml('# MDX title\n\n> [!WARNING]\n> Sensitive example\n');
      assert.match(html, /<h1>MDX title<\/h1>/);
      assert.match(html, /papers-callout--warning/);
      assert.match(html, /Sensitive example/);

      const enriched = await enrichDocumentArtifact({
        path: 'demo/page',
        title: 'Demo',
        content: '# MDX title',
        contentFormat: 'markdown',
        sourcePath: 'src/docs/content/demo/page.mdx',
      });

      assert.equal(enriched.contentFormat, 'html');
      assert.match(enriched.content, /<h1>MDX title<\/h1>/);
    },
  },
  {
    name: 'compileMdxToHtml renders MDX shortcodes for Callout Tabs and Card',
    run: async () => {
      const source = [
        '# Shortcodes',
        '',
        '<Callout type="warning" title="Careful">',
        'Watch out',
        '</Callout>',
        '',
        '<Tabs>',
        '<Tab label="Alpha">First tab</Tab>',
        '<Tab label="Beta">Second tab</Tab>',
        '</Tabs>',
        '',
        '<Card title="Feature">',
        'Card body',
        '</Card>',
      ].join('\n');

      const html = await compileMdxToHtml(source);

      assert.match(html, /papers-callout--warning/);
      assert.match(html, /papers-callout__title/);
      assert.match(html, /Watch out/);
      assert.match(html, /papers-tabs/);
      assert.match(html, /papers-tabs__label/);
      assert.match(html, /First tab/);
      assert.match(html, /papers-card/);
      assert.match(html, /Card body/);
    },
  },
  {
    name: 'compileMdxToHtml renders CharacterNote shortcode with avatar and tone classes',
    run: async () => {
      const source = [
        '# Character notes',
        '',
        '<CharacterNote type="warning">',
        'This route may change.',
        '</CharacterNote>',
      ].join('\n');

      const html = await compileMdxToHtml(source);

      assert.match(html, /papers-character-note papers-character-note--warning/);
      assert.match(html, /papers-character-note__avatar/);
      assert.match(html, /character-notes\/.*warning/);
      assert.match(html, /This route may change/);
      assert.doesNotMatch(html, /papers-character-note__title/);
    },
  },
  {
    name: 'content renderer honors the declared html artifact format',
    run: async () => {
      const contentRendererSource = await readFile(
        new URL('../src/components/ContentRenderer.tsx', import.meta.url),
        'utf8'
      );
      const markdownRendererSource = await readFile(
        new URL('../src/components/MarkdownRenderer.tsx', import.meta.url),
        'utf8'
      );

      assert.match(contentRendererSource, /contentFormat === 'html'/);
      assert.match(contentRendererSource, /<HtmlRenderer html=\{content\}/);
      assert.match(markdownRendererSource, /DOMPurify\.sanitize/);
      assert.match(markdownRendererSource, /dangerouslySetInnerHTML/);
    },
  },
  {
    name: 'documentation tree writer appends unpublished files and preserves export shape',
    run: () => {
      const baseTree = [
        {
          type: 'directory' as const,
          name: 'Guides',
          path: 'guides',
          children: [
            {
              type: 'file' as const,
              name: 'Intro.md',
              path: 'guides/intro',
            },
          ],
        },
      ];

      const updated = addFileToTree(baseTree, 'guides/advanced/caching');
      const advancedDirectory = updated[0].children?.find(
        (item) => item.path === 'guides/advanced'
      );
      assert.ok(
        advancedDirectory?.children?.some((item) => item.path === 'guides/advanced/caching')
      );

      const serialized = serializeDocumentationTree(updated);
      assert.match(serialized, /export const documentationTree = \[/);
      assert.match(serialized, /guides\/advanced\/caching/);

      const replaced = replaceDocumentationTreeExport(
        'export const documentationTree = [];\nexport const versionConfig = {};',
        updated
      );
      assert.match(replaced, /guides\/advanced\/caching/);
      assert.match(replaced, /export const versionConfig = \{\}/);
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
        documentationTree: seoTestDocumentationTree,
      });

      const canonicalDocRoute = routes.find(
        (route) => route.routePath === '/docs/getting-started/introduction'
      );
      const docsAliasRoute = routes.find((route) => route.routePath === '/docs');
      const llmsRoute = routes.find((route) => route.routePath === '/docs/llms');

      assert.equal(canonicalDocRoute?.canonicalPath, '/docs/getting-started/introduction');
      assert.equal(docsAliasRoute?.canonicalPath, '/docs/getting-started/introduction');
      assert.equal(llmsRoute?.description, 'AI exports.');

      const sitemap = createSitemapXml(
        routes,
        'https://docs.example.com',
        '2026-03-11T00:00:00.000Z'
      );
      assert.match(sitemap, /<loc>https:\/\/docs\.example\.com\/<\/loc>/);
      assert.match(
        sitemap,
        /<loc>https:\/\/docs\.example\.com\/docs\/getting-started\/introduction<\/loc>/
      );
      assert.doesNotMatch(sitemap, /\/docs<\/loc>/);

      const robots = createRobotsTxt('https://docs.example.com');
      assert.match(robots, /Sitemap: https:\/\/docs\.example\.com\/sitemap\.xml/);
    },
  },
  {
    name: 'OpenAPI routes and route HTML paths share canonical contracts',
    run: async () => {
      const openApiConfig = {
        pagePath: 'api-reference/openapi',
        defaultSpecId: 'public',
      };

      assert.equal(getOpenApiRoutePrefix(openApiConfig), '/docs/api-reference/openapi');
      assert.equal(buildOpenApiRoutePath(openApiConfig), '/docs/api-reference/openapi');
      assert.equal(
        buildOpenApiRoutePath(openApiConfig, 'internal/v2'),
        '/docs/api-reference/openapi/internal%2Fv2'
      );
      assert.equal(getOpenApiRoutePrefix({ ...openApiConfig, routePrefix: ' /api/ ' }), '/api');

      const distRoot = join(tmpdir(), 'papers-route-dist');
      assert.equal(routeHtmlPath('/', distRoot), join(distRoot, 'index.html'));
      assert.equal(routeHtmlPath('/some/path', distRoot), join(distRoot, 'some/path.html'));
      assert.equal(routeHtmlPath('/some/path.html', distRoot), join(distRoot, 'some/path.html'));
      assert.throws(
        () => routeHtmlPath('/../escape', distRoot),
        /cannot escape the dist directory/
      );

      const openApiPageSource = await readFile(
        new URL('../src/pages/OpenApiPage.tsx', import.meta.url),
        'utf8'
      );
      assert.doesNotMatch(openApiPageSource, /\/docs\/reference\/routes/);
      assert.match(openApiPageSource, /DOCS_LANDING_PATH/);
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
          ['VITE_GITHUB_BRANCH=local-branch', 'VITE_SITE_URL=https://local.example.com'].join('\n')
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
      assert.deepEqual(buildDocsRouteVariants('guides/intro', { versionConfig, i18nConfig }), [
        '/docs/guides/intro',
        '/docs/2.0/guides/intro',
        '/docs/1.0/guides/intro',
        '/docs/en/guides/intro',
        '/docs/fr/guides/intro',
        '/docs/2.0/en/guides/intro',
        '/docs/2.0/fr/guides/intro',
        '/docs/1.0/en/guides/intro',
        '/docs/1.0/fr/guides/intro',
      ]);
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
        documentationTree: seoTestDocumentationTree,
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
  {
    name: 'buildPaddedViewBox expands mermaid diagram bounds with vertical breathing room',
    run: async () => {
      const viewBox = buildPaddedViewBox({ x: 0, y: 0, width: 749.46875, height: 506.5 }, 20, 28);

      assert.equal(viewBox, '-20 -28 789.46875 562.5');
    },
  },
  {
    name: 'content security rejects unsafe Mermaid SVG and OpenAPI spec URLs',
    run: async () => {
      assert.deepEqual(validateOpenApiSpecUrl('/openapi-v1.yaml', { allowedOrigins: [] }), {
        kind: 'local',
        value: '/openapi-v1.yaml',
      });
      assert.deepEqual(
        validateOpenApiSpecUrl('https://api.example.com/openapi.json', {
          allowedOrigins: ['https://api.example.com'],
        }),
        {
          kind: 'remote',
          value: 'https://api.example.com/openapi.json',
          origin: 'https://api.example.com',
        }
      );
      assert.throws(() => validateOpenApiSpecUrl('javascript:alert(1)', { allowedOrigins: [] }));
      assert.throws(() => validateOpenApiSpecUrl('//untrusted.example/openapi.json', {}));
      assert.throws(() =>
        validateOpenApiSpecUrl('https://untrusted.example/openapi.json', {
          allowedOrigins: ['https://api.example.com'],
        })
      );
      assert.throws(() =>
        assertValidOpenApiConfig({
          enabled: true,
          defaultSpecId: 'missing',
          specs: [{ id: 'public', label: 'Public API', url: '/openapi-v1.yaml' }],
        })
      );

      const dom = new JSDOM('<!doctype html><html><body></body></html>');
      const runtime = globalThis as unknown as {
        window?: unknown;
        document?: unknown;
      };
      const previousWindow = runtime.window;
      const previousDocument = runtime.document;
      runtime.window = dom.window;
      runtime.document = dom.window.document;

      try {
        const sanitized = sanitizeMermaidSvg(
          '<svg onload="alert(1)"><script>alert(1)</script><foreignObject>bad</foreignObject><a href="javascript:alert(1)">link</a></svg>'
        );
        assert.doesNotMatch(sanitized, /onload|script|foreignObject|javascript:/i);
      } finally {
        if (previousWindow === undefined) {
          delete runtime.window;
        } else {
          runtime.window = previousWindow;
        }
        if (previousDocument === undefined) {
          delete runtime.document;
        } else {
          runtime.document = previousDocument;
        }
        dom.window.close();
      }

      const docsPageSource = await readFile(join(process.cwd(), 'src/pages/DocsPage.tsx'), 'utf8');
      assert.match(docsPageSource, /setIsNotFound\(true\)/);
      assert.match(docsPageSource, /<NotFoundPage\s*\/>/);
    },
  },
  {
    name: 'adjacent page navigation supports shift plus arrow keys',
    run: async () => {
      const hookSource = await readFile(
        join(process.cwd(), 'src/hooks/useAdjacentPageNavigation.ts'),
        'utf8'
      );
      const contentRendererSource = await readFile(
        join(process.cwd(), 'src/components/ContentRenderer.tsx'),
        'utf8'
      );

      assert.match(hookSource, /event\.shiftKey/);
      assert.match(hookSource, /KEYBOARD_KEYS\.ARROW_LEFT/);
      assert.match(hookSource, /KEYBOARD_KEYS\.ARROW_RIGHT/);
      assert.match(hookSource, /isEditableTarget/);
      assert.match(contentRendererSource, /useAdjacentPageNavigation/);
    },
  },
  {
    name: 'doc page bottom chrome includes prev/next and GitHub edit/source footer',
    run: async () => {
      const contentRendererSource = await readFile(
        join(process.cwd(), 'src/components/ContentRenderer.tsx'),
        'utf8'
      );
      const footerSource = await readFile(
        join(process.cwd(), 'src/components/DocPageFooter.tsx'),
        'utf8'
      );
      const globalsCss = await readFile(join(process.cwd(), 'src/globals.css'), 'utf8');

      assert.match(contentRendererSource, /import DocPageFooter from ['"]\.\/DocPageFooter['"]/);
      assert.match(contentRendererSource, /<DocPageFooter\b/);
      assert.match(contentRendererSource, /doc-page-bottom-row/);
      assert.match(contentRendererSource, />\s*Previous\s*</);
      assert.match(contentRendererSource, />\s*Next\s*</);
      assert.match(contentRendererSource, /prevPage/);
      assert.match(contentRendererSource, /nextPage/);

      assert.match(footerSource, /VITE_GITHUB_URL/);
      assert.match(footerSource, /\/edit\//);
      assert.match(footerSource, /\/blob\//);
      assert.match(footerSource, />\s*edit\s*</);
      assert.match(footerSource, />\s*source\s*</);
      assert.match(footerSource, />\s*issue\s*</);

      // Footer must stay in document flow (not absolute-faded / mobile-hidden)
      assert.doesNotMatch(globalsCss, /\.doc-page-footer\s*\{[^}]*position:\s*absolute/s);
      assert.doesNotMatch(
        globalsCss,
        /@media\s*\(max-width:\s*640px\)\s*\{\s*\.doc-page-footer\s*\{\s*display:\s*none/s
      );
    },
  },
  {
    name: 'lazy feature modules avoid provider imports and unsafe app chunk splits',
    run: () => {
      const issues = collectLazyFeatureBoundaryIssues();
      assert.deepEqual(issues, []);
    },
  },
  {
    name: 'verification entry points use the test aliases and canonical docs-tree script',
    run: async () => {
      const packageJson = JSON.parse(
        await readFile(new URL('../package.json', import.meta.url), 'utf8')
      );
      const loaderSource = await readFile(
        new URL('./register-ts-node.mjs', import.meta.url),
        'utf8'
      );
      const resolverSource = await readFile(
        new URL('./resolve-aliases.mjs', import.meta.url),
        'utf8'
      );
      const treeScriptSource = await readFile(
        new URL('../scripts/sync-documentation-tree.mjs', import.meta.url),
        'utf8'
      );

      assert.equal(
        packageJson.scripts['check:docs-tree'],
        'node scripts/sync-documentation-tree.mjs --check'
      );
      assert.equal(
        packageJson.scripts['sync:docs-tree'],
        'node scripts/sync-documentation-tree.mjs'
      );
      assert.match(loaderSource, /resolve-aliases\.mjs/);
      assert.match(resolverSource, /@app-shared\/documentation-config\.js/);
      assert.match(resolverSource, /specifier\.startsWith\('@\/'\)/);
      assert.match(treeScriptSource, /\.\.\/shared\/documentation-config\.js/);
      assert.match(treeScriptSource, /\.\/lib\/documentationTreeWriter\.mjs/);
    },
  },
  {
    name: 'maintainer contract names source ownership and credential boundaries',
    run: async () => {
      const agentsSource = await readFile(join(process.cwd(), 'AGENTS.md'), 'utf8');

      for (const heading of [
        '## 1. Project identity and constraints',
        '## 2. Source ownership',
        '## 3. Verification ladder',
        '## 4. Change boundaries',
        '## 5. Deployment rules',
        '## 6. Stop and report rules',
        '## 7. Handoff expectations',
      ]) {
        assert.match(agentsSource, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      }

      assert.match(agentsSource, /npm run format:check/);
      assert.match(agentsSource, /npm run release:check/);
      assert.match(agentsSource, /PAPERS_DEPLOY_HOST/);
      assert.match(agentsSource, /FRAMEWORK\.md/);
      assert.match(agentsSource, /RELEASING\.md/);
    },
  },
  {
    name: 'create-papers only treats a marker-complete checkout as a local template',
    run: async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'papers-create-template-'));
      try {
        await writeFile(join(tempDir, 'package.json'), '{}');
        assert.equal(await isPapersTemplateRoot(tempDir), false);
        assert.equal(await shouldUseLocalTemplate(tempDir, { repo: 'thomasjvu/papers' }), false);
        await assert.rejects(
          () => shouldUseLocalTemplate(tempDir, { forceLocal: true }),
          /requires a papers template checkout/
        );

        await Promise.all(
          ['shared/documentation-config.js', 'src/docs/content', 'vite.config.ts'].map(
            async (marker) => {
              const markerPath = join(tempDir, marker);
              if (marker.endsWith('/')) {
                await mkdir(markerPath, { recursive: true });
              } else {
                await mkdir(join(markerPath, '..'), { recursive: true });
                await writeFile(markerPath, 'marker');
              }
            }
          )
        );
        assert.equal(await isPapersTemplateRoot(tempDir), true);
        assert.equal(await shouldUseLocalTemplate(tempDir, { repo: 'thomasjvu/papers' }), true);
        assert.equal(await shouldUseLocalTemplate(tempDir, { repo: 'someone/else' }), false);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    },
  },
  {
    name: 'theme registry resolves built-in default and gba themes',
    run: () => {
      const registry = readRegistry();
      const ids = registry.themes.map((theme: { id: string }) => theme.id);
      assert.deepEqual(ids, ['default', 'gba', 'rx-78', 'lorelei']);

      assert.equal(resolveThemeId('default'), 'default');
      assert.equal(resolveThemeId('gba'), 'gba');

      const gba = loadThemeManifest('gba');
      assert.equal(gba.manifest.iconSet, 'pixelarticons');
      assert.equal(gba.manifest.features?.lightDarkToggle, false);
      assert.equal(gba.manifest.defaultColorMode, 'dark');
      assert.equal(gba.manifest.fontCss, 'fonts.css');
      assert.match(gba.manifest.fonts?.[0]?.preload || '', /GeistPixel-Square\.woff2/);
    },
  },
];
