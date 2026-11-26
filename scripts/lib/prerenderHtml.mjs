/**
 * Pure helpers for prerendering docs article content into route HTML.
 *
 * The route HTML generator renders each article's already-sanitized HTML into
 * the empty `#root` shell and embeds the article's document JSON next to it,
 * so first paint shows real content and the React app boots without a fetch
 * round-trip. The app replaces the prerendered markup on mount (createRoot,
 * not hydration), so the prerender only has to be readable and structurally
 * close to the interactive render — it is not a second renderer.
 *
 * Everything here is pure string/JSON work, so it is unit-tested in
 * test/prerender-html.test.ts. No filesystem access.
 */

export const INITIAL_DOCS_SCRIPT_ID = 'papers-initial-docs';

/** Skip prerendering an article whose rendered HTML would exceed this size. */
export const PRERENDER_MAX_HTML_BYTES = 200_000;

/**
 * Markdown authoring features the build-time unified pipeline (see
 * scripts/lib/mdxCompile.mjs) does not render faithfully: tabs/steps/cards
 * containers and ColorPalette fences. Articles using them keep the plain SPA
 * shell — the app renders them exactly as before.
 */
const UNSUPPORTED_PRERENDER_PATTERNS = [
  /^ {0,3}:{3,}[ \t]*(tabs|steps|cards)\b/im,
  /^ {0,3}::tab[ \t]/im,
  /^ {0,3}::card[ \t]/im,
  /^ {0,3}```[ \t]*ColorPalette[ \t]*$/im,
];

export function supportsPrerender(document) {
  if (!document || typeof document.content !== 'string' || !document.content.trim()) {
    return false;
  }

  if (document.contentFormat !== 'markdown' && document.contentFormat !== 'html') {
    return false;
  }

  if (document.contentFormat === 'html') {
    return true;
  }

  return !UNSUPPORTED_PRERENDER_PATTERNS.some((pattern) => pattern.test(document.content));
}

/**
 * Shape one generated document into the InitialDocsData the app's DocsPage
 * already accepts as its `initialDocs` prop. Extra artifact fields (toc,
 * metadata, references, links) are dropped so the embedded JSON stays small
 * and exactly matches the runtime type.
 */
export function createInitialDocsData({
  collection,
  docPath,
  version = null,
  locale = null,
  document,
  backlinks = [],
}) {
  return {
    collectionId: collection.id,
    docPath,
    version: version ?? null,
    locale: locale ?? null,
    document: {
      path: document.path || docPath,
      content: document.content,
      title: document.title,
      description: document.description,
      frontmatter: document.frontmatter || {},
      sourcePath: document.sourcePath,
      contentFormat: document.contentFormat || 'markdown',
    },
    backlinks,
  };
}

/** JSON that is safe inside an inline <script type="application/json"> block. */
export function escapeJsonForInlineScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Give each heading in rendered article HTML the id from the document's TOC,
 * in document order. The build pipeline emits no heading ids; without these,
 * anchor links (#section) do nothing before the app mounts.
 */
export function addHeadingIdsFromToc(html, toc = []) {
  if (!Array.isArray(toc) || toc.length === 0) {
    return html;
  }

  let index = 0;
  return String(html).replace(/<h([1-6])([^>]*)>/g, (match, level, attributes) => {
    const entry = toc[index];
    index += 1;

    if (/\sid=/.test(attributes) || !entry?.id) {
      return match;
    }

    return `<h${level}${attributes} id="${entry.id}">`;
  });
}

/**
 * Wrap rendered article HTML in the same content-column shell the app renders
 * (see src/components/ContentRenderer.tsx), so the prerender lands in the
 * right place on the page instead of as a bare full-width block.
 */
export function renderPrerenderArticleHtml(articleHtml) {
  return (
    '<div class="doc-content-shell flex min-h-full flex-col" data-prerender="docs">' +
    '<div class="doc-content doc-content-body flex-1 w-full max-w-4xl mx-auto pt-8 px-6 md:pt-12 md:px-8 lg:pt-16 lg:px-12">' +
    `<div class="markdown-content prose prose-gray dark:prose-invert max-w-none">${articleHtml}</div>` +
    '</div></div>'
  );
}

/**
 * Fill the empty `#root` shell with prerendered article HTML and embed the
 * article's document JSON for the app to boot from. Either part is optional:
 * a route with no prerender keeps its shell, and a route with no document
 * JSON keeps its fetch behaviour.
 */
export function injectPrerender(html, { initialDocs = null, prerenderHtml = null } = {}) {
  let next = String(html);

  if (prerenderHtml) {
    const rootPattern = /<div id="root">\s*<\/div>/;
    if (rootPattern.test(next)) {
      next = next.replace(rootPattern, () => `<div id="root">${prerenderHtml}</div>`);
    }
  }

  if (initialDocs) {
    const script =
      `<script id="${INITIAL_DOCS_SCRIPT_ID}" type="application/json">` +
      `${escapeJsonForInlineScript(initialDocs)}</script>`;

    if (next.includes('</body>')) {
      next = next.replace('</body>', () => `    ${script}\n  </body>`);
    } else {
      next += `\n${script}\n`;
    }
  }

  return next;
}

/**
 * Drop the `preload as="fetch"` link for a document JSON that is now embedded
 * in the page, so the browser does not fetch a file the app will not request.
 * Only the exact href is removed; every other preload is untouched.
 */
export function removeDocumentJsonPreload(html, documentHref) {
  if (!documentHref) {
    return html;
  }

  const escapedHref = String(documentHref).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return String(html).replace(
    new RegExp(`<link rel="preload" as="fetch"[^>]*href="${escapedHref}"[^>]*\\/?>`, 'g'),
    ''
  );
}
