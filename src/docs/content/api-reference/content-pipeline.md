# Content Pipeline

The content pipeline turns Markdown source files into static artifacts the app can load directly.

## Inputs

- `shared/documentation-config.js`
- `src/docs/content/**/*.md`
- Vite-resolved env values like `VITE_SITE_URL` and `VITE_SITE_NAME` from `.env*` files or the build environment

## Main Commands

```bash
npm run generate:docs
npm run generate:seo
npm run generate:llms
npm run build
```

## What Each Generator Produces

### `scripts/generate-docs.mjs`

Writes:

- `public/docs-index.json`
- `public/docs-collection.json` — typed native collection metadata and navigation
- `public/docs-references.json` — deterministic internal link graph and backlinks
- `public/docs-content/**/*.json`

Frontmatter is validated against `shared/contentSchema.js`. The supported
fields are typed `title`, `description`, `tags`, `keywords`, `icon`, `order`,
`draft`, `toc`, `full`, and `sidebar` values. A malformed or unsupported field
fails the build with its source line number.

The collection manifest is additive to `docs-index.json`, so existing static
hosts and runtime consumers keep their small index contract while tooling can
use typed entries, source metadata, and the navigation tree.

### `scripts/generate-openapi-artifacts.mjs`

Writes `public/openapi-artifacts.json` from configured local OpenAPI assets.
The artifact extracts operations, parameters, request bodies, responses,
examples, tags, servers, and component schemas for the API overview UI. Local
specs are parsed during the build; allowlisted remote specs remain Scalar
runtime sources and are never fetched by the build.

### `scripts/generate-seo.mjs`

Writes:

- `public/robots.txt`
- `public/sitemap.xml`
- `public/images/og-image.svg`
- `public/images/twitter-card.svg`

### `scripts/generate-route-html.mjs`

Runs after the Vite bundle exists and writes route-specific HTML snapshots into `dist/` with page-level metadata.

### `scripts/generate-llms.mjs`

Writes:

- `public/llms.txt`
- `public/llms-full.txt`

### `scripts/generate-pagefind.mjs`

Runs after the production bundle exists and writes:

- `dist/pagefind/*`

## Important Dev-Mode Detail

The docs app reads generated JSON, not raw Markdown.

If the dev server is already running, rerun `npm run generate:docs` after Markdown or docs-tree changes. Rerun `npm run generate:seo` when site metadata or page descriptions change.

## Runtime Rendering Flow

Once a page is fetched, rendering happens in three steps:

1. `src/utils/markdownCore.ts` parses Markdown and records rich block placeholders.
2. `src/utils/MarkdownProcessor.tsx` adds heading IDs, classes, sanitization, and caching.
3. `src/components/MarkdownRenderer.tsx` turns the processed HTML into one React tree and swaps placeholders for real components.

That is how code fences, live previews, color palettes, and wallet copy blocks stay interactive without extra DOM-walking roots.

## Generated Output Shape

The manifest contains lightweight page metadata. Each page is stored separately as JSON under `public/docs-content/`, so the app can fetch one page at a time instead of loading the full corpus up front.

The reference graph is also consumed at runtime to show which documentation
pages link to the current page. Link validation and graph extraction share the
same parser, so diagnostics and backlinks cannot silently diverge.

## Metadata Rules

- `description:` frontmatter becomes the preferred page summary
- if there is no frontmatter description, the first meaningful paragraph is used
- sitemap and canonical data use `VITE_SITE_URL` when it is set, following Vite mode resolution and host-provided env overrides
- route-level HTML snapshots make social tags and titles available before JavaScript runs

## Custom Component Extension Points

There are two supported extension paths.

### Fenced Markdown Components

Use this when you want a custom code-fence language like `ColorPalette`.

- detect the language in `buildMarkdownRenderState()`
- emit a placeholder element with `data-*` payload
- map that placeholder to a React component in `MarkdownRenderer.tsx`

### Semantic HTML Upgrades

Use this when normal HTML inside Markdown should become a richer component at render time.

The built-in wallet block uses this pattern:

```html
<code
  class="wallet-address"
  data-address="0x742d35Cc6634C0532925a3b844Bc9e7595f8fA6B"
  data-chain="eth"
>
  0x742d35Cc6634C0532925a3b844Bc9e7595f8fA6B
</code>
```

`MarkdownRenderer.tsx` upgrades that markup into a themed copyable wallet component.

## Next Steps

- [Runtime APIs](/docs/api-reference/runtime-apis)
- [Code Examples](/docs/developer-guides/code-examples)
