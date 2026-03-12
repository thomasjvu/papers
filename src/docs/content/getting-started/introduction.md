# Introduction

`papers` is a static docs template for teams that want a polished documentation site without adding a CMS or backend first.

It ships with a docs shell, generated Markdown content, Pagefind search, `llms.txt` exports, and a deployable static build with sitemap, robots, and route-level metadata support.

## What You Actually Customize

Most projects only need to touch four places:

- `shared/documentation-config.js` for the docs tree and homepage copy
- `src/docs/content/` for the Markdown pages users read
- `.env.local` for site metadata, canonical URL, and GitHub links
- `src/globals.css` for theme and typography tokens

## How The Template Works

There are three layers:

1. structure in `shared/documentation-config.js`
2. page content in `src/docs/content/`
3. generated output in `public/docs-content/`, `public/docs-index.json`, and SEO artifacts in `public/`

The browser reads the generated JSON, not the raw Markdown files. That keeps the runtime fast and host-friendly, but it also means content changes need regeneration.

## What Ships Out Of The Box

- left-rail docs navigation with search and settings
- right-rail table of contents and interactive map
- command palette with local results, FAQ answers, and Pagefind results
- tabbed code blocks, live HTML/CSS previews, color palettes, and wallet copy blocks
- dark and light themes, reduced-motion support, and font cycling
- `llms.txt` and `llms-full.txt` generation during build
- robots, sitemap, social preview images, and route-level metadata generation

## Learn These Files First

- `shared/documentation-config.js`
- `src/docs/content/`
- `src/lib/content.ts`
- `src/utils/markdownCore.ts`
- `src/components/MarkdownRenderer.tsx`
- `scripts/generate-docs.mjs`
- `scripts/generate-seo.mjs`

## Next Steps

- [Quick Start](/docs/getting-started/quick-start)
- [Installation](/docs/getting-started/installation)
- [Basic Usage](/docs/user-guide/basic-usage)
