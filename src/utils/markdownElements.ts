/**
 * Pure classification of the placeholder elements emitted by the markdown
 * pipeline. MarkdownRenderer turns each descriptor into a React component;
 * keeping the attribute parsing here lets it be tested without rendering.
 */

const BOOLEAN_ATTRIBUTES = new Set(['checked', 'disabled', 'open', 'readonly', 'selected']);
const HEADING_TAG_PATTERN = /^h[1-6]$/;

export type MarkdownTabPanel = { label: string; element: Element };

export type MarkdownElementDescriptor =
  | { kind: 'skip' }
  | { kind: 'tabs'; group: string | null; panels: MarkdownTabPanel[] }
  | { kind: 'codeblock'; blockId: string }
  | { kind: 'palette'; colors: unknown }
  | { kind: 'palette-error'; error: unknown }
  | { kind: 'mermaid'; blockId: string }
  | { kind: 'math'; tex: string; displayMode: boolean }
  | { kind: 'live-example'; code: string; language: string }
  | { kind: 'live-example-error'; error: unknown }
  | { kind: 'heading'; headingId: string | null; label: string }
  | { kind: 'download-link'; href: string; file: string }
  | { kind: 'copy-link'; href: string; url: string; className: string }
  | { kind: 'route-link'; href: string; className: string; title: string | undefined }
  | { kind: 'link' }
  | {
      kind: 'wallet';
      address: string;
      chain: string | undefined;
      className: string;
      text: string;
    }
  | { kind: 'element' };

export function detectChainFromAddress(address: string): string {
  if (/^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(address)) {
    return 'btc';
  }

  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return 'solana';
  }

  return 'eth';
}

/** Map DOM attributes onto React prop names. */
export function getElementProps(element: Element, key: string): Record<string, unknown> {
  const props: Record<string, unknown> = { key };

  for (const { name, value } of Array.from(element.attributes)) {
    if (name === 'class') {
      props.className = value;
    } else if (name === 'for') {
      props.htmlFor = value;
    } else if (name === 'tabindex') {
      props.tabIndex = Number(value);
    } else if (BOOLEAN_ATTRIBUTES.has(name)) {
      props[name === 'readonly' ? 'readOnly' : name] = value === '' || value === name;
    } else {
      props[name] = value;
    }
  }

  return props;
}

function classifyTabs(element: Element): MarkdownElementDescriptor {
  const panels = Array.from(element.children)
    .filter((child) => child.classList.contains('md-tabs__panel'))
    .map((panel, index) => ({
      label: panel.getAttribute('data-tab-label') || `Tab ${index + 1}`,
      element: panel,
    }));
  if (panels.length === 0) return { kind: 'skip' };
  return { kind: 'tabs', group: element.getAttribute('data-tabs-group'), panels };
}

function classifyPalette(element: Element): MarkdownElementDescriptor {
  const paletteData = element.getAttribute('data-palette');
  if (!paletteData) return { kind: 'skip' };
  try {
    return { kind: 'palette', colors: JSON.parse(paletteData).colors };
  } catch (error) {
    return { kind: 'palette-error', error };
  }
}

function classifyMath(element: Element): MarkdownElementDescriptor {
  let tex: string;
  try {
    tex = decodeURIComponent(element.getAttribute('data-math-tex') || '');
  } catch {
    tex = element.textContent || '';
  }
  return { kind: 'math', tex, displayMode: element.getAttribute('data-math-display') === 'true' };
}

function classifyLiveExample(element: Element): MarkdownElementDescriptor {
  const language = element.getAttribute('data-language');
  const encodedCode = element.getAttribute('data-code');
  if (!language || !encodedCode) return { kind: 'skip' };
  try {
    return { kind: 'live-example', code: decodeURIComponent(encodedCode), language };
  } catch (error) {
    return { kind: 'live-example-error', error };
  }
}

function classifyLink(
  element: Element,
  resolveInternal: (href: string) => string | null
): MarkdownElementDescriptor {
  const href = element.getAttribute('href') || '#';
  const className = element.getAttribute('class') || '';
  const file = element.getAttribute('data-file');
  if (file) return { kind: 'download-link', href, file };
  const url = element.getAttribute('data-url');
  if (url) return { kind: 'copy-link', href, url, className };
  const internalHref = resolveInternal(href);
  if (internalHref) {
    return {
      kind: 'route-link',
      href: internalHref,
      className,
      title: element.getAttribute('title') || undefined,
    };
  }
  return { kind: 'link' };
}

function classifyIdBlock(
  element: Element,
  attribute: 'data-codeblock-id' | 'data-mermaid-id',
  hasBlock: (blockId: string) => boolean
): string | null {
  const blockId = element.getAttribute(attribute);
  return blockId && hasBlock(blockId) ? blockId : null;
}

export type MarkdownElementLookups = {
  hasCodeBlock: (blockId: string) => boolean;
  hasMermaidBlock: (blockId: string) => boolean;
  resolveInternal: (href: string) => string | null;
};

function classifyDiv(
  element: Element,
  lookups: MarkdownElementLookups
): MarkdownElementDescriptor | null {
  if (element.classList.contains('md-tabs')) return classifyTabs(element);
  if (element.hasAttribute('data-codeblock-id')) {
    const blockId = classifyIdBlock(element, 'data-codeblock-id', lookups.hasCodeBlock);
    return blockId ? { kind: 'codeblock', blockId } : { kind: 'skip' };
  }
  if (element.hasAttribute('data-colorpalette-id')) return classifyPalette(element);
  if (element.hasAttribute('data-mermaid-id')) {
    const blockId = classifyIdBlock(element, 'data-mermaid-id', lookups.hasMermaidBlock);
    return blockId ? { kind: 'mermaid', blockId } : { kind: 'skip' };
  }
  if (element.hasAttribute('data-math-tex')) return classifyMath(element);
  if (element.hasAttribute('data-liveexample-id')) return classifyLiveExample(element);
  return null;
}

/** Decide how MarkdownRenderer should render one sanitized markdown element. */
export function classifyMarkdownElement(
  element: Element,
  lookups: MarkdownElementLookups
): MarkdownElementDescriptor {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'div') {
    const descriptor = classifyDiv(element, lookups);
    if (descriptor) return descriptor;
  }
  if (tagName === 'span' && element.hasAttribute('data-math-tex')) return classifyMath(element);
  if (HEADING_TAG_PATTERN.test(tagName)) {
    return {
      kind: 'heading',
      headingId: element.getAttribute('id'),
      label: element.textContent || 'section',
    };
  }
  if (tagName === 'a') return classifyLink(element, lookups.resolveInternal);
  if (tagName === 'code' && element.classList.contains('wallet-address')) {
    const text = element.textContent || '';
    return {
      kind: 'wallet',
      address: element.getAttribute('data-address') || text,
      chain: element.getAttribute('data-chain') || undefined,
      className: element.getAttribute('class') || '',
      text,
    };
  }
  return { kind: 'element' };
}
