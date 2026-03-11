# Introduction

`papers` is a static documentation template for teams that want a polished docs site without standing up a backend.

It combines React Router for client-side navigation, generated Markdown content files, Pagefind search, and `llms.txt` exports in a single Vite build.

## What You Get

- A homepage and docs layout driven by `shared/documentation-config.js`
- Markdown source content under `src/docs/content/`
- Generated `docs-index.json` plus per-page files under `public/docs-content/`
- Generated `llms.txt` and `llms-full.txt` for AI-friendly discovery
- Pagefind indexing for fast production search
- Theme, motion, and font controls out of the box
- File tree, table of contents, and interactive docs map navigation

## How The Content Pipeline Works

1. Define the docs tree in `shared/documentation-config.js`.
2. Write Markdown files in `src/docs/content/`.
3. Run `npm run generate:docs` or `npm run build`.
4. The app loads `/docs-index.json` once, then fetches individual page files from `/docs-content/` at runtime.

## When This Template Fits Well

Use it when you want:

- product docs
- internal engineering handbooks
- API or SDK documentation
- changelog or release-note sites
- AI-ingestible docs without extra tooling

## Core Files To Know Early

- `shared/documentation-config.js`
- `src/docs/content/`
- `src/lib/content.ts`
- `scripts/generate-docs.mjs`
- `scripts/generate-llms.mjs`
- `scripts/generate-pagefind.mjs`

## Next Steps

- Read [Quick Start](/docs/getting-started/quick-start)
- Review [Installation](/docs/getting-started/installation)
- Learn the runtime in [Basic Usage](/docs/user-guide/basic-usage)
