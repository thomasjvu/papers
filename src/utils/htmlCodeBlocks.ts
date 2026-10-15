import type { CodeBlockData } from './markdownCore';

/**
 * Read a top-level code block from sanitized MDX HTML so it can render through
 * <CodeBlock> (copy button and syntax colours) like Markdown code blocks.
 * Handles plain `<pre><code class="language-x">` and the `div.papers-code`
 * wrapper emitted for fences with title / {lines} / diff metadata.
 */
function readHighlightWords(encoded: string | null): string[] {
  if (!encoded) return [];
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(encoded));
    return Array.isArray(parsed)
      ? parsed
          .filter((word): word is string => typeof word === 'string' && word.length > 0)
          .slice(0, 10)
      : [];
  } catch {
    return [];
  }
}

export function readHtmlCodeBlock(element: Element): CodeBlockData | null {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'pre') {
    const code = element.firstElementChild;
    if (!code || code.tagName.toLowerCase() !== 'code' || element.children.length !== 1) {
      return null;
    }
    const languageClass = Array.from(code.classList).find((name) => name.startsWith('language-'));
    return {
      language: languageClass ? languageClass.slice('language-'.length) : 'text',
      code: (code.textContent ?? '').replace(/\n$/, ''),
    };
  }

  if (tagName === 'div' && element.classList.contains('papers-code')) {
    const lines = Array.from(element.querySelectorAll('.papers-code__line'));
    if (lines.length === 0) {
      return null;
    }
    const highlightLines = lines
      .map((line, index) =>
        line.classList.contains('papers-code__line--highlighted') ? index + 1 : 0
      )
      .filter((lineNumber) => lineNumber > 0);
    const title = element.querySelector('.papers-code__title')?.textContent?.trim();
    const block: CodeBlockData = {
      language: element.getAttribute('data-code-language') || 'text',
      code: lines.map((line) => line.textContent ?? '').join('\n'),
    };
    if (title) block.title = title;
    const words = readHighlightWords(element.getAttribute('data-highlight-words'));
    if (words.length > 0) block.highlightWords = words;
    const lineNumbers = element.getAttribute('data-line-numbers');
    if (lineNumbers === 'true' || lineNumbers === 'false') {
      block.showLineNumbers = lineNumbers === 'true';
    }
    if (highlightLines.length > 0) block.highlightLines = highlightLines;
    return block;
  }

  return null;
}
