# Plan 020: Remove optional bundle-size warnings without weakening lazy boundaries

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and record the actual result. Do not lower a Lighthouse
> assertion, raise a chunk budget merely to hide a warning, or make optional
> features eager. If the maintained upstream entry point cannot be split
> safely, stop and report the measured limitation instead of moving the bytes
> to a remote CDN.
>
> **Drift check (run first)**:
> `git diff --stat a3d207c -- vite.config.ts src/components/OpenApiReference.tsx src/components/MermaidDiagram.tsx src/components/CodeBlock.tsx test/architecture.test.ts scripts/check-assets.mjs package.json`
> The current checkout contains uncommitted parity work. Preserve it and
> compare the live files to this plan before editing.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/017-remove-lighthouse-ci-toolchain-advisories.md, plans/019-preload-route-critical-resources.md
- **Category**: perf | tests | tech-debt
- **Status**: BLOCKED — the supported modular Scalar entry produced the same optional graph
- **Planned at**: commit `a3d207c`, 2026-08-25

## Why this matters

The current build is functionally release-ready but still emits Vite large
chunk warnings and Lighthouse performance warnings. The measured source is
specific: the optional Scalar standalone entry produces `esm-*.js` at roughly
2.6 MB and a Scalar modal chunk at roughly 0.9 MB; Mermaid produces a core
chunk around 0.62 MB and a Cynefin diagram chunk around 0.69 MB. These assets
are not needed for the homepage, normal docs routes, or the initial OpenAPI
summary, but their size increases maintenance cost and can become a real
interaction delay when users opt into diagrams or Scalar.

The change must improve the actual graph, not disguise it with a larger
`chunkSizeWarningLimit` or a lower Lighthouse threshold. Preserve the existing
static route HTML, route-specific preloads, user-triggered Scalar boundary,
lazy Mermaid rendering, direct reload behavior, and all supported diagram
types.

## Measured experiment outcome — 2026-08-25

An isolated executor changed the Vite alias from Scalar's published standalone
`esm.js` entry to the package's published modular `dist/index.js` entry and
rebuilt the production output. The observed files remained exactly the same
size as the baseline: `esm-*.js` 2,586,740 bytes, `modal-*.js` 920,462 bytes,
`mermaid.core-*.js` 621,996 bytes, and `cynefin-*.js` 688,969 bytes. The
modular entry therefore does not produce a materially smaller local graph for
`@scalar/api-reference` 1.66.1; the bytes are an upstream package boundary,
not a safe manual-chunk omission. No alias change was adopted in the parent
worktree. The executor stopped before the full verification ladder returned,
so this plan is blocked on the upstream graph rather than marked complete.

The initial route graph is still protected: Scalar remains click-triggered,
Mermaid remains component-lazy, and the large optional files are not initial
homepage/docs/OpenAPI requests. Plans 021 and 022 address the independently
measured initial font and motion costs without weakening this boundary.

## Current state

- `vite.config.ts:33` aliases `@scalar/api-reference` to the monolithic
  `node_modules/@scalar/api-reference/esm.js` standalone entry. The runtime
  import remains inside `src/components/OpenApiReference.tsx:68`, after the
  user clicks “Load interactive viewer”.
- `src/pages/OpenApiPage.tsx:20` keeps `OpenApiReference` route-lazy, and
  `scripts/release-smoke.mjs` rejects eager `OpenApiReference` and `esm-*`
  references in generated HTML. Do not break this contract.
- `src/components/MermaidDiagram.tsx:28` dynamically imports Mermaid only when
  the lazy Mermaid component mounts. Mermaid's supported core entry registers
  lazy diagram loaders, so importing the full `mermaid.esm` entry would make
  the graph worse.
- `src/components/CodeBlock.tsx:218-256` loads the syntax highlighter and eight
  language modules when a code block mounts. Keep code rendering and language
  support intact; do not remove languages just to make a report green.
- `vite.config.ts:47-68` owns manual vendor chunking. The current 600 kB
  `chunkSizeWarningLimit` is a signal and must remain a meaningful limit unless
  a measured, documented exception is approved in this plan.
- Baseline clean-copy Lighthouse evidence from the current build:
  `/` performance 77%, `/docs` 69%, deep docs 67%, OpenAPI 72%; accessibility
  96–100%, best practices 100%, SEO 100%. Deep docs main-thread work is about
  2.9 s and requests approximately 207 kB Mona Sans, 207 kB Hubot Sans,
  58.9 kB React, 38.8 kB Framer Motion, 24.7 kB Markdown, 22.3 kB
  MarkdownRenderer, and 8.7 kB DocsPage before optional diagram/Scalar code.

## Commands you will need

| Purpose                 | Command                                                                                           | Expected result                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Install                 | `npm ci`                                                                                          | exit 0; lockfile honored                                                                 |
| Unit/architecture tests | `npm test`                                                                                        | all current tests pass; add focused regression coverage if the graph changes             |
| Lint/type/format        | `npm run lint && npm run type-check && npm run format:check`                                      | all exit 0                                                                               |
| Build                   | `NODE_ENV=production SOURCE_COMMIT=<40-char-sha> PAPERS_TEMPLATE_REF=<40-char-sha> npm run build` | build exits 0 without a large-chunk warning at the existing limit, or STOP with evidence |
| Release gates           | `npm run release:check`                                                                           | docs, security, package, artifact, and preview checks pass                               |
| Browser                 | `CI=true npx playwright test`                                                                     | all browser tests pass without retries                                                   |
| Lighthouse              | `CI=true npm run lighthouse:check`                                                                | four routes pass existing assertions; performance is measured, not suppressed            |

## Scope

**In scope** (modify only what is necessary from this list):

- `vite.config.ts`
- `src/components/OpenApiReference.tsx`
- `src/components/MermaidDiagram.tsx`
- `src/components/CodeBlock.tsx`
- `test/architecture.test.ts`
- `test/browser/docs.spec.mjs`
- `scripts/check-assets.mjs`
- `package.json`
- `package-lock.json`

**Out of scope**:

- Changing published routes, canonical URLs, generated artifact names, or CSP
  policy.
- Making Scalar, Mermaid, Pagefind, syntax highlighting, or the command
  palette eager on the homepage or normal docs routes.
- Removing supported Mermaid diagrams, code languages, OpenAPI interactions,
  accessibility behavior, or browser coverage.
- Adding a remote script/CDN dependency for Scalar, Mermaid, fonts, or icons.
- Changing Lighthouse thresholds until the optimized graph passes repeatedly;
  a later threshold decision must be a separate measured change.
- Committing, pushing, publishing npm, or deploying from the executor worktree.

## Steps

### Step 1: Reproduce and classify the bundle graph

Run the clean production build and capture the largest JavaScript files,
route HTML references, and Lighthouse network requests. Confirm which files
are requested by `/`, a deep docs route, and the OpenAPI overview before any
change. Treat a chunk as initial only if the route requests it before the user
interacts with the optional feature.

**Verify**: the baseline identifies the Scalar `esm`/modal graph, Mermaid
core/diagram graph, and the normal docs graph with file sizes and route
requests; do not proceed if the live graph differs materially from Current
state without updating this plan.

### Step 2: Split Scalar through a supported local entry

Experiment in the isolated worktree with the package's supported modular entry
(`@scalar/api-reference` and its published `dist` exports) versus the current
standalone alias. Keep the `createApiReference` API and configuration shape
unchanged. If the modular entry produces smaller independently cacheable
chunks, use it and add only narrowly justified manual chunks. If it fails to
render, requires an unallowlisted origin, or does not reduce the graph, revert
the experiment and STOP with the exact build/runtime evidence.

**Verify**: generated static HTML still contains no eager Scalar/reference
asset; clicking the interactive viewer still loads and destroys Scalar; the
largest Scalar chunk is materially smaller than the baseline.

### Step 3: Keep Mermaid and syntax highlighting interaction-lazy

Use the maintained Mermaid core entry and existing lazy component boundary.
Only split or schedule work that is proven not to change supported diagram
types or code-language behavior. If adding a small bundle-budget checker,
make it inspect built files and fail with the route/feature classification;
never classify an initial asset as optional merely by filename.

**Verify**: a docs route without a Mermaid block does not request Mermaid;
the Mermaid browser test still renders; code blocks still render all currently
registered languages; initial route request lists are unchanged or smaller.

### Step 4: Add regression coverage and retain real budgets

Add focused architecture/build assertions only where needed to prevent eager
optional imports and accidental threshold hiding. Keep the existing 600 kB
warning limit meaningful. If an upstream optional artifact remains over the
limit after all safe splitting, document it as an explicit, measured
exception and STOP rather than silently changing the limit.

**Verify**: tests cover the lazy Scalar/Mermaid boundaries and any new bundle
classification; `rg` finds no new eager optional import; build output and
release smoke prove the static route contract.

### Step 5: Run the complete verification ladder

Run every command in the Commands table from the isolated worktree. Compare
the four Lighthouse reports with the baseline. Do not call the plan complete
if the build is green only because a warning threshold was relaxed, browser
tests retry, or optional assets moved to a public CDN.

## Test plan

- Preserve the existing lazy-feature architecture tests in
  `test/architecture.test.ts`.
- Preserve browser coverage for MDX/Mermaid, OpenAPI deferred Scalar, direct
  operation/model reloads, mobile, keyboard, reduced motion, and 404.
- If a bundle checker is added, test initial-route classification, optional
  Scalar classification, optional Mermaid classification, malformed asset
  names, and the failure message for a new eager optional asset.
- `npm test`, `CI=true npx playwright test`, and
  `CI=true npm run lighthouse:check` must all pass without retries or lowered
  assertions.

## Done criteria

- [ ] Vite produces no large-chunk warning at the existing meaningful limit,
      or a measured upstream exception is reported instead of hidden.
- [ ] Scalar remains user-triggered and its largest local chunk is materially
      smaller or the exact upstream limitation is documented.
- [ ] Mermaid and syntax highlighting remain lazy and supported.
- [ ] Initial homepage/docs/OpenAPI network graphs do not grow.
- [ ] Tests, release, browser, and Lighthouse gates pass cleanly.
- [ ] No files outside Scope are modified.

## STOP conditions

- The only way to remove a warning is to raise the limit, lower assertions,
  drop supported features, or move code to an unreviewed remote origin.
- The modular Scalar entry breaks the click-to-load viewer, theme behavior,
  destroy cleanup, or browser tests.
- A Mermaid/syntax change causes an unsupported diagram/language or eager
  initial request.
- Any verification gate fails twice or requires out-of-scope files.

## Maintenance notes

Keep the bundle evidence and optional/initial classification close to the
verification scripts. Review future dependency upgrades for entry-point
changes; Scalar and Mermaid publish multiple browser builds whose names can
look interchangeable but have different loading behavior. Re-measure after
font/theme changes because the clean-copy Lighthouse LCP is currently also
dominated by two roughly 200 kB local font requests.
