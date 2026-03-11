# Content Pipeline

The content pipeline converts Markdown source files into static artifacts the app can ship directly.

## Inputs

- `shared/documentation-config.js`
- `src/docs/content/**/*.md`

## Generators

### `scripts/generate-docs.mjs`

Creates:

- `public/docs-index.json`
- `public/docs-content/**/*.json`

### `scripts/generate-llms.mjs`

Creates:

- `public/llms.txt`
- `public/llms-full.txt`

### `scripts/generate-pagefind.mjs`

Builds the Pagefind index from the production `dist/` output.

## Output Shape

`docs-index.json` looks like this:

```json
{
  "generated": "2026-03-11T00:00:00.000Z",
  "paths": ["getting-started/introduction"],
  "count": 1,
  "titles": {
    "getting-started/introduction": "Introduction"
  }
}
```

Each page is written separately, for example `public/docs-content/getting-started/introduction.json`:

```json
{
  "path": "getting-started/introduction",
  "title": "Introduction",
  "content": "# Introduction\n..."
}
```

## Runtime Rendering Flow

Once a page is fetched, the docs app renders it in two stages:

1. `src/utils/markdownCore.ts` converts Markdown into HTML plus placeholder metadata for richer blocks.
2. `src/utils/MarkdownProcessor.tsx` adds standard classes, heading IDs, and sanitization.
3. `src/components/MarkdownRenderer.tsx` turns the HTML into one React tree and swaps placeholders for real components.

That is how code fences, live previews, wallet copy blocks, and color palettes stay interactive without `dangerouslySetInnerHTML` roots all over the page.

## Custom Component Extension Points

There are two supported ways to add your own component behavior.

### 1. Fenced Markdown Components

Use this for things like `ColorPalette` or any future custom block syntax.

- detect the language in `buildMarkdownRenderState()`
- emit a placeholder element with the data your React component needs
- map that placeholder back to a component in `MarkdownRenderer.tsx`

### 2. Semantic HTML Upgrades

Use this when normal HTML in Markdown should become a richer component at render time.

The wallet block is the built-in example:

```html
<code
  class="wallet-address"
  data-address="0x742d35Cc6634C0532925a3b844Bc9e7595f8fA6B"
  data-chain="eth"
>
  0x742d35Cc6634C0532925a3b844Bc9e7595f8fA6B
</code>
```

`MarkdownRenderer.tsx` detects that shape and renders a themed wallet component with a chain icon and copy affordance.

## When It Runs

The full build runs generators in this order:

1. `generate:llms`
2. `generate:docs`
3. `vite build`
4. `generate:pagefind`

## Why This Design Works

- works on static hosts
- loads a tiny manifest before fetching page content
- keeps deployment simple
- makes AI exports a first-class build artifact
- gives you clear hooks for adding custom interactive docs components

## Related Reading

For the rest of the runtime details, keep following the docs in this app rather than relying on extra root-level markdown files.

## Next Steps

- [Runtime APIs](/docs/api-reference/runtime-apis)
- [Code Examples](/docs/developer-guides/code-examples)
