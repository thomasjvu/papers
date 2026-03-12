import { Marked, Renderer, type Tokens } from 'marked';
import { markedHighlight } from 'marked-highlight';

import { stripMarkdownBom } from './markdown.ts';

export interface CodeBlockData {
  language: string;
  code: string;
  label?: string;
}

export interface MarkdownRenderState {
  html: string;
  codeBlocks: Map<string, CodeBlockData[]>;
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

function createRenderer(
  codeBlocksData: Map<string, CodeBlockData[]>,
  createId: (prefix: string) => string
): Renderer {
  const renderer = new Renderer();

  renderer.code = (token: Tokens.Code) => {
    const code = token.text || '';
    const language = token.lang || 'text';

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
  const createId = options.createId ?? defaultCreateId;
  const markdownProcessor = new Marked(
    markedHighlight({
      highlight: (code: string) => code,
    }),
    {
      gfm: true,
      breaks: false,
      pedantic: false,
      renderer: createRenderer(codeBlocksData, createId),
    }
  );

  const html = await markdownProcessor.parse(stripMarkdownBom(content));

  return {
    html,
    codeBlocks: new Map(
      Array.from(codeBlocksData.entries(), ([blockId, snippets]) => [
        blockId,
        snippets.map((snippet) => ({ ...snippet })),
      ])
    ),
  };
}
