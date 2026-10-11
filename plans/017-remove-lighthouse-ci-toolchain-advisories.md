# Plan 017: Replace the vulnerable Lighthouse CI wrapper with the maintained Lighthouse runner

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. Touch
> only the files listed in Scope. If a STOP condition occurs, stop and report
> instead of improvising.
>
> **Drift check (run first)**:
> `git diff --stat a3d207c -- package.json package-lock.json lighthouserc.cjs .github/workflows/ci.yml scripts`.
> The current checkout has additional uncommitted feature work; preserve it.
> Compare the live files to Current state before editing. If the Lighthouse
> commands or CI shape differ materially, stop and report.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/016-hard-quality-performance-gates.md
- **Category**: security | perf | dx
- **Status**: DONE — maintained Lighthouse runner, private reports, and clean full/runtime audits verified 2026-08-25
- **Planned at**: commit `a3d207c`, 2026-08-25

## Why this matters

The shipped browser bundle has a clean production audit, but the repository's
full audit reports ten development-tool advisories, including seven high
findings, through `@lhci/cli` 0.15.1 and its old Lighthouse/Puppeteer
dependency chain. These tools run in CI and on maintainer machines, so
documenting them as dev-only is not the same as removing the reachable
vulnerable tree. Replace the wrapper with the maintained Lighthouse package and
a small local runner that keeps the current four-route budget contract and
private CI report retention.

## Current state

- `package.json` declares `@lhci/cli` `^0.15.1` and exposes
  `lighthouse:check: lhci autorun`.
- `lighthouserc.cjs` starts the Vite preview, uses Playwright's Chromium path,
  audits `/`, `/docs`, `/docs/getting-started/introduction`, and
  `/docs/api-reference/openapi`, and asserts accessibility,
  best-practices, and SEO at 0.9, performance at 0.7 as a warning, and total
  transfer below 12 MB.
- `.github/workflows/ci.yml` downloads the validated `dist/` build, runs
  `treosh/lighthouse-ci-action@v11` with `uploadArtifacts: false`, and
  uploads `.lighthouseci/` privately for seven days.
- `npm audit --json` reports ten reachable dev-only findings through
  `@lhci/cli`, `@lhci/utils`, Lighthouse 12.6.1, Puppeteer 24.43.1,
  `extract-zip`, `tmp`, `uuid`, `inquirer`, and
  `external-editor`. `npm audit --omit=dev --audit-level=high --json` is
  already clean and must remain clean.
- The repository uses Node >=22. Lighthouse 13.4.1 requires Node >=22.19;
  keep the existing Node 22 CI matrix compatible and do not silently require
  Node 24.

## Commands you will need

| Purpose       | Command                             | Expected on success                           |
| ------------- | ----------------------------------- | --------------------------------------------- |
| Install       | `npm ci`                            | exit 0 and lockfile is honored                |
| Tests         | `npm test`                          | 41 or more tests pass                         |
| Type check    | `npm run type-check`                | exit 0                                        |
| Lint          | `npm run lint`                      | exit 0                                        |
| Format        | `npm run format:check`              | exit 0                                        |
| Build         | `NODE_ENV=production npm run build` | fresh production build completes              |
| Runtime audit | `npm run check:runtime-audit`       | zero runtime vulnerabilities                  |
| Full audit    | `npm audit --audit-level=high`      | no high/critical findings                     |
| Lighthouse    | `npm run lighthouse:check`          | four routes audited and local reports written |
| Release       | `npm run release:check`             | all release checks pass after a fresh build   |

## Scope

**In scope (only these files; create files where noted):**

- `package.json`
- `package-lock.json`
- `lighthouserc.cjs`
- `scripts/lighthouse-check.mjs` (create)
- `.github/workflows/ci.yml`
- `RELEASING.md`

**Out of scope:**

- Production React components, generated artifacts, content, routes, CSP, and
  OpenAPI behavior.
- Any `npm audit` suppression, audit-level relaxation, or dependency override
  that leaves the vulnerable packages installed.
- Changing the four audited URLs or lowering any existing assertion.
- Deploying, publishing npm, pushing git, or changing external credentials.

## Steps

### Step 1: Replace the Lighthouse CI dependency

Remove the direct `@lhci/cli` development dependency and add the maintained
`lighthouse` package at the current 13.x release compatible with Node 22.19+
(use the version resolved during implementation). Do not add Puppeteer
separately: the runner must use the browser executable already provided by
Playwright. Regenerate the lockfile reproducibly and inspect the tree to ensure
`@lhci/cli`, `@lhci/utils`, `inquirer`, `external-editor`, and the old
Puppeteer extraction chain are absent.

**Verify**: `npm ls @lhci/cli @lhci/utils lighthouse puppeteer-core @puppeteer/browsers extract-zip tmp uuid --all` -> only the intended maintained Lighthouse tree is present; the old wrapper and extraction/editor packages are absent.

### Step 2: Implement the local Lighthouse gate

Create `scripts/lighthouse-check.mjs` as an ESM Node 22 script. It must:

1. read the route list and assertions from `lighthouserc.cjs` or a shared
   exported configuration, without duplicating the URL list;
2. start `npm run preview -- --host 127.0.0.1` only when a server is not
   already available, wait for readiness, and always clean up the child process;
3. invoke Lighthouse once per URL using `chromium.executablePath()` from
   Playwright, writing JSON and HTML under `.lighthouseci/`;
4. evaluate the current category and byte assertions, print a compact
   route-by-route summary, and return nonzero for an error assertion or hard
   failure; performance remains the current warning threshold;
5. write reports locally only. Do not upload to a public Lighthouse service.

Use stable process/HTTP cleanup and make repeated invocations safe. If the
Lighthouse 13 API cannot run against the current Chromium path or cannot
produce equivalent assertion values, stop and report rather than reintroducing
`@lhci/cli`.

**Verify**: `npm run lighthouse:check` -> four route summaries, local
`.lighthouseci/` JSON/HTML reports, exit 0, and no public upload.

### Step 3: Update CI

Replace `treosh/lighthouse-ci-action@v11` with a shell step invoking
`npm run lighthouse:check`. Keep the validated build download and the
private seven-day `actions/upload-artifact@v4` upload of
`.lighthouseci/`. Do not add third-party upload tokens or public report
storage. Keep browser installation and Node 22 unchanged.

**Verify**: `rg -n "lhci|treosh|temporary-public-storage|lighthouse:check|Upload private" .github/workflows/ci.yml package.json lighthouserc.cjs` -> no LHCI/action invocation or public upload remains; the private report step and local gate are present.

### Step 4: Document the maintainer workflow

Update `RELEASING.md` so the release checklist and security contract describe
`npm run lighthouse:check`, the maintained Lighthouse package, local/private
reports, and the expectation that runtime and development audits are clean.
Do not claim live-host proof or npm publication; those remain the external
Plan 006/013 prerequisites.

**Verify**: `rg -n "lighthouse:check|private|npm audit|@lhci/cli|temporary-public" RELEASING.md` -> the new command and privacy contract are documented and obsolete LHCI/public-storage instructions are absent.

### Step 5: Run the complete local gate

Run the Commands table from a clean dependency/build state. If Lighthouse
reports performance warnings but all existing error assertions pass, preserve
the warnings; do not change the threshold to create a false green.

**Verify**: `npm test && npm run lint && npm run format:check && npm run type-check && NODE_ENV=production npm run build && npm run release:check && npm run lighthouse:check && npm audit --audit-level=high` -> all commands exit 0 and both runtime and full audits report zero high/critical vulnerabilities.

## Test plan

- Keep the existing unit/architecture suite unless a focused test is needed
  for assertion parsing or report cleanup.
- Run `CI=true npx playwright test` after the clean build; all existing tests
  must pass, including generated OpenAPI routes, deferred Scalar,
  keyboard/reduced-motion, mobile, and 404 cases.
- Verify all four Lighthouse reports contain category scores and byte metrics.

## Done criteria

- [x] `@lhci/cli` and its old vulnerable wrapper chain are removed from the lockfile.
- [x] `npm audit --audit-level=high` exits 0 with no high/critical findings.
- [x] `npm run check:runtime-audit` remains clean.
- [x] `npm run lighthouse:check` audits all four routes, writes private reports, and preserves assertions.
- [x] CI reuses the validated build and uploads Lighthouse reports privately for seven days.
- [x] Tests, lint, format, type-check, clean build, release checks, and browser smoke pass.
- [x] No files outside Scope are modified.

## STOP conditions

- Lighthouse 13.x requires a Node version higher than the repository's Node 22
  CI matrix.
- Removing `@lhci/cli` requires changing route coverage, assertions, or the
  private report policy.
- The maintained Lighthouse tree still has a high/critical advisory and no
  patched release exists; report the exact chain rather than adding an ignore.
- The runner cannot clean up its preview server or writes reports publicly.
- Any verification command fails twice, or the change requires touching files
  outside Scope.

## Maintenance notes

Upgrade Lighthouse and the Playwright browser as a reviewed compatibility pair.
Review the runner for child-process cleanup, report path traversal, and
assertion drift. Keep the four-route set aligned with `lighthouserc.cjs); any
new public route should add browser coverage and a matching performance budget.
