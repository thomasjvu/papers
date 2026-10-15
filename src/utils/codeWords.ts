/**
 * Word highlighting for react-syntax-highlighter rows. The highlighter hands its
 * custom `renderer` a tree of { type: 'element' | 'text' } nodes; this wraps
 * every occurrence of the requested terms in a <mark> element without touching
 * the token structure, so syntax colours stay intact.
 */
export type HighlighterNode = {
  type: 'element' | 'text';
  value?: string | number;
  tagName?: string;
  properties?: { className?: string[]; [key: string]: unknown };
  children?: HighlighterNode[];
};

export const CODE_WORD_CLASS = 'code-word-highlight';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function createWordPattern(words: string[]): RegExp | null {
  const unique = Array.from(new Set(words.filter((word) => word.length > 0)));
  if (unique.length === 0) return null;
  // Longest first so overlapping terms prefer the longer match.
  unique.sort((left, right) => right.length - left.length);
  return new RegExp(unique.map(escapeRegExp).join('|'), 'g');
}

function splitText(value: string, pattern: RegExp): HighlighterNode[] {
  const nodes: HighlighterNode[] = [];
  let last = 0;
  pattern.lastIndex = 0;
  for (let match = pattern.exec(value); match; match = pattern.exec(value)) {
    if (match[0].length === 0) {
      pattern.lastIndex += 1;
      continue;
    }
    if (match.index > last) nodes.push({ type: 'text', value: value.slice(last, match.index) });
    nodes.push({
      type: 'element',
      tagName: 'mark',
      properties: { className: [CODE_WORD_CLASS] },
      children: [{ type: 'text', value: match[0] }],
    });
    last = match.index + match[0].length;
  }
  if (last < value.length) nodes.push({ type: 'text', value: value.slice(last) });
  return nodes;
}

/** Return a copy of `node` with matches wrapped. Matches inside one token only. */
export function markWords(node: HighlighterNode, pattern: RegExp | null): HighlighterNode {
  if (!pattern) return node;
  if (!node.children) return node;
  const isLineNumber = node.properties?.className?.includes('linenumber');
  if (isLineNumber) return node;
  return {
    ...node,
    children: node.children.flatMap((child) =>
      child.type === 'text' && typeof child.value === 'string'
        ? splitText(child.value, pattern)
        : [markWords(child, pattern)]
    ),
  };
}
