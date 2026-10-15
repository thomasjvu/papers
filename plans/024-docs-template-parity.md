# Plan 024: Close authoring gaps against mainstream docs templates

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: authoring | ui | accessibility
- **Status**: IN PROGRESS. Rounds 1 to 3 are done (PR #7, PR #8, PR #9).
  The remaining gaps are ranked below.
- **Planned at**: commit `3579993`, 2026-10-11

## Comparison set

This plan compares Papers with Starlight (Astro), Docusaurus, VitePress,
Nextra, and Mintlify. It covers the features docs authors use most. For each
competitor, it records whether the feature is built in or ships in the default
theme.

| Feature                         | Starlight | Docusaurus     | VitePress  | Nextra              | Mintlify | Papers (after PR #8)                                                  |
| ------------------------------- | --------- | -------------- | ---------- | ------------------- | -------- | --------------------------------------------------------------------- |
| Full-text search                | Pagefind  | Algolia/plugin | MiniSearch | FlexSearch/Pagefind | hosted   | Pagefind, collection-aware (plan 018), command palette                |
| Callouts / admonitions          | yes       | yes            | yes        | yes                 | yes      | **missing**                                                           |
| GitHub `> [!NOTE]` alerts       | no        | no             | yes        | yes                 | no       | **missing**                                                           |
| Code: copy button               | yes       | yes            | yes        | yes                 | yes      | yes                                                                   |
| Code: tabs / groups             | yes       | yes            | yes        | yes                 | yes      | yes (`ts:TS\|js:JS` fences)                                           |
| Code: filename titles           | yes       | yes            | yes        | yes                 | yes      | **missing** (the `title` prop existed but authors could not reach it) |
| Code: line highlighting         | yes       | yes            | yes        | yes                 | yes      | **missing**                                                           |
| Code: diff styling              | yes       | yes            | yes        | yes                 | yes      | **missing**                                                           |
| Content tabs (non-code)         | yes       | yes            | plugin     | yes                 | yes      | yes (`:::tabs`, synced by group) and MDX `<Tabs>`                     |
| Edit-this-page link             | yes       | yes            | yes        | yes                 | yes      | yes (edit / issue / source footer)                                    |
| Last-updated time               | yes       | yes            | yes        | yes                 | yes      | yes (git, build time)                                                 |
| Prev / next links               | yes       | yes            | yes        | yes                 | yes      | yes (plus keyboard shortcuts)                                         |
| Table of contents               | yes       | yes            | yes        | yes                 | yes      | yes                                                                   |
| Versioning                      | plugin    | yes            | no         | no                  | yes      | yes (`versionConfig`)                                                 |
| i18n routing                    | yes       | yes            | yes        | yes                 | yes      | yes (`i18nConfig`), off by default                                    |
| 404 page                        | yes       | yes            | yes        | yes                 | yes      | yes                                                                   |
| Sitemap / robots                | yes       | yes            | yes        | yes                 | yes      | yes                                                                   |
| Per-page OG images              | plugin    | plugin         | no         | yes                 | yes      | yes (SVG per article route)                                           |
| RSS                             | plugin    | blog only      | no         | blog                | no       | none (low value for reference docs)                                   |
| Frontmatter schema              | yes (Zod) | partial        | no         | partial             | yes      | yes (collection schema adapter)                                       |
| Internal link + anchor checking | plugin    | yes            | yes        | no                  | yes      | yes (`docs:check` validation)                                         |
| Scaffolding CLI                 | yes       | yes            | yes        | yes                 | yes      | yes (`create-papers`)                                                 |
| Accessibility gates             | partial   | partial        | partial    | partial             | partial  | Lighthouse a11y gate, focus-visible, reduced-motion tests             |
| LLM exports (`llms.txt`)        | plugin    | plugin         | plugin     | no                  | yes      | yes                                                                   |
| OpenAPI reference               | plugin    | plugin         | no         | no                  | yes      | yes (generated + Scalar)                                              |

Papers already matches or exceeds the set on routing, search coverage,
validation, LLM/agent exports, and OpenAPI. Most of the gap was inline
authoring components, which authors notice first when they migrate.

## Delivered in this plan

1. **Callouts.** `:::note|tip|info|warning|danger [Title]` blocks hold nested
   Markdown and nest when the outer fence has more colons. Titles are
   HTML-escaped. Each callout renders with `role="note"` and an accessible name,
   and the colors are tuned for light and dark mode.
1. **GitHub alerts.** `> [!NOTE|TIP|IMPORTANT|WARNING|CAUTION]` renders as a
   callout, so README content can be reused. Plain blockquotes are unchanged.
1. **Code fence metadata.**
   - `title="file.ts"` shows a filename in the code block header.
   - `{1,3-5}` highlights those lines.
   - `diff` fences mark added and removed lines. The `+`/`-` markers stay
     visible, so the diff does not rely on color alone.
   - The metadata applies to every tab of a multi-language block.
   - Before this change, an info string like `ts title="x"` broke language
     detection.
1. **MDX parity.** `.mdx` pages support `:::` callouts (including nesting),
   GitHub alerts (now including `CAUTION` and alerts inside nested blocks),
   and code fences with `title`, `{lines}`, and `diff`. All three produce the
   same `admonition-*` markup as Markdown pages and pass through the MDX
   sanitizer. `<Callout>` emits the same markup, keeps its legacy
   `papers-callout` classes, and accepts `info`, `danger`, and `caution`.
   Fence parsing lives in `shared/codeFence.js`, which both pipelines use.
1. Example pages at `developer-guides/callouts-and-code` (Markdown) and
   `developer-guides/callouts-in-mdx` (MDX), unit tests in
   `test/authoring-features.test.ts`, and Playwright checks for both pages.

## Delivered in the follow-up (PR #8)

- **Last-updated time.** `npm run build` runs `generate:last-updated`, which
  writes `dist/docs-last-updated.json` from each source file's last git commit.
  A `lastUpdated` frontmatter date overrides it. The footer shows the date.
  Nothing is written to `public/`, so `docs:check` stays deterministic. The
  deploy workflow checks out full history so the dates are per file.
- **Content tabs in Markdown.** `:::tabs [group]` with `::tab Label` panels
  renders as accessible tabs (arrow, Home, and End keys). Tabs that share a
  group key stay in sync across the page and across browser tabs, and the
  choice persists in `localStorage`.
- **Per-page social images.** The route HTML step writes an SVG card per
  article route to `dist/images/og/...`. `og:image` and `twitter:image` point
  to it. The home page keeps the site-wide card.
- **MDX code blocks.** Top-level MDX code blocks render through `<CodeBlock>`,
  with a copy button, syntax colours, titles, highlighted lines, and diffs.
- **Fix.** A single-line `<Callout>...</Callout>` in MDX now renders as a block
  callout.

## Delivered in round 3 (PR #9)

- **Collapsible callouts.** `:::details Title` in Markdown and MDX renders a
  native `<details>` callout that starts closed.
- **Code blocks.** `diff-<lang>` fences get syntax colours and +/- line
  marking. Quoted terms (`"apiKey"`) are highlighted. `noLineNumbers` or
  `showLineNumbers` sets line numbers per block, and a header button toggles
  them. Added the Prism languages diff, python, yaml, sql, go, and rust.
- **MDX parity.** Code blocks nested inside MDX callouts and tabs get the copy
  button and syntax colours. `<Tabs group="key">` syncs with Markdown
  `:::tabs key`.
- **Steps and cards.** Markdown `:::steps` and `:::cards` (`::card
[Title](/path)`). MDX `<Steps>`, `<CardGrid>`, and `<Card title href>`.
  Card links accept only site paths and https URLs.
- **Search.** Pagefind records carry section, collection, version, and locale
  filters. Results stay in the reader's version and locale. `docs:` and
  `api:` scope a query. Ranking is tuned and title matches are boosted.
  **Fix:** the command palette never loaded Pagefind, because `pagefind.js` is
  an ES module that does not set `window.pagefind`. It now imports the module.
- **Translatable interface labels.** `uiStringsConfig` sets the labels for
  each locale (`shared/uiStrings.js`). `generate:docs` validates it.

## Remaining gaps, in priority order

1. **Raster social cards.** The cards are still SVG. PNG output needs a
   rasterizer dependency, which is not approved yet.
2. **Heading-level search results.** Pagefind custom records have no
   headings, so results link to whole pages. Indexing the route HTML would
   give section anchors.
3. **Search filter UI.** Scopes use a query prefix. There are no filter chips
   in the palette yet.
4. **More translatable labels.** Sidebar, mindmap, and palette command labels
   are still English-only.
5. **Nested Markdown tabs**, and a theme-aware diff palette per theme.
6. **Low priority.** An RSS/Atom feed for changelog-style collections.

## Verification

See the pull request for the commands that were run and their results.
