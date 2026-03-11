# Documentation API

This repo does not expose a server API. Instead, it generates static documentation data that the client runtime consumes.

## Build-Time Outputs

Generated files:

- `public/docs-index.json`: flat index of available docs paths and titles
- `public/docs-content/**/*.json`: per-page Markdown content keyed by docs path
- `public/llms.txt`: concise AI-facing catalog of the documentation
- `public/llms-full.txt`: full combined documentation export
- `public/pagefind/*`: Pagefind search index generated from the built site

These are produced by:

- `scripts/generate-docs.mjs`
- `scripts/generate-llms.mjs`
- `scripts/generate-pagefind.mjs`

## Source Inputs

- `shared/documentation-config.js`: navigation tree and homepage metadata
- `src/docs/content/**/*.md`: Markdown source files

## Runtime Modules

### `src/lib/content.ts`

Provides the main client helpers for loading docs content.

- `loadDocsContent()`
- `getDocument(path)`
- `resolveDocumentPath(slug)`
- `clearContentCache()`

Example:

```ts
import { getDocument } from '../src/lib/content';

const doc = await getDocument('deployment/overview');
```

### `src/lib/navigation.ts`

Builds flattened navigation data, adjacent page links, and tag lookups from the shared docs tree.

### `src/hooks/usePagefind.ts`

Loads the production Pagefind bundle at runtime and returns normalized search results for `/docs/...` and `/llms` routes.

### `src/providers/ThemeProvider.tsx`

Exposes theme, reduced-motion, and font controls to the UI.

## Docs Index Shape

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

## Build Integration

The main scripts wire together like this:

```json
{
  "scripts": {
    "dev": "npm run generate:docs && vite",
    "build": "npm run generate:llms && npm run generate:docs && tsc -b && vite build && npm run generate:pagefind"
  }
}
```

## Notes

- The docs runtime fetches generated JSON from the same origin.
- Search is production-oriented because Pagefind is generated after the static build.
- The generated files should be treated as part of the shipped site, not ignored at deploy time.