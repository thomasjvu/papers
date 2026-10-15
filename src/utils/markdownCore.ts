import { Marked, Renderer, type Tokens } from 'marked';
import { markedHighlight } from 'marked-highlight';

import { stripMarkdownBom } from './markdown.ts';
import {
  getDiffLineKind,
  parseDiffLanguage,
  parseCodeFenceInfo,
  parseHighlightLines,
  sanitizeCardHref,
  type CodeFenceInfo,
  type CodeLineKind,
} from '../../shared/codeFence.js';

export {
  getDiffLineKind,
  parseCodeFenceInfo,
  parseDiffLanguage,
  parseHighlightLines,
  sanitizeCardHref,
};
export type { CodeFenceInfo, CodeLineKind };

export interface CodeBlockData {
  language: string;
  code: string;
  label?: string;
  /** Optional filename/caption from a `title="..."` fence attribute. */
  title?: string;
  /** 1-based line numbers to emphasize, from a `{1,3-5}` fence attribute. */
  highlightLines?: number[];
  /** Terms to emphasize wherever they appear, from quoted fence attributes. */
  highlightWords?: string[];
  /** Per-block line-number default from `showLineNumbers` / `noLineNumbers`. */
  showLineNumbers?: boolean;
}

export interface MermaidBlockData {
  chart: string;
}

export interface MarkdownRenderState {
  html: string;
  codeBlocks: Map<string, CodeBlockData[]>;
  mermaidBlocks: Map<string, MermaidBlockData>;
}

interface BuildMarkdownRenderStateOptions {
  createId?: (prefix: string) => string;
}

function defaultCreateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}

export function createCodeBlockSnippets(language: string, code: string): CodeBlockData[] {
  if (!language.includes('|')) {
    return [
      {
        language,
        code: code.trim(),
      },
    ];
  }

  const languages = language.split('|');
  const codeSections = code.split(/^---\s*$/m);

  if (codeSections.length === languages.length) {
    return languages.map((entry, index) => {
      const [languageName, label] = entry.split(':');
      return {
        language: languageName.trim(),
        code: codeSections[index].trim(),
        label: label?.trim(),
      };
    });
  }

  return languages.map((entry) => {
    const [languageName, label] = entry.split(':');
    return {
      language: languageName.trim(),
      code: code.trim(),
      label: label?.trim(),
    };
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Emits a sanitizer-friendly placeholder for TeX. The readable TeX source is kept as
 * text so the page is meaningful before (or without) KaTeX, and the renderer swaps in
 * typeset output client-side.
 */
export function renderMathPlaceholder(tex: string, displayMode: boolean): string {
  const tag = displayMode ? 'div' : 'span';
  const className = displayMode ? 'formula math-display' : 'math-inline';
  const encoded = encodeURIComponent(tex);
  const body = displayMode
    ? `<div class="formula__body">${escapeHtml(tex)}</div>`
    : escapeHtml(tex);
  return `<${tag} class="${className}" data-math-tex="${encoded}" data-math-display="${displayMode}">${body}</${tag}>`;
}

const BLOCK_MATH_PATTERN = /^ {0,3}\$\$[ \t]*\n([\s\S]+?)\n {0,3}\$\$[ \t]*(?:\n+|$)/;
const SINGLE_LINE_BLOCK_MATH_PATTERN = /^ {0,3}\$\$([^\n$]+?)\$\$[ \t]*(?:\n+|$)/;
// Inline: $...$ with no whitespace just inside the delimiters and no digit right after the
// closing $, so prices like "$5 and $10" stay plain text. \$ escapes a literal dollar.
const INLINE_MATH_PATTERN = /^\$(?!\s)((?:\\.|[^\\$\n])+?)(?<!\s)\$(?!\d)/;
const INLINE_DISPLAY_MATH_PATTERN = /^\$\$(?!\s)((?:\\.|[^\\$])+?)\$\$/;

const mathExtensions = [
  {
    name: 'blockMath',
    level: 'block' as const,
    start(src: string) {
      return src.match(/^ {0,3}\$\$/m)?.index;
    },
    tokenizer(src: string) {
      const match = BLOCK_MATH_PATTERN.exec(src) ?? SINGLE_LINE_BLOCK_MATH_PATTERN.exec(src);
      if (!match) {
        return undefined;
      }
      return { type: 'blockMath', raw: match[0], text: match[1].trim() };
    },
    renderer(token: Tokens.Generic) {
      return renderMathPlaceholder(String(token.text), true);
    },
  },
  {
    name: 'inlineMath',
    level: 'inline' as const,
    start(src: string) {
      return src.indexOf('$');
    },
    tokenizer(src: string) {
      const displayMatch = INLINE_DISPLAY_MATH_PATTERN.exec(src);
      if (displayMatch) {
        return {
          type: 'inlineMath',
          raw: displayMatch[0],
          text: displayMatch[1].trim(),
          display: true,
        };
      }
      const match = INLINE_MATH_PATTERN.exec(src);
      if (!match) {
        return undefined;
      }
      return { type: 'inlineMath', raw: match[0], text: match[1], display: false };
    },
    renderer(token: Tokens.Generic) {
      return renderMathPlaceholder(String(token.text), Boolean(token.display));
    },
  },
];

export const ADMONITION_TYPES = ['note', 'tip', 'info', 'warning', 'danger', 'details'] as const;
export type AdmonitionType = (typeof ADMONITION_TYPES)[number];

const ADMONITION_DEFAULT_TITLES: Record<AdmonitionType, string> = {
  note: 'Note',
  tip: 'Tip',
  info: 'Info',
  warning: 'Warning',
  danger: 'Danger',
  details: 'Details',
};

// GitHub-style alerts map onto the same five visual types.
const GITHUB_ALERT_TYPES: Record<string, { type: AdmonitionType; title: string }> = {
  NOTE: { type: 'note', title: 'Note' },
  TIP: { type: 'tip', title: 'Tip' },
  IMPORTANT: { type: 'info', title: 'Important' },
  WARNING: { type: 'warning', title: 'Warning' },
  CAUTION: { type: 'danger', title: 'Caution' },
};

// `:::type Optional title` ... `:::`. Use more colons on the outer fence to nest.
const ADMONITION_PATTERN =
  /^ {0,3}(:{3,})[ \t]*(note|tip|info|warning|danger|details)\b[ \t]*([^\n]*)\n([\s\S]*?)\n? {0,3}\1[ \t]*(?:\n+|$)/i;
const GITHUB_ALERT_PATTERN =
  /^ {0,3}>[ \t]*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n((?: {0,3}>[^\n]*(?:\n|$))*)/i;

type AdmonitionToken = Tokens.Generic & {
  admonitionType: AdmonitionType;
  title: string;
  tokens: Tokens.Generic[];
};

function renderAdmonition(
  this: { parser: { parse: (tokens: Tokens.Generic[]) => string } },
  token: Tokens.Generic
): string {
  const { admonitionType, title, tokens } = token as AdmonitionToken;
  const body = this.parser.parse(tokens);
  if (admonitionType === 'details') {
    // Collapsible callout: native <details>, closed by default, keyboard accessible.
    return `<details class="admonition admonition-details"><summary class="admonition-title">${escapeHtml(title)}</summary><div class="admonition-content">${body}</div></details>\n`;
  }
  return `<div class="admonition admonition-${admonitionType}" role="note" aria-label="${escapeHtml(title)}"><p class="admonition-title">${escapeHtml(title)}</p><div class="admonition-content">${body}</div></div>\n`;
}

const admonitionExtensions = [
  {
    name: 'admonition',
    level: 'block' as const,
    start(src: string) {
      return src.match(/^ {0,3}:{3,}[ \t]*(?:note|tip|info|warning|danger|details)\b/im)?.index;
    },
    tokenizer(
      this: {
        lexer: { blockTokens: (src: string, tokens?: Tokens.Generic[]) => Tokens.Generic[] };
      },
      src: string
    ) {
      const match = ADMONITION_PATTERN.exec(src);
      if (!match) return undefined;
      const admonitionType = match[2].toLowerCase() as AdmonitionType;
      const title = match[3].trim() || ADMONITION_DEFAULT_TITLES[admonitionType];
      return {
        type: 'admonition',
        raw: match[0],
        admonitionType,
        title,
        tokens: this.lexer.blockTokens(match[4], []),
      };
    },
    renderer: renderAdmonition,
  },
  {
    name: 'githubAlert',
    level: 'block' as const,
    start(src: string) {
      return src.match(/^ {0,3}>[ \t]*\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/im)?.index;
    },
    tokenizer(
      this: {
        lexer: { blockTokens: (src: string, tokens?: Tokens.Generic[]) => Tokens.Generic[] };
      },
      src: string
    ) {
      const match = GITHUB_ALERT_PATTERN.exec(src);
      if (!match) return undefined;
      const alert = GITHUB_ALERT_TYPES[match[1].toUpperCase()];
      const inner = match[2]
        .split('\n')
        .map((line) => line.replace(/^ {0,3}>[ \t]?/, ''))
        .join('\n');
      return {
        type: 'githubAlert',
        raw: match[0],
        admonitionType: alert.type,
        title: alert.title,
        tokens: this.lexer.blockTokens(inner, []),
      };
    },
    renderer: renderAdmonition,
  },
];

// `:::tabs [group]` ... `::tab Label` ... `:::` — content tabs. Tabs that share a
// group key stay in sync across the page and site (see ContentTabs.tsx).
const TABS_PATTERN =
  /^ {0,3}(:{3,})[ \t]*tabs\b[ \t]*([^\n]*)\n([\s\S]*?)\n? {0,3}\1[ \t]*(?:\n+|$)/i;
const TAB_MARKER_PATTERN = /^ {0,3}::tab[ \t]+([^\n]+)$/gm;
const TAB_GROUP_PATTERN = /^[a-z0-9][a-z0-9_-]{0,39}$/i;

type TabsToken = Tokens.Generic & {
  group: string | null;
  panels: Array<{ label: string; tokens: Tokens.Generic[] }>;
};

/** Split a tabs body into labelled panels. Text before the first `::tab` is ignored. */
export function splitTabPanels(body: string): Array<{ label: string; content: string }> {
  const markers = Array.from(body.matchAll(TAB_MARKER_PATTERN));
  return markers.map((marker, index) => {
    const start = (marker.index ?? 0) + marker[0].length;
    const end =
      index + 1 < markers.length ? (markers[index + 1].index ?? body.length) : body.length;
    return { label: marker[1].trim(), content: body.slice(start, end).replace(/^\n/, '') };
  });
}

// `:::steps` wraps an ordered list as numbered steps.
const STEPS_PATTERN = /^ {0,3}(:{3,})[ \t]*steps[ \t]*\n([\s\S]*?)\n? {0,3}\1[ \t]*(?:\n+|$)/i;
// `:::cards` holds `::card Title` or `::card [Title](/docs/path)` sections.
const CARDS_PATTERN = /^ {0,3}(:{3,})[ \t]*cards[ \t]*\n([\s\S]*?)\n? {0,3}\1[ \t]*(?:\n+|$)/i;
const CARD_MARKER_PATTERN = /^ {0,3}::card[ \t]+([^\n]+)$/gm;
const CARD_LINK_PATTERN = /^\[([^\]]+)\]\((.+)\)$/;

type BlockLexer = {
  lexer: { blockTokens: (src: string, tokens?: Tokens.Generic[]) => Tokens.Generic[] };
};
type BlockParser = { parser: { parse: (tokens: Tokens.Generic[]) => string } };

/** Split `::card` sections and resolve an optional safe link from `[Title](href)`. */
export function splitCards(
  body: string
): Array<{ title: string; href: string | null; content: string }> {
  const markers = Array.from(body.matchAll(CARD_MARKER_PATTERN));
  return markers.map((marker, index) => {
    const start = (marker.index ?? 0) + marker[0].length;
    const end =
      index + 1 < markers.length ? (markers[index + 1].index ?? body.length) : body.length;
    const label = marker[1].trim();
    const link = CARD_LINK_PATTERN.exec(label);
    return {
      title: link ? link[1].trim() : label,
      href: link ? sanitizeCardHref(link[2]) : null,
      content: body.slice(start, end).replace(/^\n/, ''),
    };
  });
}

const stepsExtension = {
  name: 'steps',
  level: 'block' as const,
  start(src: string) {
    return src.match(/^ {0,3}:{3,}[ \t]*steps\b/im)?.index;
  },
  tokenizer(this: BlockLexer, src: string) {
    const match = STEPS_PATTERN.exec(src);
    if (!match) return undefined;
    return { type: 'steps', raw: match[0], tokens: this.lexer.blockTokens(match[2], []) };
  },
  renderer(this: BlockParser, token: Tokens.Generic) {
    return `<div class="papers-steps">${this.parser.parse(token.tokens as Tokens.Generic[])}</div>\n`;
  },
};

const cardsExtension = {
  name: 'cards',
  level: 'block' as const,
  start(src: string) {
    return src.match(/^ {0,3}:{3,}[ \t]*cards\b/im)?.index;
  },
  tokenizer(this: BlockLexer, src: string) {
    const match = CARDS_PATTERN.exec(src);
    if (!match) return undefined;
    const cards = splitCards(match[2]);
    if (cards.length === 0) return undefined;
    return {
      type: 'cards',
      raw: match[0],
      cards: cards.map((card) => ({ ...card, tokens: this.lexer.blockTokens(card.content, []) })),
    };
  },
  renderer(this: BlockParser, token: Tokens.Generic) {
    const cards = token.cards as Array<{
      title: string;
      href: string | null;
      tokens: Tokens.Generic[];
    }>;
    const body = cards
      .map((card) => {
        const title = escapeHtml(card.title);
        const heading = card.href ? `<a href="${escapeHtml(card.href)}">${title}</a>` : title;
        const titleClass = card.href
          ? 'papers-card__title papers-card__title--link'
          : 'papers-card__title';
        return `<div class="papers-card"><p class="${titleClass}">${heading}</p>${this.parser.parse(card.tokens)}</div>`;
      })
      .join('');
    return `<div class="papers-card-grid">${body}</div>\n`;
  },
};

const tabsExtension = {
  name: 'contentTabs',
  level: 'block' as const,
  start(src: string) {
    return src.match(/^ {0,3}:{3,}[ \t]*tabs\b/im)?.index;
  },
  tokenizer(
    this: { lexer: { blockTokens: (src: string, tokens?: Tokens.Generic[]) => Tokens.Generic[] } },
    src: string
  ) {
    const match = TABS_PATTERN.exec(src);
    if (!match) return undefined;
    const panels = splitTabPanels(match[3]);
    if (panels.length === 0) return undefined;
    const groupCandidate = match[2].trim();
    return {
      type: 'contentTabs',
      raw: match[0],
      group: TAB_GROUP_PATTERN.test(groupCandidate) ? groupCandidate.toLowerCase() : null,
      panels: panels.map((panel) => ({
        label: panel.label,
        tokens: this.lexer.blockTokens(panel.content, []),
      })),
    };
  },
  renderer(
    this: { parser: { parse: (tokens: Tokens.Generic[]) => string } },
    token: Tokens.Generic
  ) {
    const { group, panels } = token as TabsToken;
    const groupAttr = group ? ` data-tabs-group="${escapeHtml(group)}"` : '';
    const body = panels
      .map(
        (panel) =>
          `<div class="md-tabs__panel" data-tab-label="${escapeHtml(panel.label)}">${this.parser.parse(panel.tokens)}</div>`
      )
      .join('');
    return `<div class="md-tabs"${groupAttr}>${body}</div>\n`;
  },
};

function createRenderer(
  codeBlocksData: Map<string, CodeBlockData[]>,
  mermaidBlocksData: Map<string, MermaidBlockData>,
  createId: (prefix: string) => string
): Renderer {
  const renderer = new Renderer();

  renderer.code = (token: Tokens.Code) => {
    const code = token.text || '';
    const fenceInfo = parseCodeFenceInfo(token.lang || '');
    const language = fenceInfo.language;

    if (language === 'mermaid') {
      const blockId = createId('mermaid');
      mermaidBlocksData.set(blockId, { chart: code.trim() });
      return `<div data-mermaid-id="${blockId}" class="mermaid-placeholder"></div>`;
    }

    // Display math: ```math / ```formula fences render with KaTeX on the client.
    if (language === 'math' || language === 'formula') {
      return renderMathPlaceholder(code.trim(), true);
    }

    if (language === 'ColorPalette') {
      const blockId = createId('colorpalette');

      try {
        const paletteData = JSON.parse(code);
        return `<div data-colorpalette-id="${blockId}" data-palette='${JSON.stringify(paletteData)}' class="color-palette-placeholder"></div>`;
      } catch {
        return '<div class="notification notification-error">Invalid ColorPalette JSON format</div>';
      }
    }

    if (language === 'html' || language === 'css') {
      const liveExampleId = createId('liveexample');
      return `<div data-liveexample-id="${liveExampleId}" data-language="${language}" data-code="${encodeURIComponent(code)}" class="live-example-placeholder"></div>`;
    }

    const blockId = createId('codeblock');
    const snippets = createCodeBlockSnippets(language, code);
    for (const snippet of snippets) {
      if (fenceInfo.title) snippet.title = fenceInfo.title;
      if (fenceInfo.highlightLines) snippet.highlightLines = [...fenceInfo.highlightLines];
      if (fenceInfo.highlightWords) snippet.highlightWords = [...fenceInfo.highlightWords];
      if (fenceInfo.showLineNumbers !== undefined) {
        snippet.showLineNumbers = fenceInfo.showLineNumbers;
      }
    }
    codeBlocksData.set(blockId, snippets);
    return `<div data-codeblock-id="${blockId}" class="code-block-placeholder"></div>`;
  };

  return renderer;
}

export async function buildMarkdownRenderState(
  content: string,
  options: BuildMarkdownRenderStateOptions = {}
): Promise<MarkdownRenderState> {
  const codeBlocksData = new Map<string, CodeBlockData[]>();
  const mermaidBlocksData = new Map<string, MermaidBlockData>();
  const createId = options.createId ?? defaultCreateId;
  const markdownProcessor = new Marked(
    markedHighlight({
      highlight: (code: string) => code,
    }),
    {
      gfm: true,
      breaks: false,
      pedantic: false,
      renderer: createRenderer(codeBlocksData, mermaidBlocksData, createId),
    }
  );
  markdownProcessor.use({
    extensions: [
      tabsExtension,
      stepsExtension,
      cardsExtension,
      ...admonitionExtensions,
      ...mathExtensions,
    ],
  });

  const html = await markdownProcessor.parse(stripMarkdownBom(content));

  return {
    html,
    codeBlocks: new Map(
      Array.from(codeBlocksData.entries(), ([blockId, snippets]) => [
        blockId,
        snippets.map((snippet) => ({ ...snippet })),
      ])
    ),
    mermaidBlocks: new Map(
      Array.from(mermaidBlocksData.entries(), ([blockId, block]) => [blockId, { ...block }])
    ),
  };
}
