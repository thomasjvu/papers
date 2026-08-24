# Plan 001: Restore a trustworthy verification baseline

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c0f4e52..HEAD -- package.json test scripts .github`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P0
- **Effort**: M (roughly one to two days, including tests and formatting)
- **Risk**: MED — the changes affect the test loader and release commands, so a
  false-green gate would be worse than a visible failure.
- **Depends on**: none
- **Category**: tests | dx | tech-debt
- **Planned at**: commit `c0f4e52`, 2026-08-23

## Why this matters

The repository advertises a complete local/CI gate, but the first two signals
are currently unusable: `npm test` stops on the Vite-only
`@app-shared/documentation-config.js` alias before running a test, and
`npm run check:docs-tree` points to a missing root script. Formatting also
fails on 17 tracked files. Until these commands are real gates, later route,
content, and security work cannot be trusted and a deploy can appear healthy
without exercising the intended checks.

## Current state

- `package.json:24` runs
  `node --import ./test/register-ts-node.mjs ./test/run-tests.mjs`.
- `test/register-ts-node.mjs:1-3` registers only
  `ts-node/esm/transpile-only`; it does not resolve the Vite aliases declared
  in `vite.config.ts:29-33`.
- `test/architecture.test.ts:35-39` imports `src/lib/navigation.ts`, whose
  first line imports `@app-shared/documentation-config.js`, so the current
  runner fails before `test/run-tests.mjs:5` can iterate the test cases.
- `package.json:35` and `package.json:38` call
  `scripts/sync-documentation-tree.mjs`, but that file does not exist.
  The only copy is `scripts/lib/sync-documentation-tree.mjs`, and its imports
  at lines 4 and 8 are written as if the file lived in `scripts/`, not
  `scripts/lib/`.
- `package.json:25` currently defines `release:check` as only
  `check:docs-tree`, `release:artifact-check`, and `release:preview-check`.
  The independent `scripts/check-docs.mjs` artifact validator is not exposed
  as a package command yet; Plan 003 will integrate it after the generator is
  made deterministic.
- `npm run lint` exits zero but reports three warnings. `npm run format:check`
  exits one and reports these files: `CHANGELOG.md`, `FRAMEWORK.md`,
  `public/skill.md`, `README.md`,
  `shared/character-note-config.js`,
  `src/components/chrome/LanguageSwitcher.tsx`,
  `src/components/CommandPalette/useSearchLogic.ts`,
  `src/components/sidebar/GroupsSidebar.module.css`,
  `src/components/sidebar/GroupsSidebar.tsx`,
  `src/docs/content/api-reference/content-pipeline.md`,
  `src/docs/content/deployment/overview.md`,
  `src/docs/content/developer-guides/code-examples.md`,
  `src/docs/content/getting-started/installation.md`,
  `src/docs/content/getting-started/quick-start.md`,
  `src/docs/content/skill.md`, `src/lib/chrome.ts`, and `vercel.json`.
- `.github/workflows/ci.yml:31-50` and
  `.github/workflows/deploy.yml:28-46` both rely on the broken package
  commands, so CI is not an independent safety net.

## Commands you will need

| Purpose   | Command                                                              | Expected on success                                                      |
| --------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Drift     | `git diff --stat c0f4e52..HEAD -- package.json test scripts .github` | no unexpected pre-existing edits, or STOP                                |
| Install   | `npm ci`                                                             | exit 0                                                                   |
| Tests     | `npm test`                                                           | all architecture tests pass and a final `N test(s) passed.` line appears |
| Lint      | `npm run lint`                                                       | exit 0; no new errors (warnings may remain until their owning plan)      |
| Format    | `npm run format:check`                                               | exit 0                                                                   |
| Types     | `npm run type-check`                                                 | exit 0 with no diagnostics                                               |
| Tree gate | `npm run check:docs-tree`                                            | exit 0 and reports all published entries are on disk                     |
| Scope     | `git status --short`                                                 | only the files listed in Scope are changed                               |

## Scope

**In scope — the executor may modify only these paths:**

- `package.json` — test/format command wiring only; do not change runtime
  dependencies in this plan.
- `test/register-ts-node.mjs` and new `test/resolve-aliases.mjs` — test-only
  ESM alias resolution.
- `scripts/sync-documentation-tree.mjs` — canonical CLI entry point.
- `scripts/lib/sync-documentation-tree.mjs` — remove or relocate the broken
  duplicate after the root entry point is verified.
- `test/architecture.test.ts` — add a small regression assertion only if
  needed to lock the loader/tree command contract.
- The 17 files listed in Current state — formatting-only changes required to
  make the existing formatter gate green.

**Out of scope:**

- Do not change the docs generator semantics, generated public artifacts,
  route HTML layout, OpenAPI routes, CSP, workflow permissions, or the CLI
  scaffolder; those belong to Plans 002–005.
- Do not suppress ESLint warnings or broaden `any`/type escapes to make the
  gate pass.
- Do not run `--write` on the docs-tree command. This plan only establishes
  the safe `--check` path; content changes belong to Plan 003.

## Git workflow

- Branch: `advisor/001-verification-baseline` (or the repository's established
  branch convention if the operator supplies one).
- Match the existing conventional-commit style, for example
  `fix(docs): ...` or `chore(docs): ...` from `git log --oneline -30`.
- Do not commit, push, or open a PR unless the operator explicitly asks.

## Steps

### Step 1: Add test-only resolution for the aliases the app already uses

Keep Vite's runtime aliases unchanged. Add a small Node ESM resolve hook under
`test/` that maps exactly:

- `@app-shared/documentation-config.js` to the repository's
  `shared/documentation-config.js` file.
- `@/<path>` to the repository's `src/<path>` file.

The hook must delegate every other specifier to Node's next resolver and must
not change production bundling. Register it from
`test/register-ts-node.mjs` alongside the existing ts-node loader. Use file
URLs derived from the loader location, not the process working directory, so
the test command remains stable when invoked from a workspace script.

**Verify**: `npm test` → the alias-resolution error is gone, the test cases
execute, and any remaining failure names a real test assertion rather than a
module-resolution failure.

### Step 2: Restore one canonical docs-tree CLI

Move the implementation currently in
`scripts/lib/sync-documentation-tree.mjs` to
`scripts/sync-documentation-tree.mjs` (or create a thin root wrapper and keep a
library module only if that is cleaner). At the root level, the relative
imports must resolve to `../shared/documentation-config.js` and
`./lib/documentationTreeWriter.mjs`. Preserve the existing modes:
`--check` must be read-only, no flag must report, and `--write` must remain the
only mode allowed to edit `shared/documentation-config.js`. Remove the broken
duplicate so future maintainers cannot update the wrong copy.

**Verify**: `npm run check:docs-tree` → exit 0 with no missing tree entries;
`npm run sync:docs-tree -- --check` → same exit-0 result; `git status --short`
→ no file changed by either check command.

### Step 3: Make the existing formatter gate deterministic

Run Prettier only on the 17 files reported at the planned commit and inspect
the diff. Keep the formatter configuration and content semantics intact; do
not use formatting as a reason to rewrite prose or generated artifacts. If the
current Prettier configuration contains the deprecated `jsxBracketSameLine`
option, remove or update that option only if the installed Prettier version
requires it and the resulting diff stays formatting-only.

Do not add `.mdx` to the glob in this step unless the executor also adds the
MDX files to the explicit formatting scope; Plan 003 owns the content-format
policy.

**Verify**: `npm run format:check` → exit 0; `npm run lint` → exit 0; inspect
`git diff --check` → no whitespace errors.

### Step 4: Lock the repaired entry points into the test suite

Add a focused architecture test only if the repaired behavior would otherwise
regress silently. It may assert that the test loader/register file contains
the two supported aliases or that the root docs-tree script exists and the
package scripts point to it. Keep this structural test small; do not test
implementation details of the tree writer here.

**Verify**: `npm test` → all existing tests plus the new regression assertion
pass; `npm run type-check` → exit 0.

### Step 5: Run the baseline gate from a clean dependency state

Run the commands in the table in this order. Do not repair later-plan failures
by changing files outside this plan; record them for the dependent plan.

**Verify**: `npm ci && npm test && npm run lint && npm run format:check && npm run type-check && npm run check:docs-tree` → exit 0 for every command; `git status --short` → only the in-scope changes remain.

## Test plan

- Preserve all existing cases in `test/architecture.test.ts`.
- Add at most one regression case for alias/tree-command wiring, using the
  existing direct assertion style in `test/architecture.test.ts:69-939`.
- The critical verification is execution, not test count: the runner must
  reach the final pass summary instead of failing in import setup.

## Done criteria

- [ ] `npm test` exits 0 and reports every architecture test as pass.
- [ ] `npm run check:docs-tree` exits 0 and the command is read-only.
- [ ] `npm run lint` exits 0.
- [ ] `npm run format:check` exits 0.
- [ ] `npm run type-check` exits 0.
- [ ] The root package scripts no longer reference a missing
      `scripts/sync-documentation-tree.mjs`.
- [ ] No production alias or runtime behavior changed.
- [ ] `git diff --check` exits 0 and `git status --short` contains only Scope
      paths.
- [ ] `plans/README.md` status row is updated to `DONE` or `BLOCKED` with a
      reason.

## STOP conditions

Stop and report instead of improvising if:

- `src/lib/navigation.ts` or the Vite aliases differ materially from the
  Current state excerpts.
- Resolving the aliases requires changing production source imports or adding
  a runtime dependency rather than a test-only loader.
- `npm run check:docs-tree -- --write` would be needed to make the check pass;
  do not write the tree in this plan.
- Formatting the listed files changes generated content, public API behavior,
  or more files than the explicit scope.
- The test suite reaches assertions but exposes a failure that requires a
  route/content/security change; record it and stop at that boundary.

## Maintenance notes

- If a new Vite alias is introduced, add it to the test resolver only when a
  test imports the aliased module; keep the resolver allowlist exact.
- Keep `scripts/sync-documentation-tree.mjs` read-only by default. Review any
  future `--write` changes carefully because it rewrites a large config export.
- Plan 003 must decide whether `check-docs.mjs` becomes part of
  `release:check`; do not duplicate that integration here.
