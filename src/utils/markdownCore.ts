import { Marked, Renderer, type Tokens } from 'marked';
import { markedHighlight } from 'marked-highlight';

import { stripMarkdownBom } from './markdown.ts';

export interface CodeBlockData {
  language: string;
  code: string;
  label?: string;
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

function createRenderer(
  codeBlocksData: Map<string, CodeBlockData[]>,
  mermaidBlocksData: Map<string, MermaidBlockData>,
  createId: (prefix: string) => string
): Renderer {
  const renderer = new Renderer();

  renderer.code = (token: Tokens.Code) => {
    const code = token.text || '';
    const language = token.lang || 'text';

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
    codeBlocksData.set(blockId, createCodeBlockSnippets(language, code));
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
  markdownProcessor.use({ extensions: mathExtensions });

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
