# Plan 006: Make post-promotion release truth authoritative

> Executor instructions: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If
> anything in the STOP conditions section occurs, stop and report; do not
> improvise. When done, update the status row for this plan in
> plans/README.md.
>
> Drift check (run first): git diff --stat 3f2e086..HEAD -- package.json
> package-lock.json test scripts src/pages .github/workflows wrangler.toml
> RELEASING.md

## Status

- Priority: P0
- Effort: M
- Risk: HIGH
- Depends on: plans/002-unify-route-and-html-contract.md and
  plans/004-security-and-host-hardening.md
- Category: correctness, deployment, tests, docs, dx
- Planned at: commit 3f2e086, 2026-08-24

## Why this matters

The repository now has a green CI validation run, but the release truth is not
yet trustworthy. The Cloudflare deployment run failed because the required API
token was not supplied, while the public pages.dev host serves a different
Phantasy product and does not match the checked-in application. Locally,
release:check can pass against an old ignored dist directory, tests rely on an
undeclared direct ts-node import, and invalid documentation/OpenAPI routes can
silently render fallback content. This plan makes a build self-identifying,
makes invalid routes fail explicitly, and makes deployment verification prove
that the host serves the artifact produced by the repository.

## Current state

The executor must confirm these excerpts before editing:

- package.json — the build and release commands. The current build ends with
  generate:route-html and generate:pagefind. release:check runs docs:check,
  check:docs-tree, release:artifact-check, and release:preview-check, but does
  not prove that dist was freshly produced by the current checkout.
- test/register-ts-node.mjs — directly imports
  ts-node/esm/transpile-only, while package.json does not declare ts-node as a
  direct development dependency. On this workspace, npm test fails before test
  discovery with ERR_MODULE_NOT_FOUND for ts-node. A clean CI run passed on
  Node 18 and Node 20 because npm materialized an optional peer; do not treat
  that as a valid manifest contract.
- scripts/release-smoke.mjs — checks that dist files exist, reads generated
  docs-index.json, and checks selected canonical tags. It does not check a
  build identity, source revision, input fingerprint, or artifact freshness.
- scripts/preview-smoke.mjs — serves the current dist directory and checks
  selected routes/assets. It likewise accepts any pre-existing dist directory.
- scripts/generate-route-html.mjs and scripts/lib/routeHtmlPaths.mjs — emit
  route snapshots as dist/<route>.html, not only nested index.html files.
- src/pages/DocsPage.tsx — a missing document currently creates a Not Found
  Markdown placeholder inside the normal documentation shell.
- src/App.tsx and src/pages/OpenApiPage.tsx — the route accepts an optional
  OpenAPI spec id; unknown ids currently fall through to the configured default
  spec, so the intended invalid-spec branch is unreachable.
- src/pages/NotFoundPage.tsx — the user-facing not-found page exists, but
  missing docs do not consistently use it.
- RELEASING.md, src/docs/content/deployment/overview.md,
  src/docs/content/user-guide/troubleshooting.md, and
  src/pages/NotFoundPage.tsx — some text still instructs maintainers to expect
  dist/docs/\*\*/index.html and dist/llms/index.html, which is stale for the
  route snapshot contract.
- .github/workflows/ci.yml — builds and runs release checks, but its Lighthouse
  action has no URL, server command, or committed configuration.
- .github/workflows/deploy.yml — deploys the uploaded dist artifact to
  Cloudflare only on a push to main. It requires CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_PROJECT_NAME; the observed deployment
  run failed with a missing API token.
- wrangler.toml — names the project papers-docs, while the workflow separately
  takes the project name from a secret. There is no single checked contract
  tying project identity, canonical host, and post-deploy verification together.
- The current public host papers-docs.pages.dev was checked on 2026-08-24 and
  returned the old Phantasy Docs title/content and older headers. No Vercel
  preview URL was available. This is a deployment ownership/host-selection
  blocker, not evidence that local HTML is correct.

Repository conventions to preserve:

- npm scripts are the source of truth for local gates; CI uses npm ci and
  Node 18/20.
- Generated content is written by scripts under scripts/ and validated by
  scripts/lib/contentValidation.mjs. Use existing ESM modules and the assert
  style in release-smoke.mjs/preview-smoke.mjs.
- Route snapshots are canonical files produced by
  scripts/lib/routeHtmlPaths.mjs. Do not reintroduce a second route naming
  convention merely to satisfy old documentation.
- This plan is about release correctness and deployment identity. Mermaid
  sanitization and OpenAPI URL validation belong to Plan 007. Broad asset and
  Lighthouse work belongs to Plan 005.

## Commands you will need

| Purpose       | Command                                                                                                                             | Expected on success                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Drift         | git diff --stat 3f2e086..HEAD -- package.json package-lock.json test scripts src/pages .github/workflows wrangler.toml RELEASING.md | Empty, or only reviewed changes                        |
| Install       | npm ci                                                                                                                              | Exit 0 from a clean checkout                           |
| Tests         | npm test                                                                                                                            | Exit 0 and discovers all tests                         |
| Typecheck     | npm run type-check                                                                                                                  | Exit 0                                                 |
| Build         | npm run build                                                                                                                       | Exit 0 and writes a manifest identifying this checkout |
| Release gates | npm run release:check                                                                                                               | Exit 0 only for the current build                      |
| Preview gates | npm run release:preview-check                                                                                                       | Exit 0 against a freshly built dist                    |
| Diff hygiene  | git diff --check                                                                                                                    | Exit 0                                                 |

## Scope

In scope (the only product files this plan should modify):

- package.json
- package-lock.json
- test/register-ts-node.mjs
- scripts/lib/buildIdentity.mjs (create if needed)
- scripts/write-build-manifest.mjs (create if needed)
- scripts/generate-route-html.mjs
- scripts/release-smoke.mjs
- scripts/preview-smoke.mjs
- src/App.tsx
- src/pages/DocsPage.tsx
- src/pages/OpenApiPage.tsx
- src/pages/NotFoundPage.tsx
- src/docs/content/deployment/overview.md
- src/docs/content/user-guide/troubleshooting.md
- RELEASING.md
- .github/workflows/ci.yml
- .github/workflows/deploy.yml
- wrangler.toml
- test/architecture.test.ts (extend the existing architectureTests array for
  release/route behavior)

Out of scope:

- Mermaid rendering policy, SVG sanitization, or OpenAPI URL allowlists; use
  Plan 007.
- Generic-template cleanup, fonts, bundle budgets, browser coverage, and
  Lighthouse configuration; use Plan 005.
- A broad Fumadocs migration; use Plan 008 after the current static contract
  is reliable.
- Deploying to an unverified public host, changing DNS, creating cloud
  credentials, or committing secret values. Stop when operator access is
  required.

## Git workflow

- Branch: advisor/006-post-promotion-release-truth
- Make commits per logical unit if the operator is executing this plan.
- Do not push, merge, or deploy unless the operator separately instructs it.

## Steps

### Step 1: Make the test bootstrap a declared dependency

Add ts-node as a direct development dependency at the version already resolved
in package-lock.json, or update both manifests consistently to the current
supported version if the lockfile has no usable entry. Keep
test/register-ts-node.mjs importing the declared package, and add a focused
test or manifest check proving a clean npm ci has the loader available before
test discovery.

Verify: npm ci && npm test -> exit 0; the test command reports the existing
test suite rather than ERR_MODULE_NOT_FOUND.

### Step 2: Emit and verify a build identity manifest

Create one small helper used by the build and smoke checks. It must record at
least the source revision when available, a deterministic input fingerprint,
the build mode, the Node/npm tool versions, and the route/content generator
version. Do not record environment secrets. Emit the manifest into dist at
the end of the build after all generated files exist, and fail if a required
identity value cannot be derived in CI. Use a stable schema such as
dist/build-manifest.json; document the fields in RELEASING.md.

The fingerprint must include the source/config inputs that affect published
HTML, generated docs, theme resolution, headers, and route snapshots. It must
not include dist itself, timestamps, or nondeterministic ordering. The smoke
checks must compare the manifest against the current checkout and the
expected build mode. A local build without a Git commit may use an explicit
documented dirty/unknown revision marker, but CI must identify the commit.

Verify: npm run build && node -e "const m=require('./dist/build-manifest.json'); if (!m.sourceRevision || !m.inputFingerprint) process.exit(1)" -> exit 0; changing a tracked input and rerunning the checker without rebuilding -> non-zero.

### Step 3: Make release checks reject stale or incomplete dist output

Update scripts/release-smoke.mjs and scripts/preview-smoke.mjs to require the
manifest and verify its identity before checking routes. They must also reject
missing or stale generated route files, stale docs-index/content JSON, and
missing asset references for the current build. Preserve the existing checks
for canonical tags, local theme initialization, local Iconify behavior,
headers, Pagefind, llms, skill, sitemap, and OpenAPI assets.

Keep the check deterministic and independent of network access. If the build
was made from a dirty worktree, fail with a message that tells the operator to
run a clean release build rather than silently accepting it. The purpose is
to prevent a successful release:check from being produced by the ignored
77 MB dist directory currently present in this workspace.

Verify: npm run build && npm run release:check && npm run release:preview-check -> all exit 0; delete or alter dist/build-manifest.json and rerun either check -> non-zero with an actionable message.

### Step 4: Make invalid docs and OpenAPI routes explicit

Change src/pages/DocsPage.tsx so a missing document uses the shared not-found
rendering path or an equivalent explicit 404 result, rather than rendering a
normal documentation page whose Markdown happens to say Not Found. Preserve
the existing application shell and accessible navigation.

Change src/App.tsx and src/pages/OpenApiPage.tsx so an unknown spec id does not
fall back to the default spec. It must render the not-found state and must not
instantiate Scalar for a different spec. Keep the no-id default route behavior.
Add route-level tests for a missing document, an unknown OpenAPI id, and the
configured default OpenAPI route. If the static HTML generator needs a
corresponding invalid-route policy, make it fail the build for an invalid
configured route rather than generating misleading content.

Verify: npm test -> all tests pass, including explicit assertions that missing
docs and unknown spec ids do not render another document/spec; npm run build ->
exit 0.

### Step 5: Align release documentation and deployment identity

Replace stale index.html route examples in the listed documentation with the
actual route snapshot contract. State which host is supported, which URL is
canonical, and which checks prove that host serves the current artifact.

Choose one authoritative project/host configuration. Prefer deriving the
Cloudflare project name from wrangler.toml or a checked configuration file and
derive the expected public host from an explicit environment input; do not
silently assume that the old pages.dev host belongs to this repository. Add a
preflight step in the trusted deploy job that fails before deployment when
required credential names or the expected host/project identity are absent.
Keep credentials out of pull-request jobs and logs. Add a post-deploy check
that consumes the configured host and verifies the build manifest and at least
home, a deep docs route, an OpenAPI route, and the response headers. If the
repository cannot control a host, leave deployment disabled and report the
exact operator action required; do not point checks at the known mismatched
host.

Verify: npm run format:check && npm run type-check && npm run release:check ->
exit 0; a deployment configuration test with missing identity -> non-zero
before cloud action; the trusted deployment workflow remains the only path
with Cloudflare secrets; a post-deploy run against the owned host proves the
manifest revision matches the release commit.

### Step 6: Run the clean-checkout release proof

From a clean checkout of the final commit, run npm ci, npm test, lint,
format:check, type-check, build, docs:check, check:docs-tree, release:check,
and release:preview-check. Inspect git status and the generated manifest.
Run the direct host proof only after the operator supplies or confirms an
owned canonical host and the required deployment credentials are configured.

Verify: every local gate exits 0; git diff --check exits 0; no generated
artifacts are accidentally tracked; the host proof either passes with the
current commit or stops with a documented ownership/credential blocker.

## Test plan

- Extend the existing test/run-tests.mjs discovery path with focused coverage
  for manifest creation/verification, stale dist rejection, invalid document
  handling, and unknown OpenAPI spec handling.
- Add cases for a clean Git revision, a changed input fingerprint, a missing
  manifest, and an explicit local dirty/unknown revision policy.
- Exercise the existing release-smoke and preview-smoke scripts after a
  production build; do not replace these checks with unit tests only.
- Use npm ci in a disposable checkout or CI-equivalent environment to prove
  the direct ts-node dependency is present.

## Done criteria

- [ ] npm ci followed by npm test exits 0 in a clean checkout without relying
      on an optional peer dependency.
- [ ] npm run build writes a secret-free build-manifest.json with a source
      revision and deterministic input fingerprint.
- [ ] release:check and release:preview-check reject missing, stale, or
      mismatched dist output and pass for a fresh build.
- [ ] Missing docs and unknown OpenAPI ids use explicit not-found behavior and
      cannot silently render the default/another spec.
- [ ] All active documentation uses the current .html route snapshot naming.
- [ ] CI validates the artifact that deploy will use; PR jobs do not receive
      Cloudflare credentials.
- [ ] One authoritative project/host identity is documented and checked before
      deployment; post-deploy checks prove current revision, routes, and
      headers on the owned host.
- [ ] npm test, npm run lint, npm run format:check, npm run type-check,
      npm run build, npm run docs:check, npm run check:docs-tree,
      npm run release:check, and npm run release:preview-check pass.
- [ ] No files outside the Scope list are modified, except the plan status
      row in plans/README.md.

## STOP conditions

Stop and report if:

- The drift check shows an unreviewed change in an in-scope file or the
  current route/build excerpts no longer match.
- Adding a direct test dependency requires an unrelated package migration or
  changes the supported Node range.
- A deterministic fingerprint would need secrets, timestamps, dist contents,
  or network state.
- Static hosting cannot represent an explicit invalid-route response without
  an operator decision about redirects/rewrites.
- The expected Cloudflare project or canonical host is not controlled by this
  repository, the required credential names are unavailable, or the known
  pages.dev host still serves another product.
- The post-deploy proof would need to accept a different product, a stale
  build, or an unverified host.
- Any fix requires Mermaid/security-boundary changes, broad performance work,
  or a Fumadocs migration outside this plan's scope.

## Maintenance notes

- Any new generator that changes published HTML or JSON must be included in
  the build fingerprint inputs and must run before manifest emission.
- Keep the manifest schema versioned; changing its meaning should fail old
  smoke checks clearly rather than silently accepting incompatible artifacts.
- Reviewers should inspect that the deploy job consumes the exact uploaded
  artifact validated by CI and that host identity is not inferred from a
  secret with no checked reference.
- Plan 007 still owns content security and URL-boundary correctness; Plan 005
  still owns performance/browser budgets; Plan 008 owns the content-engine
  direction decision.
