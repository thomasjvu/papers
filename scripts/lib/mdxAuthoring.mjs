/**
 * MDX parity for the Markdown authoring features in src/utils/markdownCore.ts:
 * `:::type Title` callouts, GitHub alerts, and code fence metadata
 * (`title="..."`, `{1,3-5}`, `diff`). Output uses the same `admonition-*`
 * classes as Markdown pages and passes through the MDX sanitizer.
 */
import { getDiffLineKind, parseCodeFenceMeta, parseDiffLanguage } from '../../shared/codeFence.js';

export const ADMONITION_TYPES = ['note', 'tip', 'info', 'warning', 'danger', 'details'];

const DEFAULT_TITLES = {
  note: 'Note',
  tip: 'Tip',
  info: 'Info',
  warning: 'Warning',
  danger: 'Danger',
  details: 'Details',
  important: 'Important',
  caution: 'Caution',
};

/** Map any supported tone (including GitHub/`<Callout>` names) to a visual type. */
export function toAdmonitionType(tone) {
  const value = String(tone || '').toLowerCase();
  if (value === 'important') return 'info';
  if (value === 'caution') return 'danger';
  return ADMONITION_TYPES.includes(value) ? value : 'note';
}

export function defaultAdmonitionTitle(tone) {
  return DEFAULT_TITLES[String(tone || '').toLowerCase()] || 'Note';
}

function titleNode(title) {
  return {
    type: 'admonitionTitle',
    data: { hName: 'p', hProperties: { className: 'admonition-title' } },
    children: [{ type: 'text', value: title }],
  };
}

/** Build an mdast node that renders as the shared admonition markup. */
export function createAdmonitionNode(type, title, children, extraClassName = '') {
  if (type === 'details') {
    return {
      type: 'admonition',
      data: {
        hName: 'details',
        hProperties: {
          className: `admonition admonition-details${extraClassName ? ` ${extraClassName}` : ''}`,
        },
      },
      children: [
        {
          type: 'admonitionTitle',
          data: { hName: 'summary', hProperties: { className: 'admonition-title' } },
          children: [{ type: 'text', value: title }],
        },
        {
          type: 'admonitionContent',
          data: { hName: 'div', hProperties: { className: 'admonition-content' } },
          children,
        },
      ],
    };
  }
  return {
    type: 'admonition',
    data: {
      hName: 'div',
      hProperties: {
        className: `admonition admonition-${type}${extraClassName ? ` ${extraClassName}` : ''}`,
        role: 'note',
        ariaLabel: title,
      },
    },
    children: [
      titleNode(title),
      {
        type: 'admonitionContent',
        data: { hName: 'div', hProperties: { className: 'admonition-content' } },
        children,
      },
    ],
  };
}

const OPENER_PATTERN =
  /^(:{3,})[ \t]*(note|tip|info|warning|danger|details)\b[ \t]*([^\n]*)(?:\n|$)/i;

function firstText(node) {
  return node?.type === 'paragraph' && node.children?.[0]?.type === 'text'
    ? node.children[0]
    : null;
}

function lastText(node) {
  const children = node?.type === 'paragraph' ? node.children : null;
  const last = children?.[children.length - 1];
  return last?.type === 'text' ? last : null;
}

function isEmptyParagraph(node) {
  return (
    node.type === 'paragraph' &&
    node.children.every((child) => child.type === 'text' && child.value.trim() === '')
  );
}

function matchOpener(node) {
  const text = firstText(node);
  const match = text ? OPENER_PATTERN.exec(text.value) : null;
  if (!match) return null;
  const type = match[2].toLowerCase();
  const rest = structuredClone(node);
  rest.children[0].value = text.value.slice(match[0].length);
  return {
    colons: match[1].length,
    type,
    title: match[3].trim() || defaultAdmonitionTitle(type),
    rest: isEmptyParagraph(rest) ? null : rest,
  };
}

function matchCloser(node, colons) {
  const text = lastText(node);
  if (!text) return null;
  const pattern = new RegExp(`(?:^|\\n)${':'.repeat(colons)}[ \\t]*$`);
  const match = pattern.exec(text.value);
  if (!match) return null;
  const remaining = structuredClone(node);
  const last = remaining.children[remaining.children.length - 1];
  last.value = last.value.slice(0, match.index).replace(/\s+$/, '');
  if (!last.value) remaining.children.pop();
  return {
    node: remaining.children.length === 0 || isEmptyParagraph(remaining) ? null : remaining,
  };
}

function transformDirectiveChildren(children) {
  const output = [];
  let index = 0;

  while (index < children.length) {
    const node = children[index];
    const opener = matchOpener(node);

    if (!opener) {
      if (Array.isArray(node.children) && node.type !== 'paragraph') {
        node.children = transformDirectiveChildren(node.children);
      }
      output.push(node);
      index += 1;
      continue;
    }

    const collected = [];
    let candidate = opener.rest;
    let cursor = index;
    let closed = false;

    while (true) {
      if (candidate) {
        const closer = matchCloser(candidate, opener.colons);
        if (closer) {
          if (closer.node) collected.push(closer.node);
          closed = true;
          break;
        }
        collected.push(candidate);
      }
      cursor += 1;
      if (cursor >= children.length) break;
      candidate = children[cursor];
    }

    if (!closed) {
      // Unclosed fences stay as authored text.
      output.push(node);
      index += 1;
      continue;
    }

    output.push(
      createAdmonitionNode(opener.type, opener.title, transformDirectiveChildren(collected))
    );
    index = cursor + 1;
  }

  return output;
}

/** `:::type Title` ... `:::` containers. More colons on the outer fence allow nesting. */
export function remarkAdmonitionDirectives() {
  return (tree) => {
    tree.children = transformDirectiveChildren(tree.children || []);
  };
}

/** Render a code node with title/highlight/diff metadata as line-addressable HTML. */
function transformCodeNode(node) {
  const meta = parseCodeFenceMeta(node.meta || '');
  const language = node.lang || 'text';
  const { isDiff } = parseDiffLanguage(language);
  if (
    !meta.title &&
    !meta.highlightLines &&
    !meta.highlightWords &&
    meta.showLineNumbers === undefined &&
    !isDiff
  ) {
    return null;
  }

  const highlighted = new Set(meta.highlightLines || []);
  const lines = String(node.value || '').split('\n');
  const lineNodes = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const kind = getDiffLineKind(line, isDiff);
    const classes = ['papers-code__line'];
    if (highlighted.has(lineNumber)) classes.push('papers-code__line--highlighted');
    if (kind) classes.push(`papers-code__line--${kind}`);
    lineNodes.push({
      type: 'codeLine',
      data: {
        hName: 'span',
        hProperties: { className: classes.join(' '), ...(kind ? { dataLineKind: kind } : {}) },
      },
      children: [{ type: 'text', value: line }],
    });
    if (index < lines.length - 1) lineNodes.push({ type: 'text', value: '\n' });
  });

  const children = [];
  if (meta.title) {
    children.push({
      type: 'codeTitle',
      data: { hName: 'div', hProperties: { className: 'papers-code__title', dataCodeTitle: '' } },
      children: [{ type: 'text', value: meta.title }],
    });
  }
  children.push({
    type: 'codePre',
    data: { hName: 'pre' },
    children: [
      {
        type: 'codeInner',
        data: { hName: 'code', hProperties: { className: `language-${language}` } },
        children: lineNodes,
      },
    ],
  });

  return {
    type: 'codeFigure',
    data: {
      hName: 'div',
      hProperties: {
        className: 'papers-code',
        dataCodeLanguage: language,
        ...(meta.highlightWords
          ? { dataHighlightWords: encodeURIComponent(JSON.stringify(meta.highlightWords)) }
          : {}),
        ...(meta.showLineNumbers !== undefined
          ? { dataLineNumbers: String(meta.showLineNumbers) }
          : {}),
      },
    },
    children,
  };
}

export function remarkCodeMeta() {
  const visit = (node) => {
    if (!Array.isArray(node.children)) return;
    node.children = node.children.map((child) => {
      if (child.type === 'code') return transformCodeNode(child) || child;
      visit(child);
      return child;
    });
  };
  return (tree) => visit(tree);
}
