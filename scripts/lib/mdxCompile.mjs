import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

import { remarkMdxShortcodes, validateMdxComponents } from './mdxShortcodes.mjs';

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), ['className']],
    div: [
      ...(defaultSchema.attributes?.div || []),
      ['className', /^(papers-(callout|tabs|card|character-note)|formula|math-display)/],
      'dataCallout',
      'dataMathTex',
      'dataMathDisplay',
      'role',
    ],
    img: [
      ...(defaultSchema.attributes?.img || []),
      ['className', /^papers-character-note/],
      'src',
      'alt',
      'width',
      'height',
      'loading',
      'decoding',
    ],
    details: [...(defaultSchema.attributes?.details || []), ['className', /^papers-tabs/], 'open'],
    summary: [...(defaultSchema.attributes?.summary || []), ['className', /^papers-tabs/]],
    // Math placeholders, typeset client-side by KaTeX (see src/utils/renderMath.ts).
    span: [
      ...(defaultSchema.attributes?.span || []),
      ['className'],
      'dataMathTex',
      'dataMathDisplay',
    ],
    p: [
      ...(defaultSchema.attributes?.p || []),
      ['className', /^papers-(callout|card|character-note)/],
    ],
    a: [...(defaultSchema.attributes?.a || []), ['target', 'rel']],
  },
  tagNames: [...(defaultSchema.tagNames || []), 'details', 'summary'],
};

function collectText(node) {
  if (!node) {
    return '';
  }

  if (node.type === 'text') {
    return node.value;
  }

  if (!Array.isArray(node.children)) {
    return '';
  }

  return node.children.map(collectText).join(' ');
}

function stripCalloutMarker(node, markerPattern) {
  if (!node?.children) {
    return;
  }

  for (const child of node.children) {
    if (child.type === 'text' && typeof child.value === 'string') {
      child.value = child.value.replace(markerPattern, '').trimStart();
      return;
    }

    stripCalloutMarker(child, markerPattern);
  }
}

/**
 * Turns remark-math nodes ($...$, $$...$$) and ```math / ```formula fences into the
 * same placeholders the Markdown pipeline emits, so both render through KaTeX.
 */
export function remarkMathPlaceholders() {
  const toPlaceholder = (node, tex, displayMode) => {
    const text = { type: 'text', value: tex };
    node.type = displayMode ? 'mathPlaceholderBlock' : 'mathPlaceholderInline';
    node.children = displayMode
      ? [
          {
            type: 'paragraph',
            children: [text],
            data: { hName: 'div', hProperties: { className: 'formula__body' } },
          },
        ]
      : [text];
    node.data = {
      hName: displayMode ? 'div' : 'span',
      hProperties: {
        className: displayMode ? 'formula math-display' : 'math-inline',
        dataMathTex: encodeURIComponent(tex),
        dataMathDisplay: String(displayMode),
      },
    };
  };
  // Same rule as the Markdown pipeline: no whitespace just inside the delimiters and no
  // digit right after the closing $, so "costs $5 or $10" stays plain text.
  const isProseDollars = (node, source) => {
    if (/^\s|\s$/.test(node.value)) return true;
    const end = node.position?.end?.offset;
    return typeof end === 'number' && /\d/.test(source.charAt(end));
  };
  let source = '';
  const visit = (node) => {
    if (node.type === 'inlineMath') {
      if (isProseDollars(node, source)) {
        node.type = 'text';
        node.value = `$${node.value}$`;
        delete node.data;
        return;
      }
      toPlaceholder(node, node.value, false);
      return;
    }
    if (node.type === 'math') {
      toPlaceholder(node, node.value, true);
      return;
    }
    if (node.type === 'code' && (node.lang === 'math' || node.lang === 'formula')) {
      toPlaceholder(node, node.value.trim(), true);
      return;
    }
    node.children?.forEach(visit);
  };
  return (tree, file) => {
    source = String(file?.value ?? '');
    visit(tree);
  };
}

function remarkCallouts() {
  return (tree) => {
    const children = tree.children || [];

    for (const node of children) {
      if (node.type !== 'blockquote') {
        continue;
      }

      const value = collectText(node);
      const match = value.match(/\[!(NOTE|TIP|WARNING|IMPORTANT)\]/i);

      if (!match) {
        continue;
      }

      const tone = match[1].toLowerCase();
      stripCalloutMarker(node, /^\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*/i);

      node.data = {
        hName: 'div',
        hProperties: {
          className: `papers-callout papers-callout--${tone}`,
          dataCallout: tone,
        },
      };
    }
  };
}

export function validateMdxComponentsInSource(source, options = {}) {
  const processor = unified().use(remarkParse).use(remarkMath).use(remarkMdx);
  const tree = processor.parse(source);
  validateMdxComponents(tree, options);
  return tree;
}

export async function compileMdxToHtml(source, options = {}) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkMdx)
    .use(remarkMathPlaceholders)
    .use(remarkCallouts)
    .use(remarkMdxShortcodes, options)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(source);

  return String(file);
}

export function isMdxSourcePath(sourcePath = '') {
  return sourcePath.toLowerCase().endsWith('.mdx');
}
