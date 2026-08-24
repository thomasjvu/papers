# Plan 002: Make routes and published HTML obey one contract

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c0f4e52..HEAD -- src/App.tsx src/lib/openapi.ts src/pages/OpenApiPage.tsx shared scripts/generate-route-html.mjs scripts/release-smoke.mjs scripts/preview-smoke.mjs vercel.json RELEASING.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P0
- **Effort**: M (roughly one to two days, including a production build and
  host-adapter checks)
- **Risk**: MED — changing canonical paths and static-file naming can affect
  bookmarks, SEO, host rewrites, and generated links.
- **Depends on**: `plans/001-restore-verification-baseline.md`
- **Category**: correctness | deployment | tech-debt | tests
- **Planned at**: commit `c0f4e52`, 2026-08-23

## Why this matters

The app, SEO generator, docs, and release smoke checks disagree about where
the OpenAPI page lives and how a clean route maps to a file. The React route is
`/docs/api-reference/openapi`, while `src/lib/openapi.ts` and SEO generation
default to `/api`; the HTML generator writes `dist/<route>.html`, while the
release smoke check looks for `dist/<route>/index.html`. This can produce
working client navigation but broken direct loads, wrong canonical/sitemap
entries, or a release gate that never validates the artifact actually sent by
the host.

## Current state

- `src/App.tsx:31-37` mounts OpenAPI at
  `/docs/${openapiConfig.pagePath}/:specId?` and mounts ordinary docs below
  `/docs/*`.
- `shared/documentation-config.js:99-117` sets `pagePath` to
  `api-reference/openapi`, but does not set `routePrefix`.
- `src/lib/openapi.ts:3-14` therefore defaults the OpenAPI base path to `/api`
  and constructs `/api/<specId>`.
- `src/pages/OpenApiPage.tsx:32-43` uses that `/api` helper for canonical SEO,
  while lines 47, 55, and 69 navigate to `/docs/reference/routes`, a route
  that is not declared in `src/App.tsx` or the documentation tree.
- `scripts/lib/seoArtifacts.mjs:236-259` independently defaults OpenAPI SEO
  entries to `/api`, so route HTML, sitemap, and React metadata can disagree.
- `src/docs/content/api-reference/openapi.md:8` documents
  `/docs/api-reference/openapi`, which confirms the intended default route is
  the page-path route, not `/api`.
- `scripts/generate-route-html.mjs:77-90` deliberately writes non-root routes
  as `dist/<route>.html` to avoid Cloudflare treating a final `index` segment
  as a directory. It therefore emits `dist/docs.html`,
  `dist/docs/getting-started/installation.html`, `dist/llms.html`, and
  `dist/skill.html`.
- `scripts/release-smoke.mjs:28-43` still maps a clean route to
  `dist/<route>/index.html`, and lines 51-52 explicitly require
  `dist/llms/index.html` and `dist/skill/index.html`. This is incompatible
  with the generator.
- `scripts/preview-smoke.mjs:55-76` happens to support direct files, directory
  indexes, and `.html`, but its broader fallback masks the release-smoke
  mismatch instead of defining the canonical contract.
- `RELEASING.md:27-34` still tells maintainers to inspect directory-index HTML.
- `vercel.json:3-11` rewrites every `/docs/:path*` request to `/`, which may
  bypass route-specific HTML metadata depending on Vercel's filesystem and
  rewrite ordering. This must be verified or replaced with a filesystem-safe
  fallback.

## Commands you will need

| Purpose           | Command                                                                                                            | Expected on success                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Tests             | `npm test`                                                                                                         | all architecture tests pass                                      |
| Types             | `npm run type-check`                                                                                               | exit 0                                                           |
| Build             | `npm run build`                                                                                                    | exit 0; route HTML is emitted under `dist/`                      |
| Artifact smoke    | `npm run release:artifact-check`                                                                                   | exit 0; checks the same `.html` contract as the generator        |
| Preview smoke     | `npm run release:preview-check`                                                                                    | exit 0; direct clean routes return the intended HTML             |
| Release gate      | `npm run release:check`                                                                                            | exit 0 after Plan 001's tree gate and this plan's smoke checks   |
| Static inspection | `find dist -type f \( -name 'docs.html' -o -path 'dist/docs/\*.html' -o -name 'llms.html' -o -name 'skill.html' \) | sort`                                                            | expected route files exist; no required route is only an index directory |
| Scope             | `git status --short`                                                                                               | only Scope paths plus deliberate generated artifacts are changed |

## Scope

**In scope — the executor may modify or add only these paths:**

- `shared/openapiRouting.js` (new) — one route contract consumed by app and
  build scripts.
- `src/lib/openapi.ts`, `src/App.tsx`, and `src/pages/OpenApiPage.tsx` — use
  the shared OpenAPI path and a real docs fallback.
- `scripts/lib/routeHtmlPaths.mjs` (new),
  `scripts/generate-route-html.mjs`, `scripts/release-smoke.mjs`, and
  `scripts/preview-smoke.mjs` — one clean-route-to-dist-file mapping.
- `scripts/lib/seoArtifacts.mjs` — consume the shared OpenAPI route helper.
- `RELEASING.md` and `vercel.json` — document/enforce the selected static-host
  behavior.
- `test/architecture.test.ts` — route and path regression cases.

**Out of scope:**

- Do not change docs content generation, frontmatter parsing, generated JSON,
  LLM exports, or Pagefind; Plan 003 owns those artifacts.
- Do not add a server runtime or SSR. This plan keeps the static/CDN-first
  architecture.
- Do not silently preserve `/api` as an indexed/canonical route. If a
  backwards-compatible redirect is desired, record it as an explicit alias
  with a test and a migration note.
- Do not deploy or change Cloudflare secrets from this plan. Plan 004 owns
  deployment identity and PR-secret handling.

## Git workflow

- Branch: `advisor/002-route-html-contract` (or the operator's established
  convention).
- Match the repository's conventional commit style.
- Do not commit, push, or open a PR unless explicitly asked.

## Steps

### Step 1: Define one OpenAPI route source of truth

Create `shared/openapiRouting.js` with pure helpers that accept the existing
`openapiConfig` shape. The default public base must be
`/docs/${openapiConfig.pagePath}`; `routePrefix` may remain an explicit full
route override, but it must be normalized consistently and documented. The
default spec ID must map to the base path, while any other configured spec ID
must append one encoded path segment. Keep the helper free of React imports so
Node build scripts can use it.

Make `src/lib/openapi.ts` re-export or wrap those helpers with TypeScript
types. Update `src/App.tsx`, `src/pages/OpenApiPage.tsx`, and
`scripts/lib/seoArtifacts.mjs` to use the same helper. Replace the nonexistent
`/docs/reference/routes` fallback/back link with `/docs` or the canonical docs
landing helper already used by `src/App.tsx:24-30`.

**Verify**: `npm test` → route tests pass; `npm run type-check` → exit 0;
`rg -n "routePrefix.*'/api'|/docs/reference/routes|buildOpenApiRoutePath" src scripts shared` → no stale hardcoded `/api` default or nonexistent fallback remains, except the single shared helper and its tests.

### Step 2: Share the route-to-file mapping

Create a small `scripts/lib/routeHtmlPaths.mjs` helper used by the generator,
release smoke, and preview smoke. Its canonical mapping must be:

- `/` → `dist/index.html`.
- `/some/path` → `dist/some/path.html`.
- an already explicit `.html` route → the corresponding file under `dist`.

Do not reintroduce `index.html` for ordinary route snapshots; the existing
generator comment at `scripts/generate-route-html.mjs:78-81` records why the
`.html` convention exists. Preview resolution may retain a directory-index
fallback only as a compatibility diagnostic, but release smoke must assert the
canonical `.html` file.

**Verify**: `npm run type-check` → exit 0 if the helper is imported by typed
test code; `npm test` → all path mapping cases pass; `rg -n "routePath.*index\.html|llms.*index|skill.*index" scripts RELEASING.md` → no production expectation still requires the old directory layout.

### Step 3: Make smoke checks cover the routes that can drift

Update `scripts/release-smoke.mjs` to use the shared mapping and assert
`dist/llms.html` and `dist/skill.html`. Add checks for:

- `/docs` and the default docs page;
- `/docs/llms` and `/docs/skill` route HTML;
- the default OpenAPI route and every non-default configured spec route;
- canonical tags for a default docs route and both OpenAPI spec variants;
- the local OpenAPI YAML assets and `dist/pagefind/` after the build.

Keep `scripts/preview-smoke.mjs` as an HTTP-level check, but make it resolve
files with the same helper and explicitly request the OpenAPI routes. A
successful smoke test must prove that a direct request gets route metadata,
not merely the root SPA shell.

**Verify**: after a build, `npm run release:artifact-check` and
`npm run release:preview-check` → both exit 0; `node scripts/release-smoke.mjs`
run with a missing route fixture → exits nonzero with the route name in the
error.

### Step 4: Resolve host adapters instead of relying on accidental rewrites

Update `RELEASING.md` to describe `.html` snapshots and the clean URLs they
serve. For Vercel, verify whether the current `vercel.json` rewrite runs after
static-file resolution. If it can shadow `dist/docs/*.html`, replace it with a
filesystem-first configuration supported by the host; if clean `.html` files
cannot be served without a rewrite, encode that rewrite explicitly and test
that route-specific HTML wins. Do not claim both Vercel and Cloudflare support
until a direct deep request and a crawler-visible canonical response have been
checked for each.

The chosen contract must be written down in `RELEASING.md`, including what
`/docs`, `/docs/<page>`, `/docs/llms`, `/docs/skill`, and the OpenAPI routes
return on a direct request.

**Verify**: local `npm run release:preview-check` → exit 0; for each supported
host, a deployed or preview URL returns HTTP 200 for `/`, `/docs`, one deep
docs route, `/docs/llms`, `/docs/skill`, and the OpenAPI route, with the
expected `<link rel="canonical">` in the response body.

### Step 5: Regenerate and inspect the route artifacts

Run the full production build after the route contract is stable. Inspect the
diff for canonical URL changes and ensure no unrelated content rewrite is
smuggled into this plan. Generated public artifacts may change because SEO
routes are intentionally corrected; content JSON drift belongs to Plan 003.

**Verify**: `npm run build && npm run release:check` → exit 0; the static
inspection command in the table shows `.html` route files; `git diff --check`
→ no whitespace errors.

## Test plan

- Add pure helper tests for default OpenAPI route, alternate spec route,
  explicit route override, root route, clean route, and explicit `.html` route.
- Add a regression case proving `/docs/reference/routes` is not emitted or
  linked by the OpenAPI page.
- Extend release/preview smoke coverage for OpenAPI and AI asset routes.
- Use the existing direct assertion style in
  `test/architecture.test.ts:425-849` and the current smoke scripts as the
  structural pattern.

## Done criteria

- [ ] React routing, SEO metadata, sitemap entries, route HTML, docs text, and
      smoke checks all agree on `/docs/api-reference/openapi` by default.
- [ ] A configured non-default spec has one predictable route with the same
      route in React, metadata, and static HTML.
- [ ] `dist/llms.html` and `dist/skill.html` are the release artifacts, and
      smoke checks no longer require `llms/index.html` or `skill/index.html`.
- [ ] No hardcoded `/docs/reference/routes` remains.
- [ ] `npm test`, `npm run type-check`, `npm run build`,
      `npm run release:check`, and `npm run release:preview-check` exit 0.
- [ ] At least one direct deep route and one OpenAPI route are verified on each
      host still named as supported in `RELEASING.md`.
- [ ] `plans/README.md` status row is updated to `DONE` or `BLOCKED` with a
      reason.

## STOP conditions

Stop and report instead of improvising if:

- The operator wants `/api` to remain the public canonical OpenAPI route; that
  is a product/API URL decision requiring explicit direction and redirects.
- Vercel or Cloudflare behavior cannot be verified from an available preview;
  do not mark host support green based only on local SPA navigation.
- The build emits both route layouts for compatibility without a clear
  redirect/canonical policy; stop and ask for a URL migration decision.
- A route helper change requires modifying generated content or unrelated
  product configuration outside Scope.
- The generated route list contains a path that cannot be represented safely
  under the `.html` convention; report the exact path before changing the
  naming scheme.

## Maintenance notes

- Any new collection or non-doc route must use the shared route-to-file helper
  and add one smoke assertion if it is expected to be directly crawlable.
- `openapiConfig.pagePath` and `routePrefix` must not become two independent
  defaults again; document explicit overrides when adding them.
- If the host changes from static Pages/Vercel, add a host adapter test before
  changing the artifact naming convention.
