import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';

import {
  classifyMarkdownElement,
  detectChainFromAddress,
  getElementProps,
  type MarkdownElementLookups,
} from '../src/utils/markdownElements.ts';

function el(html: string): Element {
  const { document } = new JSDOM(`<body>${html}</body>`).window;
  const element = document.body.firstElementChild;
  assert.ok(element, `no element in ${html}`);
  return element;
}

const lookups: MarkdownElementLookups = {
  hasCodeBlock: (id) => id === 'code-1',
  hasMermaidBlock: (id) => id === 'mer-1',
  resolveInternal: (href) => (href.startsWith('/docs/') ? `${href}#resolved` : null),
};

const classify = (html: string) => classifyMarkdownElement(el(html), lookups);

export const markdownElementsTests = [
  {
    name: 'detectChainFromAddress recognises btc, solana and falls back to eth',
    run: () => {
      assert.equal(detectChainFromAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'), 'btc');
      assert.equal(detectChainFromAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'), 'btc');
      assert.equal(detectChainFromAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'), 'btc');
      assert.equal(detectChainFromAddress('So11111111111111111111111111111111111111112'), 'solana');
      assert.equal(detectChainFromAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e'), 'eth');
      assert.equal(detectChainFromAddress('bc1short'), 'eth');
      assert.equal(detectChainFromAddress(''), 'eth');
    },
  },
  {
    name: 'getElementProps maps DOM attributes onto React prop names',
    run: () => {
      assert.deepEqual(
        getElementProps(
          el(
            '<input class="c" for="f" tabindex="2" checked readonly="readonly" disabled="no" data-x="y">'
          ),
          'k'
        ),
        {
          key: 'k',
          className: 'c',
          htmlFor: 'f',
          tabIndex: 2,
          checked: true,
          readOnly: true,
          disabled: false,
          'data-x': 'y',
        }
      );
      assert.deepEqual(getElementProps(el('<details open="open"></details>'), 'd'), {
        key: 'd',
        open: true,
      });
      assert.deepEqual(getElementProps(el('<option selected="x"></option>'), 'o'), {
        key: 'o',
        selected: false,
      });
    },
  },
  {
    name: 'classifyMarkdownElement reads md-tabs panels and skips empty tab sets',
    run: () => {
      const result = classify(
        '<div class="md-tabs" data-tabs-group="pm"><div class="md-tabs__panel" data-tab-label="npm">a</div><p>x</p><div class="md-tabs__panel">b</div></div>'
      );
      assert.equal(result.kind, 'tabs');
      if (result.kind !== 'tabs') return;
      assert.equal(result.group, 'pm');
      assert.deepEqual(
        result.panels.map((panel) => [panel.label, panel.element.textContent]),
        [
          ['npm', 'a'],
          ['Tab 2', 'b'],
        ]
      );
      const ungrouped = classify('<div class="md-tabs"><div class="md-tabs__panel"></div></div>');
      assert.equal(ungrouped.kind === 'tabs' && ungrouped.group, null);
      assert.deepEqual(classify('<div class="md-tabs"><p>x</p></div>'), { kind: 'skip' });
    },
  },
  {
    name: 'classifyMarkdownElement resolves code and mermaid ids only when the block exists',
    run: () => {
      assert.deepEqual(classify('<div data-codeblock-id="code-1"></div>'), {
        kind: 'codeblock',
        blockId: 'code-1',
      });
      assert.deepEqual(classify('<div data-codeblock-id="nope"></div>'), { kind: 'skip' });
      assert.deepEqual(classify('<div data-codeblock-id=""></div>'), { kind: 'skip' });
      assert.deepEqual(classify('<div data-mermaid-id="mer-1"></div>'), {
        kind: 'mermaid',
        blockId: 'mer-1',
      });
      assert.deepEqual(classify('<div data-mermaid-id="nope"></div>'), { kind: 'skip' });
      assert.deepEqual(classify('<div data-mermaid-id=""></div>'), { kind: 'skip' });
    },
  },
  {
    name: 'classifyMarkdownElement parses palettes and reports bad JSON',
    run: () => {
      assert.deepEqual(
        classify(`<div data-colorpalette-id="p" data-palette='{"colors":[{"name":"a"}]}'></div>`),
        { kind: 'palette', colors: [{ name: 'a' }] }
      );
      assert.deepEqual(classify('<div data-colorpalette-id="p"></div>'), { kind: 'skip' });
      const bad = classify('<div data-colorpalette-id="p" data-palette="{oops"></div>');
      assert.equal(bad.kind, 'palette-error');
      assert.ok(bad.kind === 'palette-error' && bad.error instanceof SyntaxError);
    },
  },
  {
    name: 'classifyMarkdownElement decodes math on divs and spans with a text fallback',
    run: () => {
      assert.deepEqual(classify('<div data-math-tex="a%2Bb" data-math-display="true"></div>'), {
        kind: 'math',
        tex: 'a+b',
        displayMode: true,
      });
      assert.deepEqual(classify('<span data-math-tex="x" data-math-display="false"></span>'), {
        kind: 'math',
        tex: 'x',
        displayMode: false,
      });
      assert.deepEqual(classify('<span data-math-tex="%E0%A4%A">raw</span>'), {
        kind: 'math',
        tex: 'raw',
        displayMode: false,
      });
      assert.deepEqual(classify('<span data-math-tex="%E0%A4%A"></span>'), {
        kind: 'math',
        tex: '',
        displayMode: false,
      });
      assert.deepEqual(classify('<p data-math-tex="x"></p>'), { kind: 'element' });
    },
  },
  {
    name: 'classifyMarkdownElement decodes live examples and needs language and code',
    run: () => {
      assert.deepEqual(
        classify('<div data-liveexample-id="l" data-language="html" data-code="%3Cb%3E"></div>'),
        { kind: 'live-example', code: '<b>', language: 'html' }
      );
      assert.deepEqual(classify('<div data-liveexample-id="l" data-code="x"></div>'), {
        kind: 'skip',
      });
      assert.deepEqual(classify('<div data-liveexample-id="l" data-language="js"></div>'), {
        kind: 'skip',
      });
      const bad = classify(
        '<div data-liveexample-id="l" data-language="js" data-code="%E0%A4%A"></div>'
      );
      assert.equal(bad.kind, 'live-example-error');
      assert.ok(bad.kind === 'live-example-error' && bad.error instanceof URIError);
    },
  },
  {
    name: 'classifyMarkdownElement checks div placeholders in renderer order',
    run: () => {
      assert.equal(
        classify(
          '<div class="md-tabs" data-codeblock-id="code-1"><div class="md-tabs__panel"></div></div>'
        ).kind,
        'tabs'
      );
      assert.equal(
        classify('<div data-codeblock-id="nope" data-mermaid-id="mer-1"></div>').kind,
        'skip'
      );
      assert.equal(
        classify('<div data-colorpalette-id="p" data-mermaid-id="mer-1"></div>').kind,
        'skip'
      );
      assert.equal(
        classify('<div data-mermaid-id="mer-1" data-math-tex="x"></div>').kind,
        'mermaid'
      );
      assert.equal(classify('<div data-math-tex="x" data-liveexample-id="l"></div>').kind, 'math');
      assert.deepEqual(classify('<div class="plain"></div>'), { kind: 'element' });
      assert.deepEqual(classify('<span data-codeblock-id="code-1"></span>'), { kind: 'element' });
    },
  },
  {
    name: 'classifyMarkdownElement labels headings h1-h6 only',
    run: () => {
      assert.deepEqual(classify('<h2 id="intro">Intro</h2>'), {
        kind: 'heading',
        headingId: 'intro',
        label: 'Intro',
      });
      assert.deepEqual(classify('<h6></h6>'), {
        kind: 'heading',
        headingId: null,
        label: 'section',
      });
      assert.deepEqual(classify('<h1>T</h1>').kind, 'heading');
      assert.deepEqual(classify('<h7>x</h7>'), { kind: 'element' });
      assert.deepEqual(classify('<header>x</header>'), { kind: 'element' });
    },
  },
  {
    name: 'classifyMarkdownElement picks download, copy, route or plain links in that order',
    run: () => {
      assert.deepEqual(classify('<a href="/f.zip" data-file="f.zip" data-url="u">x</a>'), {
        kind: 'download-link',
        href: '/f.zip',
        file: 'f.zip',
      });
      assert.deepEqual(classify('<a data-file="f.zip">x</a>'), {
        kind: 'download-link',
        href: '#',
        file: 'f.zip',
      });
      assert.deepEqual(classify('<a href="/docs/a" class="c" data-url="https://u">x</a>'), {
        kind: 'copy-link',
        href: '/docs/a',
        url: 'https://u',
        className: 'c',
      });
      assert.deepEqual(classify('<a href="/x" data-url="https://u">x</a>'), {
        kind: 'copy-link',
        href: '/x',
        url: 'https://u',
        className: '',
      });
      assert.deepEqual(classify('<a href="/docs/a" class="c" title="T">x</a>'), {
        kind: 'route-link',
        href: '/docs/a#resolved',
        className: 'c',
        title: 'T',
      });
      assert.deepEqual(classify('<a href="/docs/b" title="">x</a>'), {
        kind: 'route-link',
        href: '/docs/b#resolved',
        className: '',
        title: undefined,
      });
      assert.deepEqual(classify('<a href="https://example.com">x</a>'), { kind: 'link' });
      const seen: string[] = [];
      classifyMarkdownElement(el('<a>x</a>'), {
        ...lookups,
        resolveInternal: (href) => (seen.push(href), null),
      });
      assert.deepEqual(seen, ['#']);
    },
  },
  {
    name: 'classifyMarkdownElement reads wallet addresses from data or text',
    run: () => {
      assert.deepEqual(
        classify('<code class="wallet-address x" data-address="0xA" data-chain="eth">short</code>'),
        {
          kind: 'wallet',
          address: '0xA',
          chain: 'eth',
          className: 'wallet-address x',
          text: 'short',
        }
      );
      assert.deepEqual(classify('<code class="wallet-address">0xB</code>'), {
        kind: 'wallet',
        address: '0xB',
        chain: undefined,
        className: 'wallet-address',
        text: '0xB',
      });
      assert.deepEqual(classify('<code class="wallet-address" data-chain=""></code>'), {
        kind: 'wallet',
        address: '',
        chain: undefined,
        className: 'wallet-address',
        text: '',
      });
      assert.deepEqual(classify('<code>0xC</code>'), { kind: 'element' });
      assert.deepEqual(classify('<span class="wallet-address">0xC</span>'), { kind: 'element' });
    },
  },
];
