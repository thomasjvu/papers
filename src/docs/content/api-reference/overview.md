# API Reference Overview

This section documents the internal APIs and generated artifacts that power the template.

It is not a server API. Everything here supports a static docs runtime.

## Main Areas

- content loading in `src/lib/content.ts`
- navigation helpers in `src/lib/navigation.ts`
- search integration in `src/hooks/usePagefind.ts`
- theme and UI providers in `src/providers/`
- build generators in `scripts/`

## Runtime Entry Points

The most useful client helpers are:

- `loadDocsContent()`
- `getDocument(path)`
- `resolveDocumentPath(slug)`
- `usePagefind()`

## Build Entry Points

The important generation scripts are:

- `npm run generate:docs`
- `npm run generate:llms`
- `npm run generate:pagefind`

## Output Files

The runtime depends on:

- `/docs-index.json`
- `/docs-content/**/*.json`
- `/llms.txt`
- `/llms-full.txt`
- `/pagefind/*`

## Next Steps

- [Content Pipeline](/docs/api-reference/content-pipeline)
- [Runtime APIs](/docs/api-reference/runtime-apis)
