import DOMPurify from 'dompurify';

import logger from './logger';
import { stripMarkdownBom } from './markdown';
import { buildMarkdownRenderState, type CodeBlockData } from './markdownCore';

const processorLogger = logger;
const MARKDOWN_CACHE_LIMIT = 50;

interface CachedMarkdownResult {
  html: string;
  codeBlocks: Array<[string, CodeBlockData[]]>;
}

const processedMarkdownCache = new Map<string, CachedMarkdownResult>();

function cloneSnippets(snippets: CodeBlockData[]): CodeBlockData[] {
  return snippets.map((snippet) => ({ ...snippet }));
}

function cloneCodeBlocks(codeBlocks: Map<string, CodeBlockData[]>): Map<string, CodeBlockData[]> {
  return new Map(
    Array.from(codeBlocks.entries(), ([blockId, snippets]) => [blockId, cloneSnippets(snippets)])
  );
}

function getCachedMarkdown(normalizedContent: string): CachedMarkdownResult | null {
  const cached = processedMarkdownCache.get(normalizedContent);

  if (!cached) {
    return null;
  }

  processedMarkdownCache.delete(normalizedContent);
  processedMarkdownCache.set(normalizedContent, cached);

  return {
    html: cached.html,
    codeBlocks: cached.codeBlocks.map(([blockId, snippets]) => [blockId, cloneSnippets(snippets)]),
  };
}

function setCachedMarkdown(
  normalizedContent: string,
  html: string,
  codeBlocks: Map<string, CodeBlockData[]>
): void {
  if (processedMarkdownCache.size >= MARKDOWN_CACHE_LIMIT) {
    const oldestCacheKey = processedMarkdownCache.keys().next().value;

    if (typeof oldestCacheKey === 'string') {
      processedMarkdownCache.delete(oldestCacheKey);
    }
  }

  processedMarkdownCache.set(normalizedContent, {
    html,
    codeBlocks: Array.from(codeBlocks.entries(), ([blockId, snippets]) => [
      blockId,
      cloneSnippets(snippets),
    ]),
  });
}

/**
 * Process markdown content and return HTML with code block placeholders
 */
export const processMarkdown = async (
  content: string
): Promise<{ html: string; codeBlocks: Map<string, CodeBlockData[]> }> => {
  try {
    processorLogger.debug('Processing markdown content');

    const normalizedContent = stripMarkdownBom(content);
    const cached = getCachedMarkdown(normalizedContent);

    if (cached) {
      return {
        html: cached.html,
        codeBlocks: new Map(cached.codeBlocks),
      };
    }

    const rawRenderState = await buildMarkdownRenderState(normalizedContent);
    const styledHtml = applyBasicStyles(addHeadingIds(rawRenderState.html));
    const sanitizedHtml = DOMPurify.sanitize(styledHtml, {
      ALLOWED_TAGS: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'hr',
        'ul',
        'ol',
        'li',
        'blockquote',
        'pre',
        'code',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'a',
        'strong',
        'em',
        'u',
        'del',
        'mark',
        'img',
        'div',
        'span',
        'i',
        'button',
      ],
      ALLOWED_ATTR: [
        'href',
        'src',
        'alt',
        'title',
        'class',
        'id',
        'data-codeblock-id',
        'data-address',
        'data-chain',
        'data-file',
        'data-processed',
        'data-liveexample-id',
        'data-language',
        'data-code',
        'data-colorpalette-id',
        'data-palette',
        'data-url',
        'tabindex',
        'aria-label',
        'width',
        'height',
        'target',
        'rel',
      ],
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|\/docs\/):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    });

    setCachedMarkdown(normalizedContent, sanitizedHtml, rawRenderState.codeBlocks);
    processorLogger.debug(`Processed markdown with ${rawRenderState.codeBlocks.size} code blocks`);

    return {
      html: sanitizedHtml,
      codeBlocks: cloneCodeBlocks(rawRenderState.codeBlocks),
    };
  } catch (error) {
    processorLogger.error('Error processing markdown:', error);
    throw error;
  }
};

function createHeadingId(text: string, counts: Map<string, number>): string {
  const baseId =
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section';

  const currentCount = counts.get(baseId) ?? 0;
  counts.set(baseId, currentCount + 1);

  return currentCount === 0 ? baseId : `${baseId}-${currentCount + 1}`;
}

function addHeadingIds(html: string): string {
  const headingCounts = new Map<string, number>();

  return html.replace(
    /<h([1-6])(?![^>]*\sid=)([^>]*)>(.*?)<\/h\1>/g,
    (_match, level, attributes, innerHtml) => {
      const textContent = innerHtml
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const headingId = createHeadingId(textContent, headingCounts);
      return `<h${level}${attributes} id="${headingId}">${innerHtml}</h${level}>`;
    }
  );
}

/**
 * Apply basic styling to HTML elements
 */
const applyBasicStyles = (html: string): string => {
  const styleReplacements: Array<[RegExp, string]> = [
    [/<h1([^>]*)>/g, '<h1$1 class="font-title text-3xl mb-0 mt-8" style="padding: 0;">'],
    [/<h2([^>]*)>/g, '<h2$1 class="font-title text-2xl mb-4 mt-6">'],
    [/<h3([^>]*)>/g, '<h3$1 class="font-title text-xl mb-3 mt-5">'],
    [/<h4([^>]*)>/g, '<h4$1 class="font-title text-lg mb-2 mt-4">'],
    [/<h5([^>]*)>/g, '<h5$1 class="font-title text-base mb-2 mt-3">'],
    [/<h6([^>]*)>/g, '<h6$1 class="font-title text-sm mb-2 mt-3">'],
    [/<p([^>]*)>/g, '<p$1 class="font-body mb-4">'],
    [/<a([^>]*)>/g, '<a$1 class="markdown-link">'],
    [/<ul([^>]*)>/g, '<ul$1 class="list-disc pl-6 mb-4">'],
    [/<ol([^>]*)>/g, '<ol$1 class="list-decimal pl-6 mb-4">'],
    [/<li([^>]*)>/g, '<li$1 class="mb-1">'],
    [/<blockquote([^>]*)>/g, '<blockquote$1 class="markdown-blockquote">'],
    [/<table([^>]*)>/g, '<table$1 class="w-full border-collapse my-4">'],
    [/<th([^>]*)>/g, '<th$1 class="border px-4 py-2 text-left">'],
    [/<td([^>]*)>/g, '<td$1 class="border px-4 py-2">'],
    [/<hr([^>]*)>/g, '<hr$1 class="my-8 border-t">'],
    [/<code(?![^<]*<\/pre>)([^>]*)>/g, '<code$1 class="inline-code">'],
  ];

  let styledHtml = html;
  for (const [regex, replacement] of styleReplacements) {
    styledHtml = styledHtml.replace(regex, replacement);
  }

  return styledHtml;
};

export type { CodeBlockData };
