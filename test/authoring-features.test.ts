import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

import {
  buildMarkdownRenderState,
  getDiffLineKind,
  parseCodeFenceInfo,
  parseHighlightLines,
} from '../src/utils/markdownCore.ts';
import { compileMdxToHtml } from '../scripts/lib/mdxCompile.mjs';

type TestCase = { name: string; run: () => void | Promise<void> };

function createIds() {
  let count = 0;
  return (prefix: string) => `${prefix}-${++count}`;
}

async function render(markdown: string) {
  return buildMarkdownRenderState(markdown, { createId: createIds() });
}

export const authoringFeatureTests: TestCase[] = [
  {
    name: 'admonitions render each type with default and custom titles',
    run: async () => {
      for (const type of ['note', 'tip', 'info', 'warning', 'danger']) {
        const { html } = await render(`:::${type}\nBody **bold**.\n:::`);
        assert.match(html, new RegExp(`class="admonition admonition-${type}" role="note"`));
        assert.match(html, /<strong>bold<\/strong>/);
        assert.match(
          html,
          new RegExp(`admonition-title">${type[0].toUpperCase()}${type.slice(1)}</p>`)
        );
      }
      const { html } = await render(':::warning Breaking change\nText\n:::');
      assert.match(html, /aria-label="Breaking change"/);
      assert.match(html, /admonition-title">Breaking change<\/p>/);
    },
  },
  {
    name: 'admonition titles are escaped and bodies keep code fences',
    run: async () => {
      const { html, codeBlocks } = await render(
        ':::danger <img src=x onerror=alert(1)>\n```ts\nconst a = 1;\n```\n:::'
      );
      assert.doesNotMatch(html, /<img/);
      assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
      assert.equal(codeBlocks.size, 1);
    },
  },
  {
    name: 'admonitions nest when the outer fence has more colons',
    run: async () => {
      const { html } = await render('::::info Outer\nOuter.\n\n:::tip Inner\nInner.\n:::\n::::');
      const outer = html.indexOf('admonition-info');
      const inner = html.indexOf('admonition-tip');
      assert.ok(outer !== -1 && inner > outer, html);
      assert.equal((html.match(/class="admonition /g) || []).length, 2);
    },
  },
  {
    name: 'unknown admonition types and unclosed fences stay plain text',
    run: async () => {
      const unknown = await render(':::spoiler\nhidden\n:::');
      assert.doesNotMatch(unknown.html, /admonition/);
      const unclosed = await render(':::note\nno closing fence');
      assert.doesNotMatch(unclosed.html, /admonition/);
    },
  },
  {
    name: 'GitHub alerts map to admonition types and leave plain blockquotes alone',
    run: async () => {
      const important = await render('> [!IMPORTANT]\n> Read **this**.\n> Second line.');
      assert.match(important.html, /admonition admonition-info/);
      assert.match(important.html, /admonition-title">Important</);
      assert.match(important.html, /<strong>this<\/strong>/);
      assert.match(important.html, /Second line/);
      const caution = await render('> [!CAUTION]\n> Careful.');
      assert.match(caution.html, /admonition-danger/);
      const quote = await render('> Just a quote.');
      assert.doesNotMatch(quote.html, /admonition/);
      assert.match(quote.html, /<blockquote>/);
    },
  },
  {
    name: 'admonition markup survives the runtime sanitizer allowlist',
    run: async () => {
      const window = new JSDOM('').window;
      const purify = createDOMPurify(window as unknown as Parameters<typeof createDOMPurify>[0]);
      const { html } = await render(':::tip\nok\n:::');
      const clean = purify.sanitize(html, {
        ALLOWED_TAGS: ['div', 'p'],
        ALLOWED_ATTR: ['class', 'role', 'aria-label'],
      });
      assert.match(clean, /role="note"/);
      assert.match(clean, /aria-label="Tip"/);
    },
  },
  {
    name: 'parseHighlightLines expands ranges and drops invalid parts',
    run: () => {
      assert.deepEqual(parseHighlightLines('1,3-5'), [1, 3, 4, 5]);
      assert.deepEqual(parseHighlightLines('5-3, x, 0, 2, 2'), [2]);
      assert.deepEqual(parseHighlightLines('1-20000'), []);
    },
  },
  {
    name: 'parseCodeFenceInfo reads language, title, and highlighted lines',
    run: () => {
      assert.deepEqual(parseCodeFenceInfo('ts title="src/app.ts" {2,4-5}'), {
        language: 'ts',
        title: 'src/app.ts',
        highlightLines: [2, 4, 5],
      });
      assert.deepEqual(parseCodeFenceInfo("js title='a b.js'"), {
        language: 'js',
        title: 'a b.js',
      });
      assert.deepEqual(parseCodeFenceInfo('ts:TypeScript|js:JavaScript'), {
        language: 'ts:TypeScript|js:JavaScript',
      });
      assert.deepEqual(parseCodeFenceInfo(''), { language: 'text' });
    },
  },
  {
    name: 'code fences carry title and highlight metadata to every snippet',
    run: async () => {
      const result = await render('```ts title="app.ts" {1}\nconst a = 1;\n```');
      assert.deepEqual(result.codeBlocks.get('codeblock-1'), [
        { language: 'ts', code: 'const a = 1;', title: 'app.ts', highlightLines: [1] },
      ]);
      const tabs = await render('```ts:TS|js:JS {1}\na\n---\nb\n```');
      const snippets = tabs.codeBlocks.get('codeblock-1');
      assert.equal(snippets?.length, 2);
      assert.ok(snippets?.every((snippet) => snippet.highlightLines?.[0] === 1));
      const live = await render('```html title="demo.html"\n<b>x</b>\n```');
      assert.match(live.html, /data-liveexample-id/);
      assert.match(live.html, /data-language="html"/);
    },
  },
  {
    name: 'getDiffLineKind marks added and removed lines only in diff blocks',
    run: () => {
      assert.equal(getDiffLineKind('+ added', true), 'added');
      assert.equal(getDiffLineKind('- removed', true), 'removed');
      assert.equal(getDiffLineKind('+++ b/file', true), null);
      assert.equal(getDiffLineKind('--- a/file', true), null);
      assert.equal(getDiffLineKind('  context', true), null);
      assert.equal(getDiffLineKind('+ added', false), null);
    },
  },
  {
    name: 'MDX :::callouts match Markdown markup, nest, and keep code bodies',
    run: async () => {
      const html = await compileMdxToHtml(
        [
          ':::warning Breaking change',
          'Body **bold**.',
          '',
          '```ts',
          'const a = 1;',
          '```',
          ':::',
          '',
          '::::info Outer',
          'Outer.',
          '',
          ':::tip Inner',
          'Inner.',
          ':::',
          '::::',
          '',
          ':::note',
          'single paragraph',
          ':::',
        ].join('\n')
      );
      assert.match(
        html,
        /<div class="admonition admonition-warning" role="note" aria-label="Breaking change"><p class="admonition-title">Breaking change<\/p>/
      );
      assert.match(html, /<strong>bold<\/strong>/);
      assert.match(html, /language-ts/);
      assert.match(html, /admonition-info[\s\S]*admonition-tip[\s\S]*Inner\./);
      assert.match(
        html,
        /admonition-title">Note<\/p><div class="admonition-content"><p>single paragraph<\/p>/
      );
      assert.doesNotMatch(html, /:::/);
    },
  },
  {
    name: 'MDX unknown or unclosed ::: fences stay as authored text',
    run: async () => {
      const unknown = await compileMdxToHtml(':::spoiler\nhidden\n:::');
      assert.doesNotMatch(unknown, /admonition/);
      const unclosed = await compileMdxToHtml(':::note\nno closing fence');
      assert.doesNotMatch(unclosed, /admonition/);
      assert.match(unclosed, /:::note/);
    },
  },
  {
    name: 'MDX GitHub alerts and <Callout> render shared admonition markup',
    run: async () => {
      const caution = await compileMdxToHtml('> [!CAUTION]\n> Careful.');
      assert.match(caution, /admonition admonition-danger papers-callout papers-callout--caution/);
      assert.match(caution, /role="note"/);
      assert.match(caution, /admonition-title">Caution</);
      assert.doesNotMatch(caution, /\[!CAUTION\]/);
      const plain = await compileMdxToHtml('> plain quote');
      assert.match(plain, /<blockquote>/);
      const callout = await compileMdxToHtml(
        '<Callout type="important" title="Heads up">\n  Body.\n</Callout>'
      );
      assert.match(callout, /admonition admonition-info papers-callout papers-callout--important/);
      assert.match(callout, /aria-label="Heads up"/);
      const defaulted = await compileMdxToHtml('<Callout type="warning">\n  Body.\n</Callout>');
      assert.match(defaulted, /admonition-title papers-callout__title">Warning</);
    },
  },
  {
    name: 'MDX callout titles are escaped text',
    run: async () => {
      const html = await compileMdxToHtml(':::danger Fish & "chips"\nBody\n:::');
      assert.match(html, /aria-label="Fish &#x26; &#x22;chips&#x22;"/);
      assert.match(html, /admonition-title">Fish &#x26; "chips"<\/p>/);
    },
  },
  {
    name: 'MDX code fences render title, highlighted lines, and diff markers',
    run: async () => {
      const html = await compileMdxToHtml(
        '```bash title="setup.sh" {2}\nnpm ci\nnpm run build\n```\n\n```diff\n-old\n+new\n ctx\n```\n\n```js\nplain\n```'
      );
      assert.match(html, /<div class="papers-code__title" data-code-title="">setup.sh<\/div>/);
      assert.match(html, /papers-code__line papers-code__line--highlighted">npm run build</);
      assert.match(html, /<span class="papers-code__line">npm ci<\/span>/);
      assert.match(html, /data-line-kind="removed">-old</);
      assert.match(html, /data-line-kind="added">\+new</);
      assert.match(html, /<span class="papers-code__line"> ctx<\/span>/);
      assert.match(html, /<pre><code class="language-js">plain\n<\/code><\/pre>/);
    },
  },
  {
    name: 'MDX single-line <Callout> renders as a block callout, not a nested div',
    run: async () => {
      const html = await compileMdxToHtml('<Callout type="warning">Legacy</Callout>');
      assert.doesNotMatch(html, /<p><div>/);
      assert.match(html, /^<div class="admonition admonition-warning papers-callout/);
      assert.match(html, /admonition-content">Legacy<\/div>/);
      const inline = await compileMdxToHtml('Text with <Callout>x</Callout> inside.');
      assert.match(inline, /^<p>Text with/);
    },
  },
];
