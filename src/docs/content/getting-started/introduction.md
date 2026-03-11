# Introduction

`papers` is a static documentation template for teams that want a polished docs site without standing up a backend or CMS first.

It combines React Router navigation, generated Markdown content, Pagefind search, `llms.txt` exports, and a production-ready static build in one project.

## What You Get

- a homepage and docs framework driven by `shared/documentation-config.js`
- Markdown source content under `src/docs/content/`
- a generated docs manifest plus per-page JSON files
- built-in command palette, file tree, table of contents, and interactive map
- `llms.txt` and `llms-full.txt` output for AI-friendly discovery
- theme, motion, and font preferences without extra setup

## How To Think About The Template

There are two layers:

1. Configuration: your docs tree, homepage copy, metadata, and shared links.
2. Content: the Markdown pages your users actually read.

That means most customization happens in a few predictable places instead of across dozens of components.

## How The Content Pipeline Works

1. Define the docs structure in `shared/documentation-config.js`.
2. Write Markdown pages in `src/docs/content/`.
3. Run `npm run generate:docs` or `npm run build`.
4. The app loads `/docs-index.json` once, then fetches only the requested page from `/docs-content/`.

## When This Template Fits Well

Use it when you want:

- product documentation
- internal engineering handbooks
- API or SDK docs
- changelog or release-note sites
- AI-ingestible docs without extra infrastructure

## Files To Learn First

- `shared/documentation-config.js`
- `src/docs/content/`
- `src/lib/content.ts`
- `scripts/generate-docs.mjs`
- `scripts/generate-llms.mjs`
- `scripts/generate-pagefind.mjs`

## Recommended First Steps

- read [Quick Start](/docs/getting-started/quick-start)
- verify your environment in [Installation](/docs/getting-started/installation)
- learn the editing workflow in [Basic Usage](/docs/user-guide/basic-usage)
