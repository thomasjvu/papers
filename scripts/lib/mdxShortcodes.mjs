const CALLOUT_TONES = new Set(['note', 'tip', 'warning', 'important']);
const CHARACTER_NOTE_TYPES = new Set(['info', 'warning', 'alert', 'success', 'tip']);

const CHARACTER_NOTE_AVATARS = {
  info: '/images/character-notes/mercenary-info.png',
  warning: '/images/character-notes/mercenary-warning.png',
  alert: '/images/character-notes/mercenary-alert.png',
  success: '/images/character-notes/mercenary-success.png',
  tip: '/images/character-notes/mercenary-tip.png',
};

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
  const title = readJsxAttribute(node.attributes, 'title');
  const safeTone = CALLOUT_TONES.has(tone) ? tone : 'note';
  const children = [...normalizeChildren(node.children)];

  if (title) {
    children.unshift({
      type: 'paragraph',
      data: {
        hName: 'p',
        hProperties: {
          className: 'papers-callout__title',
        },
      },
      children: [{ type: 'text', value: title }],
    });
  }

  return createElement(
    'div',
    {
      className: `papers-callout papers-callout--${safeTone}`,
      dataCallout: safeTone,
    },
    children
  );
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

  return createElement(
    'div',
    {
      className: 'papers-tabs',
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
    src: CHARACTER_NOTE_AVATARS[safeType],
    alt: '',
    width: 96,
    height: 96,
    loading: 'lazy',
    decoding: 'async',
  });

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
    [avatar, body]
  );
}

function transformCard(node) {
  const title = readJsxAttribute(node.attributes, 'title');
  const children = [...normalizeChildren(node.children)];

  if (title) {
    children.unshift({
      type: 'paragraph',
      data: {
        hName: 'p',
        hProperties: {
          className: 'papers-card__title',
        },
      },
      children: [{ type: 'text', value: title }],
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

export function remarkMdxShortcodes() {
  return (tree) => {
    visitChildren(tree, (node) => {
      const replacement = transformShortcode(node);
      if (replacement) {
        visitChildren(replacement, (child) => transformShortcode(child) || child);
      }

      return replacement;
    });
  };
}