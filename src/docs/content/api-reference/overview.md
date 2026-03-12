# API Reference Overview

This section covers the internal runtime and build APIs that power the template.

It is not a server API. Everything here exists to support a static docs site.

## Runtime Modules

- `src/lib/content.ts`: loads the docs manifest and per-page JSON
- `src/lib/navigation.ts`: flattens the tree, finds adjacent pages, resolves defaults
- `src/hooks/usePagefind.ts`: boots Pagefind and normalizes search results
- `src/providers/ThemeProvider.tsx`: theme, motion, and font state
- `src/components/MarkdownRenderer.tsx`: turns processed HTML into one React tree

## Build Modules

- `scripts/generate-docs.mjs`: writes `public/docs-index.json` and `public/docs-content/**/*.json`
- `scripts/generate-llms.mjs`: writes `public/llms.txt` and `public/llms-full.txt`
- `scripts/generate-pagefind.mjs`: writes the production search index to `dist/pagefind/`

## Generated Artifacts

The runtime depends on:

- `/docs-index.json`
- `/docs-content/**/*.json`
- `/llms.txt`
- `/llms-full.txt`
- `/pagefind/*`

## When To Read This Section

Use the rest of this API reference when you need to:

- change how docs content is loaded
- extend the markdown renderer
- add a custom block type
- adjust build outputs or search generation

## Next Steps

- [Content Pipeline](/docs/api-reference/content-pipeline)
- [Runtime APIs](/docs/api-reference/runtime-apis)
