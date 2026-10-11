# Plan 019: Preload the critical chunk and document for each static route

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before moving on. Touch only the files in Scope. If a
> STOP condition occurs, stop and report instead of improvising.
>
> **Drift check (run first)**:
> `git diff --stat a3d207c -- scripts/generate-route-html.mjs test/architecture.test.ts`.
> Preserve unrelated uncommitted work and compare the live files to Current
> state before editing.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: plans/015-generated-openapi-reference-parity.md
- **Category**: perf | tests
- **Status**: DONE — route preloads, OpenAPI collision handling, release guard, and clean-copy gates verified 2026-08-25
- **Planned at**: commit `a3d207c`, 2026-08-25

## Why this matters

The static route generator already emits route-specific title, canonical,
JSON-LD, and agent metadata, but every route currently keeps only the shell's
generic modulepreloads. A deep documentation request therefore downloads the
app shell, discovers the lazy `DocsPage`/OpenAPI chunk, then discovers the
document JSON. This is visible in local Lighthouse: deep docs and OpenAPI are
around the configured 0.70 warning boundary even after Scalar was deferred.
Preloading only the route-critical lazy chunk and the current document should
reduce the waterfall without putting Mermaid, Pagefind, Scalar, or other
optional features on every page.

## Current state

- `scripts/generate-route-html.mjs` calls
  `stripNonCriticalPreloads(readFileSync(indexHtmlPath, 'utf8'))` once and
  uses the same shell template for every generated route.
- The strip helper intentionally removes generic `DocsPage-*`,
  `OpenApiPage-*`, and heavy vendor preloads to avoid loading them on the
  homepage.
- Route entries know `routePath`, `canonicalPath`, `type`, and collection
  metadata through the existing SEO artifact builder.
- `dist/assets/` contains hashed `DocsPage-*.js` and
  `OpenApiPage-*.js` files after Vite build. The route generator can discover
  them from the built assets; do not hard-code a hash.
- Generated document JSON lives under the collection artifact path, e.g.
  `/docs-content/getting-started/introduction.json`, and the runtime fetches
  that exact URL from `src/lib/content.ts`.

## Commands

| Purpose       | Command                             | Expected                                                                      |
| ------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Tests         | `npm test`                          | all architecture tests pass                                                   |
| Type check    | `npm run type-check`                | exit 0                                                                        |
| Build         | `NODE_ENV=production npm run build` | fresh route HTML and assets generated                                         |
| Release smoke | `npm run release:check`             | route metadata and asset checks pass                                          |
| Browser       | `CI=true npx playwright test`       | all existing browser tests pass                                               |
| Lighthouse    | `npm run lighthouse:check`          | existing four-route assertions pass; performance remains measured, not hidden |

## Scope

**In scope:**

- `scripts/lib/routePreloads.mjs` (create)
- `scripts/generate-route-html.mjs`
- `test/route-preloads.test.ts` (create)
- `test/run-tests.mjs`
- `scripts/release-smoke.mjs` only if a focused artifact assertion is needed

**Out of scope:**

- App/runtime components, route behavior, content schema, OpenAPI artifacts,
  Lighthouse thresholds, or dependency changes.
- Preloading Scalar's `esm-*.js`, Mermaid, Pagefind, fonts from arbitrary
  origins, or any optional feature.
- Hard-coded hashed asset filenames.

## Steps

### Step 1: Create a pure route-preload planner

Create `scripts/lib/routePreloads.mjs` with a pure function that accepts a
route entry, the configured collections, the built asset filename list, and
the route's generated document key when available. It returns safe, escaped
HTML link tags:

- article routes get a `modulepreload` for the hashed `DocsPage-*.js` chunk
  and a same-origin `preload as="fetch"` for the exact generated document
  JSON;
- OpenAPI routes get a `modulepreload` for `OpenApiPage-*.js` only;
- homepage, 404, llms/skill aliases, and other non-document routes get no
  route-specific preload;
- duplicate links are removed and filenames are constrained to built
  `assets/` paths, never user-controlled URL input.

Use the existing collection routing helpers to derive the document key from
the canonical route. Preserve version/locale prefixes and URL-encode each
path segment exactly as `src/lib/content.ts` does.

**Verify**: add exported test cases in `test/route-preloads.test.ts` and
register them from `test/run-tests.mjs`, asserting docs, alternate
collection, OpenAPI, homepage, and 404 cases; no Scalar/Mermaid/remote URL
appears in the returned HTML.

### Step 2: Apply route-specific links after metadata

In `scripts/generate-route-html.mjs`, list the built asset files after Vite
build, call the pure planner for each route entry, and inject its links in the
route HTML head after the existing metadata/agent links. Keep the generic
shell cleanup unchanged. If a required route chunk or document asset cannot be
resolved, fail the build with a precise route/path error rather than emitting
an incorrect preload.

**Verify**: `NODE_ENV=production npm run build` -> the homepage has no
`DocsPage`/OpenAPI route preload; a deep docs HTML file contains one
`DocsPage-*.js` modulepreload and its document JSON fetch preload; the OpenAPI
HTML contains only the OpenAPI page chunk and no `esm-*.js` preload.

### Step 3: Verify performance and regressions

Run the complete command table. Compare the Lighthouse report to the previous
baseline without changing thresholds. The expected result is lower LCP or a
higher performance score on docs/OpenAPI; a noisy one-run score is not a
reason to loosen the gate.

**Verify**: `npm test && npm run type-check && NODE_ENV=production npm run
build && npm run release:check && CI=true npx playwright test && npm run
lighthouse:check` -> all commands exit 0 and static route assertions remain
valid.

## Test plan

- Focused unit coverage in `test/route-preloads.test.ts` for HTML escaping,
  hashed chunk selection, collection/version/locale document paths,
  no-preload routes, and no heavy optional chunks; `npm test` must import and
  execute those cases.
- Existing release smoke coverage remains the final guard for all generated
  routes.
- Existing browser smoke confirms direct reloads and deferred Scalar behavior.

## Done criteria

- [x] Route-specific preloads are generated from hashed built assets, never hard-coded.
- [x] Docs routes preload only their lazy page chunk and exact same-origin document JSON.
- [x] OpenAPI routes preload only `OpenApiPage-*.js`; Scalar remains user-triggered.
- [x] Homepage/404/hosted-agent aliases do not gain document preloads.
- [x] New route-preload tests are registered in `test/run-tests.mjs` and pass.
- [x] Build, release, browser, type, and Lighthouse checks pass.
- [x] No files outside Scope are modified.

## STOP conditions

- The static route entry cannot be mapped unambiguously to a collection
  document key; stop rather than preloading a guessed path.
- The built output has zero or multiple ambiguous route chunks for a route.
- A preload would require a remote origin, Scalar, Mermaid, or a change to the
  client fetch URL.
- Any verification fails twice or requires touching files outside Scope.

## Maintenance notes

Any new lazy route page must be added to the route-preload planner with an
explicit route class and regression test. Keep the planner pure and keep
asset-path validation strict so route metadata cannot become a preload
injection vector. Re-measure Lighthouse after changes to the shell, fonts,
content-fetch strategy, or lazy boundaries.
