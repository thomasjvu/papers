import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';

import {
  buildMarkdownRenderState,
  getDiffLineKind,
  parseHighlightLines,
  splitTabPanels,
} from '../src/utils/markdownCore.ts';
import { resolveTabIndex } from '../src/lib/tabSync.ts';
import { compileMdxToHtml } from '../scripts/lib/mdxCompile.mjs';
import { readHtmlCodeBlock } from '../src/utils/htmlCodeBlocks.ts';
import { createWordPattern, markWords, type HighlighterNode } from '../src/utils/codeWords.ts';
import { parseCodeFenceMeta, sanitizeCardHref } from '../shared/codeFence.js';

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
    name: 'unknown admonition types and unclosed fences stay plain text',
    run: async () => {
      const unknown = await render(':::spoiler\nhidden\n:::');
      assert.doesNotMatch(unknown.html, /admonition/);
      const unclosed = await render(':::note\nno closing fence');
      assert.doesNotMatch(unclosed.html, /admonition/);
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
    name: 'code fences carry title and highlight metadata to every snippet',
    run: async () => {
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
    name: 'diff file headers and ordinary code are not additions or removals',
    run: () => {
      assert.equal(getDiffLineKind('+++ b/file', true), null);
      assert.equal(getDiffLineKind('--- a/file', true), null);
      assert.equal(getDiffLineKind('  context', true), null);
      assert.equal(getDiffLineKind('+ added', false), null);
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
    name: 'MDX callout titles are escaped text',
    run: async () => {
      const html = await compileMdxToHtml(':::danger Fish & "chips"\nBody\n:::');
      assert.match(html, /aria-label="Fish &#x26; &#x22;chips&#x22;"/);
      assert.match(html, /admonition-title">Fish &#x26; "chips"<\/p>/);
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
  {
    name: 'markdown tabs reject invalid groups and escape labels',
    run: async () => {
      const badGroup = await render(':::tabs "><x\n::tab A\none\n:::');
      assert.doesNotMatch(badGroup.html, /data-tabs-group/);
      const escaped = await render(':::tabs\n::tab <b>"x"</b>\none\n:::');
      assert.match(escaped.html, /data-tab-label="&lt;b&gt;&quot;x&quot;&lt;\/b&gt;"/);
      const empty = await render(':::tabs\nno markers\n:::');
      assert.doesNotMatch(empty.html, /md-tabs/);
    },
  },
  {
    name: 'splitTabPanels and resolveTabIndex handle markers and stale choices',
    run: () => {
      assert.deepEqual(splitTabPanels('intro\n::tab A\none\n::tab B\ntwo'), [
        { label: 'A', content: 'one\n' },
        { label: 'B', content: 'two' },
      ]);
      assert.equal(resolveTabIndex(['npm', 'pnpm'], 'pnpm'), 1);
      assert.equal(resolveTabIndex(['npm', 'pnpm'], 'yarn'), 0);
      assert.equal(resolveTabIndex(['npm', 'pnpm'], null), 0);
    },
  },
  {
    name: ':::details renders a closed native disclosure in Markdown and MDX',
    run: async () => {
      const { html } = await render(':::details Show more\nHidden **text**.\n:::');
      assert.match(
        html,
        /^<details class="admonition admonition-details"><summary class="admonition-title">Show more<\/summary><div class="admonition-content"><p>Hidden <strong>text<\/strong>/
      );
      assert.doesNotMatch(html, / open/);
      const fallback = await render(':::details\nx\n:::');
      assert.match(fallback.html, /<summary class="admonition-title">Details<\/summary>/);
      const mdx = await compileMdxToHtml(':::details Show more\nHidden.\n:::');
      assert.match(
        mdx,
        /^<details class="admonition admonition-details"><summary class="admonition-title">Show more<\/summary>/
      );
    },
  },
  {
    name: 'fence meta reads quoted highlight words and line-number flags',
    run: () => {
      assert.deepEqual(parseCodeFenceMeta(' title="a.ts" "apiKey" \'x y\' {2}'), {
        title: 'a.ts',
        highlightWords: ['apiKey', 'x y'],
        highlightLines: [2],
      });
      assert.equal(parseCodeFenceMeta(' noLineNumbers').showLineNumbers, false);
      assert.equal(parseCodeFenceMeta(' showLineNumbers=false').showLineNumbers, false);
      assert.equal(parseCodeFenceMeta(' showLineNumbers').showLineNumbers, true);
      assert.equal(parseCodeFenceMeta(' {1}').showLineNumbers, undefined);
      const many = parseCodeFenceMeta(
        Array.from({ length: 12 }, (_, index) => ` "w${index}"`).join('')
      );
      assert.equal(many.highlightWords?.length, 10);
    },
  },
  {
    name: 'markWords wraps matches in marks without touching line numbers',
    run: () => {
      const pattern = createWordPattern(['api', 'apiKey', 'a.b']);
      const row: HighlighterNode = {
        type: 'element',
        tagName: 'span',
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['linenumber'] },
            children: [{ type: 'text', value: 'apiKey' }],
          },
          { type: 'text', value: 'const apiKey = a.b + axb;' },
        ],
      };
      const marked = markWords(row, pattern);
      assert.equal(marked.children?.[0], row.children?.[0]);
      const texts = (marked.children ?? [])
        .slice(1)
        .map((child) =>
          child.type === 'element' ? `[${child.children?.[0].value}]` : String(child.value)
        )
        .join('');
      assert.equal(texts, 'const [apiKey] = [a.b] + axb;');
      assert.equal(createWordPattern([]), null);
      assert.equal(markWords(row, null), row);
    },
  },
  {
    name: 'MDX authored line-number visibility survives compilation into CodeBlock',
    run: async () => {
      const html = await compileMdxToHtml('```ts "apiKey" noLineNumbers\nconst apiKey = 1;\n```');
      const { document } = new JSDOM(`<body>${html}</body>`).window;
      assert.deepEqual(readHtmlCodeBlock(document.body.firstElementChild!), {
        language: 'ts',
        code: 'const apiKey = 1;',
        highlightWords: ['apiKey'],
        showLineNumbers: false,
      });
    },
  },
  {
    name: 'MDX <Tabs group> emits a validated sync key',
    run: async () => {
      const grouped = await compileMdxToHtml(
        '<Tabs group="Pkg">\n  <Tab label="a">x</Tab>\n</Tabs>'
      );
      assert.match(grouped, /<div class="papers-tabs" data-tabs-group="pkg">/);
      const invalid = await compileMdxToHtml(
        '<Tabs group="no spaces!">\n  <Tab label="a">x</Tab>\n</Tabs>'
      );
      assert.doesNotMatch(invalid, /data-tabs-group/);
    },
  },
  {
    name: ':::steps and :::cards render numbered steps and safe link cards',
    run: async () => {
      const steps = await render(':::steps\n1. One\n2. Two\n:::');
      assert.match(steps.html, /^<div class="papers-steps"><ol>\s*<li>One<\/li>/);
      const cards = await render(
        ':::cards\n::card [Go](/docs/x)\nBody\n::card [Bad](javascript:alert(1))\nB\n::card Plain\nC\n:::'
      );
      assert.match(cards.html, /^<div class="papers-card-grid">/);
      assert.match(
        cards.html,
        /<p class="papers-card__title papers-card__title--link"><a href="\/docs\/x">Go<\/a><\/p><p>Body<\/p>/
      );
      assert.match(cards.html, /<p class="papers-card__title">Bad<\/p>/);
      assert.doesNotMatch(cards.html, /javascript:/);
      assert.match(cards.html, /<p class="papers-card__title">Plain<\/p>/);
    },
  },
  {
    name: 'sanitizeCardHref only allows site paths and https URLs',
    run: () => {
      assert.equal(sanitizeCardHref('/docs/a#b'), '/docs/a#b');
      assert.equal(sanitizeCardHref('https://example.com/x'), 'https://example.com/x');
      for (const bad of ['//evil.com', 'javascript:alert(1)', 'http://x', 'data:text/html,x', '']) {
        assert.equal(sanitizeCardHref(bad), null, bad);
      }
    },
  },
  {
    name: 'MDX <Steps>, <CardGrid>, and <Card href> render sanitized markup',
    run: async () => {
      const html = await compileMdxToHtml(
        '<Steps>\n\n1. One\n\n</Steps>\n\n<CardGrid>\n  <Card title="Go" href="/docs/x">Body</Card>\n  <Card title="Bad" href="javascript:alert(1)">B</Card>\n</CardGrid>'
      );
      assert.match(html, /<div class="papers-steps"><ol>/);
      assert.match(
        html,
        /<div class="papers-card-grid"><div class="papers-card"><p class="papers-card__title papers-card__title--link"><a href="\/docs\/x">Go<\/a><\/p>/
      );
      assert.match(html, /<p class="papers-card__title">Bad<\/p>/);
      assert.doesNotMatch(html, /javascript:/);
    },
  },
];
