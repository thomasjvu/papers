import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

import { remarkMdxShortcodes } from './mdxShortcodes.mjs';

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), ['className']],
    span: [...(defaultSchema.attributes?.span || []), ['className']],
    div: [
      ...(defaultSchema.attributes?.div || []),
      ['className', /^papers-(callout|tabs|card)/],
      'dataCallout',
    ],
    details: [...(defaultSchema.attributes?.details || []), ['className', /^papers-tabs/], 'open'],
    summary: [...(defaultSchema.attributes?.summary || []), ['className', /^papers-tabs/]],
    p: [...(defaultSchema.attributes?.p || []), ['className', /^papers-(callout|card)/]],
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

export async function compileMdxToHtml(source) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMdx)
    .use(remarkCallouts)
    .use(remarkMdxShortcodes)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(source);

  return String(file);
}

export function isMdxSourcePath(sourcePath = '') {
  return sourcePath.toLowerCase().endsWith('.mdx');
}