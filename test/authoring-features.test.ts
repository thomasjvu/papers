import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

import {
  buildMarkdownRenderState,
  getDiffLineKind,
  parseCodeFenceInfo,
  parseHighlightLines,
  splitTabPanels,
} from '../src/utils/markdownCore.ts';
import { resolveTabIndex } from '../src/lib/tabSync.ts';
import { compileMdxToHtml } from '../scripts/lib/mdxCompile.mjs';
import { readHtmlCodeBlock } from '../src/utils/htmlCodeBlocks.ts';
import { createWordPattern, markWords, type HighlighterNode } from '../src/utils/codeWords.ts';
import { parseCodeFenceMeta, parseDiffLanguage, sanitizeCardHref } from '../shared/codeFence.js';

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
  {
    name: 'readHtmlCodeBlock lifts compiled MDX code into CodeBlock snippets',
    run: async () => {
      const html = await compileMdxToHtml(
        '```ts\nconst a = 1;\n```\n\n```bash title="setup.sh" {2}\nnpm ci\nnpm run build\n```\n\n```diff\n-a\n+b\n```\n\nText.'
      );
      const { document } = new JSDOM(`<body>${html}</body>`).window;
      const blocks = Array.from(document.body.children)
        .map((element) => readHtmlCodeBlock(element))
        .filter(Boolean);
      assert.deepEqual(blocks, [
        { language: 'ts', code: 'const a = 1;' },
        { language: 'bash', code: 'npm ci\nnpm run build', title: 'setup.sh', highlightLines: [2] },
        { language: 'diff', code: '-a\n+b' },
      ]);
      const paragraph = document.querySelector('p');
      assert.equal(paragraph && readHtmlCodeBlock(paragraph), null);
    },
  },
  {
    name: 'markdown :::tabs render labelled panels with an optional group key',
    run: async () => {
      const { html, codeBlocks } = await render(
        ':::tabs pkg\n::tab npm\n```bash\nnpm i\n```\n::tab pnpm\nUse **pnpm**.\n:::'
      );
      assert.match(html, /<div class="md-tabs" data-tabs-group="pkg">/);
      assert.match(html, /<div class="md-tabs__panel" data-tab-label="npm"><div data-codeblock-id/);
      assert.match(html, /data-tab-label="pnpm"><p>Use <strong>pnpm<\/strong>/);
      assert.equal(codeBlocks.size, 1);
      const ungrouped = await render(':::tabs\n::tab A\none\n::tab B\ntwo\n:::');
      assert.match(ungrouped.html, /<div class="md-tabs"><div/);
      const badGroup = await render(':::tabs "><x\n::tab A\none\n:::');
      assert.doesNotMatch(badGroup.html, /data-tabs-group/);
      const escaped = await render(':::tabs\n::tab <b>"x"</b>\none\n:::');
      assert.match(escaped.html, /data-tab-label="&lt;b&gt;&quot;x&quot;&lt;\/b&gt;"/);
      const empty = await render(':::tabs\nno markers\n:::');
      assert.doesNotMatch(empty.html, /md-tabs/);
    },
  },
  {
    name: 'Markdown tabs nest when the outer set uses more colons',
    run: async () => {
      const { html } = await render(
        [
          '::::tabs os',
          '::tab macOS',
          ':::tabs pkg',
          '::tab npm',
          'mac npm',
          '::tab pnpm',
          'mac pnpm',
          ':::',
          '::tab Linux',
          'linux only',
          '::::',
          '',
          'after',
        ].join('\n')
      );
      assert.match(
        html,
        /^<div class="md-tabs" data-tabs-group="os"><div class="md-tabs__panel" data-tab-label="macOS"><div class="md-tabs" data-tabs-group="pkg"><div class="md-tabs__panel" data-tab-label="npm"><p>mac npm<\/p>\n<\/div><div class="md-tabs__panel" data-tab-label="pnpm"><p>mac pnpm<\/p>\n<\/div><\/div>\n<\/div><div class="md-tabs__panel" data-tab-label="Linux"><p>linux only<\/p>\n<\/div><\/div>\n<p>after<\/p>/
      );
    },
  },
  {
    name: 'splitTabPanels and resolveTabIndex handle markers and stale choices',
    run: () => {
      assert.deepEqual(splitTabPanels('intro\n::tab A\none\n::tab B\ntwo'), [
        { label: 'A', content: 'one' },
        { label: 'B', content: 'two' },
      ]);
      // Markers inside an inner container or a code fence stay with that block.
      assert.deepEqual(
        splitTabPanels(
          '::tab Outer\n:::tabs\n::tab Inner\nx\n:::\n```md\n::tab Fenced\n```\n::tab Two\ny'
        ).map((panel) => panel.label),
        ['Outer', 'Two']
      );
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
    name: 'parseDiffLanguage splits diff-<lang> into diff marking plus syntax language',
    run: () => {
      assert.deepEqual(parseDiffLanguage('diff-ts'), { isDiff: true, syntaxLanguage: 'ts' });
      assert.deepEqual(parseDiffLanguage('diff'), { isDiff: true, syntaxLanguage: 'diff' });
      assert.deepEqual(parseDiffLanguage('ts'), { isDiff: false, syntaxLanguage: 'ts' });
      assert.deepEqual(parseDiffLanguage('diff-'), { isDiff: false, syntaxLanguage: 'diff-' });
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
    name: 'MDX code meta carries highlight words and line-number flags to CodeBlock',
    run: async () => {
      const html = await compileMdxToHtml('```ts "apiKey" noLineNumbers\nconst apiKey = 1;\n```');
      const { document } = new JSDOM(`<body>${html}</body>`).window;
      assert.deepEqual(readHtmlCodeBlock(document.body.firstElementChild!), {
        language: 'ts',
        code: 'const apiKey = 1;',
        highlightWords: ['apiKey'],
        showLineNumbers: false,
      });
      const diffTs = await compileMdxToHtml('```diff-ts\n-a\n+b\n```');
      assert.match(diffTs, /data-code-language="diff-ts"/);
      assert.match(diffTs, /data-line-kind="added"/);
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
