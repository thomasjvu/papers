# Plan 011: Defer the OpenAPI runtime behind a slim standalone adapter

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` unless the reviewer maintains the index.
>
> **Drift check (run first)**: `git diff --stat 47380cf..HEAD -- package.json package-lock.json vite.config.ts src/components/OpenApiReference.tsx src/types test scripts`.
> The planned-at tree is clean at commit `47380cf`. If any in-scope file
> changed, compare the excerpts below against the live code before editing.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/010-native-content-api-parity.md (DONE)
- **Category**: perf
- **Planned at**: commit `47380cf`, 2026-08-25

## Execution note

Implemented. The direct `@scalar/api-reference` package is aliased to its
standalone `esm.js` browser entry and loaded by the route-lazy OpenAPI adapter.
The first explicit `vendor-openapi` manual chunk was removed after profiling
showed Vite's preload helper requesting it from the initial shell; the emitted
`esm-*.js` chunk remains isolated behind `OpenApiPage`. The production build
now emits in roughly 31 seconds locally, and the homepage HTML has no Scalar
asset reference.

## Why this matters

The production build currently stalls during Rollup transformation before it
emits any assets. The existing OpenAPI integration dynamically imports
`@scalar/api-reference-react`, but that package imports the modular
`@scalar/api-reference` entry, which exposes a very large Vue/component graph;
dynamic import defers browser execution but does not prevent Rollup from
walking and transforming that graph. The Scalar package already ships a
browser-oriented ESM standalone bundle. Loading that bundle only from the
OpenAPI route preserves the interactive reference surface while making the
build graph smaller and keeping the main documentation shell free of the
OpenAPI runtime.

## Current state

- `src/components/OpenApiReference.tsx:1-13` imports
  `@scalar/api-reference-react/style.css` and lazily imports
  `@scalar/api-reference-react` to render `ApiReferenceReact`.
- `src/components/OpenApiReference.tsx:46-69` passes the validated local or
  allowlisted spec URL, theme state, and custom CSS to the React wrapper.
- `src/pages/OpenApiPage.tsx:14` imports the leaf reference component, while
  `src/App.tsx:14` already lazy-loads the whole OpenAPI page. Preserve both
  boundaries.
- `package.json:56-76` declares `@scalar/api-reference-react` as a direct
  runtime dependency. The installed package is 0.9.65 and depends on
  `@scalar/api-reference` 1.66.1.
- `vite.config.ts:29-34` has only the project aliases. Its
  `manualChunks` function at lines 46-66 splits React, router, icon, markdown,
  syntax, and motion packages but has no Scalar/OpenAPI branch.
- The installed `node_modules/@scalar/api-reference/esm.js` is a thin ESM
  entry that re-exports `createApiReference` from the package's browser
  standalone ESM bundle. The package's normal `dist/index.js` instead imports
  the modular Vue implementation and its many feature packages.
- The observed failure is a local Vite production transform that ran for more
  than eleven minutes with no emitted assets while traversing Scalar's
  modular graph. This is the regression to remove; do not claim a build is
  fixed until `npm run build` emits `dist/` and the release gates pass.

## Commands you will need

| Purpose           | Command                                                  | Expected on success                                                                                          |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Install/lockfile  | `npm install --package-lock-only`                        | exit 0; only the intended Scalar dependency graph changes                                                    |
| Tests             | `npm test`                                               | all architecture tests pass, including OpenAPI tests                                                         |
| Typecheck         | `npm run type-check`                                     | exit 0 with no TypeScript errors                                                                             |
| Lint              | `npm run lint`                                           | exit 0                                                                                                       |
| Format            | `npm run format:check`                                   | exit 0                                                                                                       |
| Build             | `NODE_OPTIONS=--max-old-space-size=4096 npm run build`   | exit 0 and writes `dist/index.html`, route HTML, assets, Pagefind, and build manifest in a practical CI time |
| Release artifacts | `npm run release:check && npm run release:preview-check` | both exit 0                                                                                                  |
| Browser           | `npx playwright test`                                    | all browser smoke tests pass, including both OpenAPI specs                                                   |

## Scope

**In scope** (the only source/config files to modify, plus generated lock or
artifact files required by the commands):

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `src/components/OpenApiReference.tsx`
- `src/types/` only if a local type declaration is required by the chosen
  standalone import
- `test/architecture.test.ts` or a focused test file for the new adapter
- `scripts/release-smoke.mjs` only if a machine-checkable lazy-chunk contract
  is needed
- `plans/README.md` status row

**Out of scope**:

- OpenAPI URL allowlisting, CSP origins, or the generated OpenAPI artifact
  schema; those are already covered by Plan 010 and security tests.
- The visual design or feature configuration of Scalar, except for preserving
  the current theme/custom-CSS behavior.
- Replacing Scalar with a homegrown OpenAPI renderer.
- Removing the existing route-level lazy import in `src/App.tsx`.
- Hand-editing generated `public/` files; use the repository generators if a
  test requires refreshed artifacts.

## Suggested executor toolkit

- Keep `src/components/OpenApiReference.tsx` a leaf component, matching the
  lazy-feature rule documented in
  `src/docs/content/developer-guides/best-practices.md`.
- Use the existing `getOpenApiSpecUrl` validation boundary; never pass an
  unvalidated URL to Scalar.

## Steps

### Step 1: Replace the React wrapper with a deferred standalone adapter

Update `src/components/OpenApiReference.tsx` so it dynamically imports the
`createApiReference` export from the standalone Scalar ESM entry, mounts it
into a `ref` container in an effect, and calls the returned instance's
`destroy` method on cleanup. Keep the current `safeSpecUrl`, dark-mode state,
custom CSS variables, and loading fallback. Make the configuration stable
with `useMemo` (or an equivalent dependency-safe shape) so ordinary renders
do not repeatedly destroy and recreate the viewer. Surface a small inline
error state if the dynamic import or mount fails; do not leave an unhandled
promise or log-only failure.

The runtime import may remain `@scalar/api-reference` if the Vite alias in
Step 2 maps it to the standalone file; TypeScript should resolve the package's
published root types. If the package's types do not expose the standalone
signature, add a narrow declaration under `src/types/` rather than using
`any` or a broad compiler suppression.

**Verify**: `npm run type-check` → exit 0 with no errors.

### Step 2: Make the standalone entry the build target and split it explicitly

Change `package.json` to depend directly on `@scalar/api-reference` at the
resolved version required by the standalone entry and remove the direct
`@scalar/api-reference-react` dependency. Regenerate the lockfile with the
repository's package manager command and confirm the wrapper is no longer a
direct dependency.

In `vite.config.ts`, add a narrow alias for the runtime package to the
installed package's `esm.js` standalone entry. Keep the alias explicit to
this package; do not alias all `@scalar/*` packages or change the project's
general resolver. Keep the standalone module out of the initial preload graph;
do not force a manual chunk if that makes Vite preload the route-only runtime
from the shell.

Do not increase or remove `chunkSizeWarningLimit` just to hide the result. The
OpenAPI chunk may be large because it is intentionally featureful, but it must
be isolated from the initial shell and built without traversing the modular
package graph.

**Verify**: `npm install --package-lock-only` → exit 0; `rg -n
"@scalar/api-reference-react" package.json package-lock.json src vite.config.ts`
returns no direct source/manifest import; `rg -n
"@scalar/api-reference" package.json package-lock.json vite.config.ts
src/components/OpenApiReference.tsx` shows only the direct package and the
explicit alias/runtime import.

### Step 3: Add a regression contract for the lazy runtime

Add a focused architecture assertion or release artifact check that proves the
production output contains an OpenAPI vendor chunk while the homepage entry
does not preload or import that chunk. Follow existing source/artifact tests in
`test/architecture.test.ts` and `scripts/release-smoke.mjs`; inspect actual
Vite output names rather than hard-coding a content hash. The contract should
also fail if the old React wrapper import returns.

**Verify**: `npm test` → all tests pass, with the new regression assertion
covering the old wrapper import/lazy-chunk boundary.

### Step 4: Build and run the full OpenAPI/browser ladder

Run the full build with the bounded Node heap command in the command table.
Record the elapsed time and confirm it emits assets before the repository's
normal CI timeout. Then run the release, preview, and browser checks. The
browser test must still observe the public and internal operation summaries,
route switch, theme behavior, and no runtime/console errors.

**Verify**: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`,
`npm run release:check`, `npm run release:preview-check`, and
`npx playwright test` → all exit 0.

## Test plan

- Preserve and run the existing OpenAPI browser test in
  `test/browser/docs.spec.mjs`; it is the behavioral contract for both spec
  IDs and the Scalar mount.
- Add a source/build contract in `test/architecture.test.ts` or
  `scripts/release-smoke.mjs` for the standalone alias and isolated lazy
  Scalar chunk. Assert the actual invariant (old wrapper absent, OpenAPI
  runtime isolated), not a brittle hash or exact minified size.
- Run `npm test`, `npm run type-check`, `npm run lint`,
  `npm run format:check`, and the build/release/browser commands above.

## Done criteria

- [x] `@scalar/api-reference-react` is not a direct dependency or source import.
- [x] Scalar loads only through the route-lazy standalone adapter and cleans up
      its mounted instance on unmount.
- [x] `npm run build` emits assets without the previously observed >11-minute
      transform stall.
- [x] The initial homepage bundle does not preload the OpenAPI runtime; the
      OpenAPI route still loads the standalone Scalar chunk and renders both
      configured specs.
- [x] `npm test`, `npm run type-check`, `npm run lint`,
      `npm run format:check`, `npm run release:check`,
      `npm run release:preview-check`, and `npx playwright test` pass.
- [x] No unrelated files are modified; the adjacent WOFF shell-font delivery
      hardening is recorded in `plans/README.md` and covered by assets/tests.
- [x] `plans/README.md` status row is updated.

## STOP conditions

Stop and report instead of improvising if:

- The standalone ESM entry cannot be resolved without importing the modular
  package graph, or its exported `createApiReference` contract is incompatible
  with the current configuration.
- The mounted standalone viewer cannot preserve the existing local/allowlisted
  spec URL and theme behavior without changing the OpenAPI security boundary.
- The build still fails to emit assets after two bounded attempts, or takes
  longer than the repository's CI timeout for a reason unrelated to Scalar.
- The fix requires changing OpenAPI validation, CSP, route names, or any
  out-of-scope file not listed above.

## Maintenance notes

Keep the standalone import and alias together: a future Scalar upgrade must
verify that `esm.js` still points to a browser bundle and that its dynamic
chunks resolve under Vite. Review the initial entry HTML and the OpenAPI route
network waterfall whenever the Scalar version changes. Do not solve a larger
vendor chunk by eager-loading it; the route is intentionally an uncommon,
feature-heavy surface.
