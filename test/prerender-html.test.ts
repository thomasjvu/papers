import assert from 'node:assert/strict';

import {
  INITIAL_DOCS_SCRIPT_ID,
  addHeadingIdsFromToc,
  createInitialDocsData,
  escapeJsonForInlineScript,
  injectPrerender,
  removeDocumentJsonPreload,
  renderPrerenderArticleHtml,
  supportsPrerender,
} from '../scripts/lib/prerenderHtml.mjs';

const TEMPLATE = '<html><head><title>Page</title></head><body><div id="root"></div></body></html>';

const baseDocument = {
  path: 'getting-started/installation',
  title: 'Installation',
  description: 'Install papers',
  frontmatter: {},
  content: '# Installation\n\nRun `npm install`.\n',
  contentFormat: 'markdown',
  sourcePath: 'src/docs/content/getting-started/installation.md',
  toc: [
    { depth: 1, id: 'installation', text: 'Installation' },
    { depth: 2, id: 'requirements', text: 'Requirements' },
  ],
  metadata: { canonicalPath: '/docs/getting-started/installation' },
  references: [],
  links: [],
};

const baseCollection = { id: 'docs' };

export const prerenderHtmlTests = [
  {
    name: 'supportsPrerender accepts plain markdown and html, rejects the rest',
    run: () => {
      assert.equal(supportsPrerender(baseDocument), true);
      assert.equal(supportsPrerender({ ...baseDocument, contentFormat: 'html' }), true);
      assert.equal(supportsPrerender({ ...baseDocument, content: '   ' }), false);
      assert.equal(supportsPrerender({ ...baseDocument, contentFormat: 'mdx' }), false);
      assert.equal(supportsPrerender(null), false);
    },
  },
  {
    name: 'supportsPrerender skips articles using the marked-only authoring features',
    run: () => {
      for (const content of [
        ':::tabs\n::tab One\nText\n:::\n',
        ':::steps\n1. Do it\n:::\n',
        ':::cards\n::card Title\nText\n:::\n',
        '```ColorPalette\n{"colors": []}\n```\n',
      ]) {
        assert.equal(
          supportsPrerender({ ...baseDocument, content }),
          false,
          content.split('\n')[0]
        );
      }
      // Mermaid, math and callouts render through the unified pipeline.
      assert.equal(
        supportsPrerender({ ...baseDocument, content: '```mermaid\ngraph TD\n```\n' }),
        true
      );
      assert.equal(supportsPrerender({ ...baseDocument, content: '> [!NOTE]\nBe kind.\n' }), true);
    },
  },
  {
    name: 'createInitialDocsData keeps only the runtime document shape',
    run: () => {
      const initialDocs = createInitialDocsData({
        collection: baseCollection,
        docPath: 'getting-started/installation',
        version: null,
        locale: null,
        document: baseDocument,
        backlinks: [{ source: 'a', href: '/docs/a', line: 1 }],
      });

      assert.deepEqual(initialDocs, {
        collectionId: 'docs',
        docPath: 'getting-started/installation',
        version: null,
        locale: null,
        document: {
          path: 'getting-started/installation',
          content: baseDocument.content,
          title: 'Installation',
          description: 'Install papers',
          frontmatter: {},
          sourcePath: 'src/docs/content/getting-started/installation.md',
          contentFormat: 'markdown',
        },
        backlinks: [{ source: 'a', href: '/docs/a', line: 1 }],
      });
    },
  },
  {
    name: 'escapeJsonForInlineScript neutralises script-breaking sequences',
    run: () => {
      const escaped = escapeJsonForInlineScript({ text: '</script><script>alert(1)</script>' });
      assert.ok(!escaped.includes('<'), escaped);
      assert.equal(JSON.parse(escaped).text, '</script><script>alert(1)</script>');
    },
  },
  {
    name: 'addHeadingIdsFromToc assigns TOC ids in document order',
    run: () => {
      const html = addHeadingIdsFromToc(
        '<h1>Installation</h1><p>Text</p><h2>Requirements</h2>',
        baseDocument.toc
      );
      assert.equal(
        html,
        '<h1 id="installation">Installation</h1><p>Text</p><h2 id="requirements">Requirements</h2>'
      );
      assert.equal(
        addHeadingIdsFromToc('<h1 id="custom">Hi</h1><h2>Next</h2>', baseDocument.toc),
        '<h1 id="custom">Hi</h1><h2 id="requirements">Next</h2>'
      );
      assert.equal(addHeadingIdsFromToc('<h1>Hi</h1>', []), '<h1>Hi</h1>');
    },
  },
  {
    name: 'renderPrerenderArticleHtml wraps the article in the app content shell',
    run: () => {
      const html = renderPrerenderArticleHtml('<h1 id="installation">Installation</h1>');
      assert.match(html, /data-prerender="docs"/);
      assert.match(html, /doc-content-shell/);
      assert.match(html, /markdown-content prose/);
      assert.match(html, /<h1 id="installation">Installation<\/h1>/);
    },
  },
  {
    name: 'injectPrerender fills the root shell and embeds the document JSON',
    run: () => {
      const initialDocs = createInitialDocsData({
        collection: baseCollection,
        docPath: 'getting-started/installation',
        document: baseDocument,
        backlinks: [],
      });
      const html = injectPrerender(TEMPLATE, {
        initialDocs,
        prerenderHtml: renderPrerenderArticleHtml('<p>Hello</p>'),
      });

      assert.match(html, /<div id="root"><div class="doc-content-shell/);
      assert.match(html, /<p>Hello<\/p>/);
      const script = html.match(
        new RegExp(
          `<script id="${INITIAL_DOCS_SCRIPT_ID}" type="application/json">([\\s\\S]*?)</script>`
        )
      );
      assert.ok(script, 'embedded initial-docs script is present');
      assert.equal(JSON.parse(script[1]).document.title, 'Installation');
      assert.ok(!script[1].includes('<'), 'embedded JSON has no literal <');
    },
  },
  {
    name: 'injectPrerender is a no-op for the parts it was not given',
    run: () => {
      assert.equal(injectPrerender(TEMPLATE, {}), TEMPLATE);
      assert.equal(
        injectPrerender('<html><body><div id="root"><p>Kept</p></div></body></html>', {
          prerenderHtml: '<p>New</p>',
        }),
        '<html><body><div id="root"><p>Kept</p></div></body></html>'
      );
    },
  },
  {
    name: 'removeDocumentJsonPreload removes only the embedded document preload',
    run: () => {
      const html = [
        '<link rel="modulepreload" crossorigin href="/assets/DocsPage-abc.js" />',
        '<link rel="preload" as="fetch" href="/docs-content/getting-started/installation.json" crossorigin />',
        '<link rel="preload" as="fetch" href="/docs-content/user-guide/basic-usage.json" crossorigin />',
      ].join('\n');
      const next = removeDocumentJsonPreload(
        html,
        '/docs-content/getting-started/installation.json'
      );

      assert.ok(!next.includes('getting-started/installation.json'), next);
      assert.ok(next.includes('DocsPage-abc.js'), next);
      assert.ok(next.includes('user-guide/basic-usage.json'), next);
      assert.equal(removeDocumentJsonPreload(html, null), html);
      // The tag is removed wherever it sits, not only on its own line.
      const inline =
        '<head><link rel="preload" as="fetch" href="/docs-content/getting-started/installation.json" crossorigin /></head>';
      assert.equal(
        removeDocumentJsonPreload(inline, '/docs-content/getting-started/installation.json'),
        '<head></head>'
      );
      assert.equal(removeDocumentJsonPreload(inline, '/docs-content/other.json'), inline);
    },
  },
];
