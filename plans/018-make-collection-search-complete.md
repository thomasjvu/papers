# Plan 018: Make search and Pagefind cover every configured collection

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before moving on. Touch only the files in Scope. If a
> STOP condition occurs, stop and report instead of improvising.
>
> **Drift check (run first)**:
> `git diff --stat a3d207c -- scripts/generate-pagefind.mjs src/components/CommandPalette/useSearchLogic.ts src/hooks/usePagefind.ts test/architecture.test.ts`.
> Preserve unrelated uncommitted work and compare the live code to Current
> state before editing.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/014-generalize-collections-and-mdx.md
- **Category**: correctness | tests | perf
- **Status**: DONE — collection-aware Pagefind and fallback search verified 2026-08-25
- **Planned at**: commit `a3d207c`, 2026-08-25

## Why this matters

The generator and runtime now support separate content collections, but search
still has a docs-only path. `scripts/generate-pagefind.mjs` reads only
`public/docs-index.json` and `public/docs-content/`, while the command
palette fallback imports only `documentationTree`. A user who configures a
second collection can navigate to it but cannot reliably discover it through
Pagefind or the fallback search. Fumadocs treats the content source and search
source as one collection-aware contract; this plan closes that parity gap.

## Current state

- `scripts/generate-pagefind.mjs` imports
  `buildCanonicalDocsPath`, `buildDocsContentPath`, and
  `getDocsVariantContexts`, then hard-codes `docs-index.json` and
  `docs-content/`.
- `src/components/CommandPalette/useSearchLogic.ts` imports
  `documentationTree`, uses `parseDocsRoutePath`, and calls
  `buildCanonicalDocsPath` when building fallback results.
- `shared/docsRouting.js` already exports
  `buildCanonicalCollectionPath`, `buildCollectionContentPath`, and
  `getCollectionVariantContexts`.
- `shared/content-collections.js` already exports
  `contentCollections` and `getCollectionArtifactPaths`.
- `scripts/lib/collectionArtifacts.mjs` can read every configured collection
  into an artifact map, and generated documents are keyed by their collection
  content path.
- The default app has one `docs` collection, so existing browser tests do not
  expose this gap. Architecture tests already create temporary alpha/beta
  collections and are the right place for a deterministic regression test.

## Commands

| Purpose       | Command                             | Expected                                                        |
| ------------- | ----------------------------------- | --------------------------------------------------------------- |
| Tests         | `npm test`                          | 41 or more tests pass, including the new collection-search test |
| Type check    | `npm run type-check`                | exit 0                                                          |
| Lint          | `npm run lint`                      | exit 0                                                          |
| Format        | `npm run format:check`              | exit 0                                                          |
| Build         | `NODE_ENV=production npm run build` | Pagefind indexes the configured collection(s)                   |
| Docs gate     | `npm run docs:check`                | generated artifacts remain valid                                |
| Browser smoke | `CI=true npx playwright test`       | all existing browser tests pass                                 |

## Scope

**In scope:**

- `scripts/lib/pagefindArtifacts.mjs` (create)
- `scripts/generate-pagefind.mjs`
- `src/components/CommandPalette/useSearchLogic.ts`
- `src/hooks/usePagefind.ts` only if required to preserve collection route
  URLs during normalization
- `test/architecture.test.ts`

**Out of scope:**

- Changing the Pagefind dependency or its index format.
- Changing the collection schema, route contract, OpenAPI records, or visual
  search UI.
- Adding a second production collection to the default application.
- Rewriting generated artifacts by hand.

## Steps

### Step 1: Extract a pure collection-aware Pagefind record builder

Create `scripts/lib/pagefindArtifacts.mjs` with a pure helper that accepts
validated collections, their generated artifact map, and OpenAPI artifacts and
returns deterministic custom-record inputs. For every collection, iterate its
index paths and `getCollectionVariantContexts(collection)`; read the matching
generated document, use `buildCollectionContentPath` for the artifact key,
and use `buildCanonicalCollectionPath` for the record URL. Include title,
description/content, variant locale, and collection identity in the searchable
record without leaking source filesystem paths. Preserve the existing
OpenAPI operation/model records and their route URLs.

Deduplicate records by collection id, canonical URL, and artifact key. Missing
generated documents should be reported as a build failure or an explicit
diagnostic, not silently turn a configured collection into an unsearchable one.

**Verify**: add a focused architecture test with temporary alpha and beta
collections and distinct routes; the helper returns one record for each
collection with `/alpha/...` and `/beta/...` URLs and variant records when
variants are enabled.

### Step 2: Wire the build script to all collections

Refactor `scripts/generate-pagefind.mjs` to read all configured collection
artifacts using the existing collection artifact helpers, call the pure record
builder, and add each record to Pagefind. Remove the docs-only artifact path
constants and imports. Keep the existing output cleanup, OpenAPI indexing,
logging, and failure behavior.

**Verify**: `NODE_ENV=production npm run build` -> build succeeds and the
Pagefind generation log counts records from every configured collection; with
the default one-collection config, existing search behavior and output remain
unchanged.

### Step 3: Make fallback command-palette search collection-aware

Refactor `useSearchLogic.ts` to iterate `contentCollections` and each
collection's navigation tree when building the synchronous fallback index.
Construct routes with `buildCanonicalCollectionPath`, retain the existing
docs route behavior for the default collection, and include the collection
label in descriptions when useful. Resolve the active version/locale from the
collection matching the current route using the existing collection route
parser; do not assume every pathname begins with `/docs`.

Keep FAQ, theme, motion, font, language, LLM, and agent commands unchanged.
The fallback must remain usable before Pagefind loads.

**Verify**: `npm run type-check && npm test` -> no errors; inspect the
fallback result construction to confirm no hard-coded `documentationTree`
iteration or docs-only route builder remains.

### Step 4: Preserve Pagefind result URLs and add regression coverage

Update `usePagefind.ts` only if its URL normalization would rewrite a
secondary collection URL back to `/docs`. Add assertions covering direct
collection URLs, variant URLs, and the existing `/llms.txt`/`/skill.md`
aliases. Do not introduce a new network request or eagerly load Pagefind.

**Verify**: `npm test` -> all tests pass; `rg -n
"buildCanonicalDocsPath|buildDocsContentPath|getDocsVariantContexts|documentationTree"
scripts/generate-pagefind.mjs src/components/CommandPalette/useSearchLogic.ts`
-> any remaining matches are justified only for the default compatibility
alias, not collection record generation.

### Step 5: Run the full quality gate

Run tests, lint, format, type-check, clean production build, docs check, and
browser smoke. Confirm the generated Pagefind index still contains OpenAPI
records and the existing nine browser tests remain green.

**Verify**: `npm test && npm run lint && npm run format:check && npm run
type-check && NODE_ENV=production npm run build && npm run docs:check && CI=true
npx playwright test` -> all commands exit 0.

## Test plan

- Add a pure-helper test for two collections with distinct roots/routes.
- Cover default, versioned, and localized collection record URLs when those
  variant flags are enabled.
- Preserve OpenAPI operation/model records in the helper output.
- Keep the existing browser search test and run it after a fresh build.

## Done criteria

- [x] Pagefind generation reads every configured collection's index/content artifacts.
- [x] Search record URLs use each collection's route prefix and active variant.
- [x] Fallback command-palette search includes every collection without Pagefind.
- [x] OpenAPI, LLM, and hosted asset search records remain unchanged.
- [x] New architecture regression coverage passes.
- [x] Tests, lint, format, type-check, docs check, build, and browser smoke pass.
- [x] No files outside Scope are modified.

## STOP conditions

- The current collection artifact keys do not match the routing helpers; stop
  rather than inventing a second key format.
- A secondary collection requires changing the schema or route contract.
- Pagefind cannot accept deterministic records for multiple collections without
  changing its dependency or public output format.
- Any verification fails twice or requires touching files outside Scope.

## Maintenance notes

Any new collection must provide an index, generated content, route prefix, and
navigation tree before Pagefind generation can succeed. Keep the pure record
builder independent from the Pagefind WASM/runtime package so it remains easy
to test. If search ranking or result metadata changes later, update both the
pure helper test and the browser search assertion.
