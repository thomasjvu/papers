import DOMPurify from 'dompurify';

type KatexModule = Pick<typeof import('katex').default, 'renderToString'>;

let katexPromise: Promise<KatexModule> | null = null;

/** Lazily loads KaTeX (and its stylesheet) only on pages that contain math. */
export function loadKatex(): Promise<KatexModule> {
  if (!katexPromise) {
    katexPromise = Promise.all([import('katex'), import('../styles-katex.css')]).then(
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

/**
 * Replaces `[data-math-tex]` placeholders inside static HTML (MDX output) with KaTeX
 * output. The TeX source stays visible until KaTeX loads or if it fails.
 */
export async function hydrateMathPlaceholders(
  root: ParentNode,
  isCancelled: () => boolean = () => false
): Promise<number> {
  const placeholders = Array.from(
    root.querySelectorAll<HTMLElement>('[data-math-tex]:not([data-math-rendered="true"])')
  );
  if (placeholders.length === 0) {
    return 0;
  }
  const katex = await loadKatex();
  if (isCancelled()) {
    return 0;
  }
  for (const element of placeholders) {
    let tex: string;
    try {
      tex = decodeURIComponent(element.dataset.mathTex || '');
    } catch {
      continue;
    }
    const displayMode = element.dataset.mathDisplay === 'true';
    const html = renderTexToHtml(katex, tex, displayMode);
    const target = displayMode
      ? (element.querySelector<HTMLElement>('.formula__body') ?? element)
      : element;
    target.innerHTML = html;
    element.dataset.mathRendered = 'true';
  }
  return placeholders.length;
}
