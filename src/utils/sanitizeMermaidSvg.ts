import DOMPurify, { type DOMPurify as DOMPurifyInstance } from 'dompurify';

/*
 * Note: DOMPurify's ALLOWED_URI_REGEXP is applied to *every* attribute that is not on its
 * URI-safe list, so a restrictive regex (e.g. /^(?:#|$)/) silently strips geometry such as
 * `d`, `x`, `y`, `width` and `transform`, leaving empty diagrams. Links are instead limited
 * to in-document fragments by a hook on a dedicated DOMPurify instance.
 */
/**
 * Mermaid 11 renders node/edge labels as HTML inside <foreignObject>, and KaTeX labels
 * ($$...$$) as MathML inside those. Allow exactly that (SVG + HTML + MathML) while still
 * removing scripts, styles, event handlers, embedded content, forms and links.
 */
const MERMAID_SANITIZE_CONFIG = {
  USE_PROFILES: { svg: true, svgFilters: false, html: true, mathMl: true },
  ALLOW_UNKNOWN_PROTOCOLS: false,
  ADD_TAGS: ['foreignObject'],
  // DOMPurify only treats annotation-xml as an SVG->HTML switch by default; <foreignObject>
  // is the spec's HTML integration point for SVG.
  HTML_INTEGRATION_POINTS: { foreignobject: true, 'annotation-xml': true },
  FORBID_TAGS: ['iframe', 'object', 'embed', 'script', 'style', 'form', 'input', 'a', 'img'],
  FORBID_ATTR: ['src', 'srcset', 'action', 'formaction'],
};

const LINK_ATTRIBUTES = new Set(['href', 'xlink:href']);

let purifier: DOMPurifyInstance | null = null;
let purifierWindow: Window | null = null;

function getPurifier(): DOMPurifyInstance {
  if (purifier && purifierWindow === window) {
    return purifier;
  }
  const instance = DOMPurify(window);
  instance.addHook('uponSanitizeAttribute', (_node, data) => {
    if (LINK_ATTRIBUTES.has(data.attrName) && !data.attrValue.trim().startsWith('#')) {
      data.keepAttr = false;
    }
  });
  purifier = instance;
  purifierWindow = window;
  return instance;
}

export function chartHasMath(chart: string): boolean {
  return /\$\$[\s\S]+?\$\$/.test(chart);
}

export function sanitizeMermaidSvg(svg: string): string {
  if (typeof window === 'undefined') {
    throw new Error('Mermaid SVG sanitization requires a browser document.');
  }

  return getPurifier().sanitize(svg, MERMAID_SANITIZE_CONFIG) as string;
}
