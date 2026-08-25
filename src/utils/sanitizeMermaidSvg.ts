import DOMPurify from 'dompurify';

const MERMAID_SANITIZE_CONFIG = {
  USE_PROFILES: { svg: true, svgFilters: false },
  ALLOW_UNKNOWN_PROTOCOLS: false,
  FORBID_TAGS: ['foreignObject', 'iframe', 'object', 'embed', 'script', 'style'],
  ALLOWED_URI_REGEXP: /^(?:#|$)/,
};

export function sanitizeMermaidSvg(svg: string): string {
  if (typeof window === 'undefined') {
    throw new Error('Mermaid SVG sanitization requires a browser document.');
  }

  const purifier = typeof DOMPurify.sanitize === 'function' ? DOMPurify : DOMPurify(window);

  return purifier.sanitize(svg, MERMAID_SANITIZE_CONFIG);
}
