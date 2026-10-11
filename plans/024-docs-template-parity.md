# Plan 024: Close authoring gaps against mainstream docs templates

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: authoring | ui | accessibility
- **Status**: IN PROGRESS. Callouts, GitHub alerts, and code fence metadata
  are done for both `.md` and `.mdx` pages. The remaining gaps are ranked below.
- **Planned at**: commit `3579993`, 2026-10-11

## Comparison set

This plan compares Papers with Starlight (Astro), Docusaurus, VitePress,
Nextra, and Mintlify. It covers the features docs authors use most. For each
competitor, it records whether the feature is built in or ships in the default
theme.

| Feature                         | Starlight | Docusaurus     | VitePress  | Nextra              | Mintlify | Papers before this plan                                               |
| ------------------------------- | --------- | -------------- | ---------- | ------------------- | -------- | --------------------------------------------------------------------- |
| Full-text search                | Pagefind  | Algolia/plugin | MiniSearch | FlexSearch/Pagefind | hosted   | Pagefind, collection-aware (plan 018), command palette                |
| Callouts / admonitions          | yes       | yes            | yes        | yes                 | yes      | **missing**                                                           |
| GitHub `> [!NOTE]` alerts       | no        | no             | yes        | yes                 | no       | **missing**                                                           |
| Code: copy button               | yes       | yes            | yes        | yes                 | yes      | yes                                                                   |
| Code: tabs / groups             | yes       | yes            | yes        | yes                 | yes      | yes (`ts:TS\|js:JS` fences)                                           |
| Code: filename titles           | yes       | yes            | yes        | yes                 | yes      | **missing** (the `title` prop existed but authors could not reach it) |
| Code: line highlighting         | yes       | yes            | yes        | yes                 | yes      | **missing**                                                           |
| Code: diff styling              | yes       | yes            | yes        | yes                 | yes      | **missing**                                                           |
| Content tabs (non-code)         | yes       | yes            | plugin     | yes                 | yes      | MDX `<Tabs>` only                                                     |
| Edit-this-page link             | yes       | yes            | yes        | yes                 | yes      | yes (edit / issue / source footer)                                    |
| Last-updated time               | yes       | yes            | yes        | yes                 | yes      | missing                                                               |
| Prev / next links               | yes       | yes            | yes        | yes                 | yes      | yes (plus keyboard shortcuts)                                         |
| Table of contents               | yes       | yes            | yes        | yes                 | yes      | yes                                                                   |
| Versioning                      | plugin    | yes            | no         | no                  | yes      | yes (`versionConfig`)                                                 |
| i18n routing                    | yes       | yes            | yes        | yes                 | yes      | yes (`i18nConfig`), off by default                                    |
| 404 page                        | yes       | yes            | yes        | yes                 | yes      | yes                                                                   |
| Sitemap / robots                | yes       | yes            | yes        | yes                 | yes      | yes                                                                   |
| Per-page OG images              | plugin    | plugin         | no         | yes                 | yes      | one site-wide generated image                                         |
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

## Remaining gaps, in priority order

1. **Last-updated time.** Read the git commit time for each source file at build
   time and show it in `DocPageFooter`. Allow a `lastUpdated` frontmatter
   override. The time must be written only into `dist/`, not into the committed
   `public/` artifacts. Otherwise `docs:check` parity breaks every time a doc is
   committed.
2. **Content tabs in Markdown, and synced tabs.** MDX already has `<Tabs>`, but
   `.md` pages have no prose tabs. Neither format syncs the selected tab by
   group key the way Starlight and Docusaurus do. Persist the choice with
   `safeLocalStorage`.
3. **Per-page OG images.** Generate a social card per route at build time.
   Today every route shares one site-wide card.
4. **Code block polish.** Add diff fences with syntax highlighting
   (`diff-ts`), word/inline highlighting, a per-block toggle for line numbers,
   and collapsible callouts (`:::details`).
5. **Search quality tuning.** Use Pagefind ranking weights, metadata filters
   (collection, version, locale), and heading-level result anchors. Compare
   results with Starlight defaults on the same corpus.
6. **i18n UI strings.** Routing works, but check that the chrome labels
   (sidebar, footer, palette) can be translated per locale.
7. **MDX code block parity and inline shortcodes.** MDX code blocks are static
   HTML, with no copy button or syntax colors. Separately, a single-line
   `<Callout>...</Callout>` written inside a paragraph compiles to an unstyled
   `<div>`. That bug predates this plan.
8. **Low priority.** An RSS/Atom feed for changelog-style collections, and
   Mintlify-style `Steps`/`Card` components.

## Verification

See the pull request for the commands that were run and their results.
