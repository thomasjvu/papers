import { sanitizeCardHref } from '../../shared/codeFence.js';
import { createAdmonitionNode, defaultAdmonitionTitle, toAdmonitionType } from './mdxAuthoring.mjs';
import { characterNoteAvatars } from '../../shared/character-note-config.js';
import { MDX_COMPONENT_REGISTRY, normalizeMdxComponentNames } from '../../shared/mdxComponents.js';

const CALLOUT_TONES = new Set(['note', 'tip', 'info', 'warning', 'danger', 'important', 'caution']);
const CHARACTER_NOTE_TYPES = new Set(['info', 'warning', 'alert', 'success', 'tip']);

function readJsxAttribute(attributes, name) {
  const attribute = attributes?.find((entry) => entry.name === name);
  if (!attribute) {
    return null;
  }

  if (attribute.type === 'mdxJsxAttribute' && typeof attribute.value === 'string') {
    return attribute.value;
  }

  if (
    attribute.type === 'mdxJsxAttribute' &&
    attribute.value?.type === 'mdxJsxAttributeValueExpression'
  ) {
    return attribute.value.value?.replace(/^['"]|['"]$/g, '') || null;
  }

  return null;
}

function getMdxPosition(node) {
  const start = node?.position?.start;
  return start ? `:${start.line}:${start.column}` : '';
}

function createMdxDiagnostic(message, node) {
  const error = new Error(`MDX${getMdxPosition(node)}: ${message}`);
  if (node?.position?.start?.line) {
    error.lineNumber = node.position.start.line;
    error.columnNumber = node.position.start.column;
  }
  return error;
}

function validateMdxNode(node, allowedComponents) {
  if (node?.type !== 'mdxJsxFlowElement' && node?.type !== 'mdxJsxTextElement') {
    return;
  }

  const descriptor = MDX_COMPONENT_REGISTRY[node.name];
  if (!descriptor || !allowedComponents.has(node.name)) {
    throw createMdxDiagnostic(
      `unsupported component <${node.name}>. Use one of: ${Array.from(allowedComponents).join(', ')}.`,
      node
    );
  }

  const allowedProps = new Set(descriptor.allowedProps);
  for (const attribute of node.attributes || []) {
    if (attribute.type === 'mdxJsxExpressionAttribute') {
      throw createMdxDiagnostic(
        `dynamic JSX attributes are not supported on <${node.name}>; use a quoted value.`,
        node
      );
    }

    if (!allowedProps.has(attribute.name)) {
      throw createMdxDiagnostic(
        `unsupported prop "${attribute.name}" on <${node.name}>. Allowed props: ${descriptor.allowedProps.join(', ') || 'none'}.`,
        node
      );
    }

    if (attribute.value === null || attribute.value === undefined) {
      throw createMdxDiagnostic(
        `prop "${attribute.name}" on <${node.name}> must have a quoted value.`,
        node
      );
    }

    if (typeof attribute.value !== 'string') {
      throw createMdxDiagnostic(
        `prop "${attribute.name}" on <${node.name}> must be a static quoted value.`,
        node
      );
    }
  }
}

export function validateMdxComponents(tree, options = {}) {
  const allowedComponents = new Set(normalizeMdxComponentNames(options.components));

  visitChildren(tree, (node) => {
    validateMdxNode(node, allowedComponents);
    return node;
  });

  return tree;
}

function normalizeChildren(children = []) {
  return children.filter((child) => child.type !== 'mdxTextExpression');
}

function createElement(tagName, properties, children = []) {
  return {
    type: 'paragraph',
    data: {
      hName: tagName,
      hProperties: properties,
    },
    children: normalizeChildren(children),
  };
}

function createVoidElement(tagName, properties) {
  return {
    type: 'paragraph',
    data: {
      hName: tagName,
      hProperties: properties,
    },
    children: [],
  };
}

function transformCallout(node) {
  const tone = (readJsxAttribute(node.attributes, 'type') || 'note').toLowerCase();
  const safeTone = CALLOUT_TONES.has(tone) ? tone : 'note';
  const title = readJsxAttribute(node.attributes, 'title') || defaultAdmonitionTitle(safeTone);
  const admonition = createAdmonitionNode(
    toAdmonitionType(safeTone),
    title,
    [...normalizeChildren(node.children)],
    `papers-callout papers-callout--${safeTone}`
  );
  admonition.data.hProperties.dataCallout = safeTone;
  // Keep the legacy title hook so existing theme CSS still applies.
  admonition.children[0].data.hProperties.className = 'admonition-title papers-callout__title';
  return admonition;
}

function transformTab(node) {
  const label = readJsxAttribute(node.attributes, 'label') || 'Tab';

  return createElement(
    'details',
    {
      className: 'papers-tabs__panel',
      open: true,
    },
    [
      {
        type: 'paragraph',
        data: {
          hName: 'summary',
          hProperties: {
            className: 'papers-tabs__label',
          },
        },
        children: [{ type: 'text', value: label }],
      },
      ...normalizeChildren(node.children),
    ]
  );
}

function collectTabNodes(children = []) {
  const tabs = [];

  for (const child of normalizeChildren(children)) {
    if (
      (child.type === 'mdxJsxFlowElement' || child.type === 'mdxJsxTextElement') &&
      child.name === 'Tab'
    ) {
      tabs.push(child);
      continue;
    }

    if (child.type === 'paragraph' && Array.isArray(child.children)) {
      tabs.push(...collectTabNodes(child.children));
    }
  }

  return tabs;
}

function transformTabs(node) {
  const tabNodes = collectTabNodes(node.children);
  const panels = tabNodes.map((tab) => transformTab(tab));

  const group = (readJsxAttribute(node.attributes, 'group') || '').trim().toLowerCase();
  return createElement(
    'div',
    {
      className: 'papers-tabs',
      // Same key format as Markdown `:::tabs <group>`; invalid keys are dropped.
      ...(/^[a-z0-9][a-z0-9_-]{0,39}$/.test(group) ? { dataTabsGroup: group } : {}),
    },
    panels
  );
}

function transformCharacterNote(node) {
  const type = (readJsxAttribute(node.attributes, 'type') || 'info').toLowerCase();
  const title = readJsxAttribute(node.attributes, 'title');
  const safeType = CHARACTER_NOTE_TYPES.has(type) ? type : 'info';
  const bodyChildren = [...normalizeChildren(node.children)];

  if (title) {
    bodyChildren.unshift({
      type: 'paragraph',
      data: {
        hName: 'p',
        hProperties: {
          className: 'papers-character-note__title',
        },
      },
      children: [{ type: 'text', value: title }],
    });
  }

  const avatar = createVoidElement('img', {
    className: 'papers-character-note__avatar',
    src: characterNoteAvatars[safeType],
    alt: '',
    width: 48,
    height: 48,
    loading: 'lazy',
    decoding: 'async',
  });

  const avatarSlot = createElement(
    'div',
    {
      className: 'papers-character-note__avatar-slot',
    },
    [avatar]
  );

  const body = createElement(
    'div',
    {
      className: 'papers-character-note__body',
    },
    bodyChildren
  );

  return createElement(
    'div',
    {
      className: `papers-character-note papers-character-note--${safeType}`,
      role: 'note',
    },
    [avatarSlot, body]
  );
}

function transformCard(node) {
  const title = readJsxAttribute(node.attributes, 'title');
  const href = sanitizeCardHref(readJsxAttribute(node.attributes, 'href'));
  const children = [...normalizeChildren(node.children)];

  if (title) {
    const titleText = { type: 'text', value: title };
    children.unshift({
      type: 'paragraph',
      data: {
        hName: 'p',
        hProperties: {
          className: href ? 'papers-card__title papers-card__title--link' : 'papers-card__title',
        },
      },
      children: href ? [{ type: 'link', url: href, children: [titleText] }] : [titleText],
    });
  }

  return createElement(
    'div',
    {
      className: 'papers-card',
    },
    children
  );
}

function transformCardGrid(node) {
  return createElement('div', { className: 'papers-card-grid' }, [
    ...normalizeChildren(node.children),
  ]);
}

function transformSteps(node) {
  return createElement('div', { className: 'papers-steps' }, [...normalizeChildren(node.children)]);
}

function transformShortcode(node) {
  if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') {
    return null;
  }

  if (node.type === 'mdxJsxTextElement' && node.name !== 'Tab') {
    return null;
  }

  switch (node.name) {
    case 'Callout':
      return transformCallout(node);
    case 'Tabs':
      return transformTabs(node);
    case 'Tab':
      return transformTab(node);
    case 'Card':
      return transformCard(node);
    case 'CardGrid':
      return transformCardGrid(node);
    case 'Steps':
      return transformSteps(node);
    case 'CharacterNote':
      return transformCharacterNote(node);
    default:
      return null;
  }
}

function visitChildren(node, visitor) {
  if (!Array.isArray(node.children)) {
    return;
  }

  node.children = node.children.map((child) => {
    const replacement = visitor(child);
    const next = replacement || child;

    visitChildren(next, visitor);
    return next;
  });
}

const BLOCK_SHORTCODES = new Set(['Callout', 'Tabs', 'Card', 'CardGrid', 'Steps', 'CharacterNote']);

/**
 * `<Callout>text</Callout>` written on one line parses as a text element inside a
 * paragraph. When a paragraph holds only one block shortcode, promote it to a
 * flow element so it renders as a block instead of an unstyled nested div.
 */
export function hoistInlineBlockShortcodes(node) {
  if (!Array.isArray(node.children)) {
    return;
  }

  node.children = node.children.flatMap((child) => {
    if (child.type === 'paragraph') {
      const meaningful = child.children.filter(
        (leaf) => !(leaf.type === 'text' && leaf.value.trim() === '')
      );
      // A paragraph holding only block shortcodes (e.g. several <Card>s on
      // adjacent lines) becomes those blocks.
      if (
        meaningful.length > 0 &&
        meaningful.every(
          (leaf) => leaf.type === 'mdxJsxTextElement' && BLOCK_SHORTCODES.has(leaf.name)
        )
      ) {
        return meaningful.map((leaf) => {
          const hoisted = { ...leaf, type: 'mdxJsxFlowElement' };
          hoistInlineBlockShortcodes(hoisted);
          return hoisted;
        });
      }
      return [child];
    }
    hoistInlineBlockShortcodes(child);
    return [child];
  });
}

export function remarkMdxShortcodes(options = {}) {
  return (tree) => {
    hoistInlineBlockShortcodes(tree);
    validateMdxComponents(tree, options);
    visitChildren(tree, (node) => {
      const replacement = transformShortcode(node);
      if (replacement) {
        visitChildren(replacement, (child) => transformShortcode(child) || child);
      }

      return replacement;
    });
  };
}
