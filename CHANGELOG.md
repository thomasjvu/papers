# Changelog

## Unreleased

### Changed (breaking for custom themes)

- Tailwind CSS 3 → 4 via `@tailwindcss/vite` (`tailwind.config.js`, `postcss.config.js` and `autoprefixer` removed; config moved to `@theme` in `src/globals.css`)
- Papers tokens that collided with Tailwind 4 namespaces are prefixed: `--text-*` → `--papers-text-*` (incl. `--papers-text-color`, `--papers-text-secondary`), `--leading-*`, `--radius-*`, `--shadow-*` → `--papers-*`. Custom themes must rename these tokens
- explicit cascade layers `theme, base, components, papers-base, utilities, papers`; theme tokens, CSS modules and KaTeX CSS are layered, so unlayered consumer CSS overrides Papers
- media queries use rem range syntax matching Tailwind 4 breakpoints; homepage uses `.papers-container` (px max-widths) instead of `container`

### Fixed

- CI Lighthouse gate: Chrome runs without the sandbox on Linux CI runners, and the preview server's process group is killed so the job can no longer hang

- theme toggle label and icon now show the **current** color mode (matching font and motion controls), not the mode you would switch to
- Mermaid diagrams rendered as empty boxes: the SVG sanitizer's `ALLOWED_URI_REGEXP` stripped all geometry and `<foreignObject>` labels; diagrams now keep shapes, edges and HTML labels with theme-token colors
- `check:runtime-audit` passes: Tailwind 3's glob dependencies (braces, micromatch, chokidar, fast-glob) are gone and vue / source-map-js / dompurify were updated within range
- direct links to a heading (`/docs/page#heading`) now scroll the heading into view after the page loads
- unknown `VITE_PAPERS_THEME` values (e.g. `pq2`) now fail with the env source, a "did you mean" hint, the available themes and the fix command

### Added

- PNG social cards for each page (`@resvg/resvg-js`), with the SVG card as a fallback; `PAPERS_SOCIAL_CARD_FORMAT=svg` turns PNG off
- heading-level search results that open the page at the matching section, and All / Docs / API scope buttons in the command palette
- translatable sidebar, mindmap and command palette labels in `uiStringsConfig`, with placeholder checks for templates such as `Font: {font}`
- nested Markdown tabs: an outer `::::tabs` set can hold an inner `:::tabs` set
- `--code-inserted-*` and `--code-deleted-*` diff tokens, set by each bundled theme
- `dist/rss.xml`, an RSS feed of recently updated pages, linked from every page
- KaTeX math: inline `$...$`, display `$$...$$`, and typeset ` ```math ` fences (KaTeX lazy-loads only on pages with math)
- Mermaid labels with KaTeX math (`$$...$$`) rendered as native MathML; verified with KaTeX 0.16.47 and 0.18.10 overrides
- `developer-guides/math-and-diagrams` example page with unit and Playwright coverage
- Mermaid diagrams in `.mdx` pages (with readable source fallback)
- browser test pinning hover and focus states to the Tailwind 3 baseline
- math in `.mdx` pages (`remark-math`), with a `developer-guides/math-in-mdx` example page
- `developer-guides/tailwind-integration` guide for downstream Tailwind 4 sites
- `npm run visual:check` / `visual:update`: per-theme Playwright screenshot comparison
- reproducible `create-papers` package metadata with an immutable template commit manifest
- packed-package clean-consumer smoke coverage that scaffolds, installs, builds, and checks a direct docs route offline
- contributor and security policies plus a trusted provenance-enabled package release workflow

## 0.1.0 - 2026-03-12

First public beta release.

### Highlights

- added generated route-level HTML metadata for docs and `llms` pages
- switched build-time metadata generation to Vite-native env loading
- removed the third-party runtime icon script and tightened CSP headers
- fixed Cloudflare deployment behavior so generated route HTML can be served directly
- made docs landing routes and internal links config-driven instead of sample-path hardcoded
- preserved correct GitHub edit and source links for both `.md` and `.mdx` documents
- added release validation commands for artifact checks and served preview checks
- added route-aware version and locale scaffolding with content-variant resolution
- updated search, sitemap, `llms.txt`, and SEO metadata to use canonical docs routes

### Release Notes

This release is ready for public beta use as a static documentation framework.

Known limitations:

- versioning and i18n are supported structurally, but disabled by default in `shared/documentation-config.js`
- browser-interaction E2E coverage is still lightweight and focused on served-route smoke checks
