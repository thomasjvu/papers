import DOMPurify from 'dompurify';

type KatexModule = Pick<typeof import('katex').default, 'renderToString'>;

let katexPromise: Promise<KatexModule> | null = null;

/** Lazily loads KaTeX (and its stylesheet) only on pages that contain math. */
export function loadKatex(): Promise<KatexModule> {
  if (!katexPromise) {
    katexPromise = Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(
      ([module]) => module.default
    );
    katexPromise.catch(() => {
      katexPromise = null;
    });
  }
  return katexPromise;
}

export const KATEX_RENDER_OPTIONS = {
  throwOnError: false,
  // Untrusted content: never allow \href, \url, \includegraphics or \htmlClass etc.
  trust: false,
  strict: 'ignore' as const,
  maxSize: 50,
  maxExpand: 500,
  output: 'htmlAndMathml' as const,
};

const MATH_SANITIZE_CONFIG = {
  USE_PROFILES: { html: true, mathMl: true, svg: true },
  FORBID_TAGS: ['script', 'style', 'foreignObject', 'iframe', 'object', 'embed', 'a', 'img'],
  // Do not set ALLOWED_URI_REGEXP here: DOMPurify applies it to every non-URI attribute
  // and would strip KaTeX's inline `style` sizing. trust:false already disables links.
  FORBID_ATTR: ['href', 'xlink:href', 'src'],
};

export function renderTexToHtml(katex: KatexModule, tex: string, displayMode: boolean): string {
  const html = katex.renderToString(tex, { ...KATEX_RENDER_OPTIONS, displayMode });
  if (typeof window === 'undefined') {
    return html;
  }
  const purifier = typeof DOMPurify.sanitize === 'function' ? DOMPurify : DOMPurify(window);
  return purifier.sanitize(html, MATH_SANITIZE_CONFIG);
}
