/**
 * Declarative MDX component contract.
 *
 * These descriptors are intentionally data-only. A collection can enable a
 * subset of the built-in components, but it cannot register executable
 * renderer code in the content pipeline.
 */

export const MDX_COMPONENT_REGISTRY = Object.freeze({
  Callout: Object.freeze({
    allowedProps: Object.freeze(['type', 'title']),
    output: 'sanitized callout div',
  }),
  Tabs: Object.freeze({
    allowedProps: Object.freeze(['group']),
    output: 'sanitized details group',
  }),
  Tab: Object.freeze({
    allowedProps: Object.freeze(['label']),
    output: 'sanitized details panel',
  }),
  Card: Object.freeze({
    allowedProps: Object.freeze(['title']),
    output: 'sanitized card div',
  }),
  CharacterNote: Object.freeze({
    allowedProps: Object.freeze(['type', 'title']),
    output: 'sanitized character note div',
  }),
});

export const SUPPORTED_MDX_COMPONENT_NAMES = Object.freeze(Object.keys(MDX_COMPONENT_REGISTRY));

export function normalizeMdxComponentNames(names) {
  if (names === undefined) {
    return [...SUPPORTED_MDX_COMPONENT_NAMES];
  }

  if (!Array.isArray(names)) {
    throw new Error('`mdxComponents` must be an array of supported component names.');
  }

  return Array.from(new Set(names));
}
