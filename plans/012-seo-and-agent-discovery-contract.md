# Plan 012: Make search and agent discovery first-class generated artifacts

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` unless the reviewer maintains the index.
>
> **Drift check (run first)**: `git diff --stat 47380cf..HEAD -- index.html shared/seo.js src/utils/seo.ts scripts/lib/seoArtifacts.mjs scripts/generate-route-html.mjs scripts/lib/llmsArtifacts.mjs scripts/generate-llms.mjs scripts/generate-seo.mjs scripts/check-docs.mjs scripts/release-smoke.mjs scripts/preview-smoke.mjs public/_headers src/docs/content/skill.md test package.json`.
> The planned-at tree is clean at commit `47380cf`. If any in-scope file
> changed, compare the current-state excerpts below against the live code.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/010-native-content-api-parity.md (DONE)
- **Category**: docs
- **Planned at**: commit `47380cf`, 2026-08-25

## Execution note

Implemented. Route HTML and runtime navigation now share JSON-LD, canonical,
social, image-alt, and agent-alternate helpers. The build emits a checked
`/agents.json` index alongside typed collection/reference/OpenAPI manifests,
absolute URLs when `VITE_SITE_URL` is configured, honest source-owned
`skill.md`, and typed LLM summaries. Production release checks fail clearly
when host metadata is missing instead of publishing an empty sitemap.

## Why this matters

The project already emits route HTML, canonical tags, social cards, `llms.txt`,
typed collection/reference manifests, and OpenAPI artifacts, but those surfaces
are not presented as one coherent discovery contract. Route HTML has no
structured data or alternate links to the machine-readable artifacts, and the
LLM index derives summaries by taking the first line after the first heading;
that produces low-quality agent context even when typed frontmatter exists
(for example, the Installation entry is currently described by its first
requirements bullet). The hosted `public/skill.md` is also an example
placeholder rather than an honest generated description of this repository.
This plan makes human search metadata and agent entry points deterministic,
linked, and checked by the same release gates.

## Current state

- `index.html:8-53` has basic title, description, canonical, Open Graph, and
  Twitter tags. It has no JSON-LD and no `rel="alternate"` links for
  `/llms.txt`, `/skill.md`, `/docs-collection.json`, `/docs-references.json`,
  or `/openapi-artifacts.json`.
- `shared/seo.js:66-96` normalizes site URLs and builds absolute URLs, but has
  no shared metadata/alternate/structured-data contract.
- `src/utils/seo.ts:61-97` updates title, description, robots, Open Graph,
  Twitter, and canonical tags during client-side navigation. It does not
  update structured data, image alt metadata, or agent alternates.
- `scripts/generate-route-html.mjs:61-81` mirrors those tags into every
  pre-rendered route. It does not emit JSON-LD or alternates. Its preload
  stripping at lines 84-90 must remain intact.
- `scripts/lib/seoArtifacts.mjs:124-130` creates route entries with title,
  description, type, and sitemap inclusion; `createSitemapXml` at lines
  299-331 emits no entries when `VITE_SITE_URL` is absent, while
  `createRobotsTxt` at lines 333-342 omits the sitemap directive in that case.
  Keep the template's configurable-host behavior, but make the production
  requirement and output invariant explicit in tests/docs rather than
  silently shipping an empty production sitemap.
- `scripts/lib/llmsArtifacts.mjs:61-113` scans source lines after `# ` to get
  descriptions and `:117-137` writes relative doc links. It does not read the
  typed frontmatter schema already used by `scripts/lib/docsArtifacts.mjs`.
- `scripts/generate-llms.mjs:19-30` generates only `public/llms.txt` and
  `public/llms-full.txt`; it does not generate a single agent index that points
  to the collection, reference graph, OpenAPI, skill, and text exports.
- `public/skill.md:1-21` is an `example-skill` placeholder describing a generic
  product API rather than the actual static documentation/template contract.
- `public/_headers:2-8` has strong security headers, but the root and agent
  artifacts have no explicit cache/discovery policy. Existing release/preview
  smoke checks fetch the files but do not validate their metadata/discovery
  relationships.

## Commands you will need

| Purpose            | Command                                                               | Expected on success                                                     |
| ------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Architecture tests | `npm test`                                                            | all tests pass, including SEO/agent contract cases                      |
| Docs artifacts     | `npm run generate:llms && npm run generate:seo && npm run docs:check` | generators succeed; generated files match the checked contract          |
| Typecheck/lint     | `npm run type-check && npm run lint`                                  | both exit 0                                                             |
| Format             | `npm run format:check`                                                | exit 0                                                                  |
| Build              | `npm run build`                                                       | route HTML and public agent artifacts are copied to `dist/`             |
| Release/preview    | `npm run release:check && npm run release:preview-check`              | both exit 0 and validate all published discovery assets                 |
| Browser/SEO        | `npx playwright test` and `npm run lighthouse:check`                  | browser tests pass; Lighthouse SEO remains >= 0.90 on configured routes |

## Scope

**In scope** (modify only these source/config/artifact paths):

- `index.html`
- `shared/seo.js`
- `src/utils/seo.ts`
- `scripts/lib/seoArtifacts.mjs`
- `scripts/generate-route-html.mjs`
- `scripts/lib/llmsArtifacts.mjs`
- `scripts/generate-llms.mjs`
- `scripts/generate-seo.mjs` and `scripts/check-docs.mjs` only for the new
  deterministic contract
- `scripts/release-smoke.mjs` and `scripts/preview-smoke.mjs`
- `public/_headers`
- `src/docs/content/skill.md` and the generated `public/skill.md`
- a focused generated agent manifest such as `public/agents.json`, plus its
  generator/checks if the implementation chooses that name
- relevant architecture/browser tests
- `plans/README.md` status row

**Out of scope**:

- Changing route names, canonical route selection, sitemap URL semantics, or
  the static-host contract.
- Adding third-party analytics, remote fonts, remote agent services, or
  unallowlisted network origins.
- Claiming any undocumented agent protocol. Use ordinary HTTP, Markdown, and
  JSON artifacts already supported by the repository.
- Replacing Pagefind, the native content parser, or the OpenAPI security
  boundary.

## Steps

### Step 1: Define one shared discovery contract

Extend `shared/seo.js` with constants/helpers for the agent artifacts and
structured metadata. The contract should include the existing root paths:
`/llms.txt`, `/llms-full.txt`, `/skill.md`, `/docs-collection.json`,
`/docs-references.json`, and `/openapi-artifacts.json`. Include a versioned
machine-readable index (for example `/agents.json`) only if it is generated
from the same source and exposes the artifact URLs, content types, and a short
description; do not invent credentials, API operations, or unsupported agent
claims.

Add deterministic JSON-LD builders for the homepage and content routes. At
minimum, emit a `WebSite` object on `/`, a `TechArticle` (or equivalent
documentation `Article`) for docs/OpenAPI pages, and a `BreadcrumbList` when a
route has nested path segments. Use the already normalized canonical URL and
site name. Escape/serialize JSON safely for HTML script content and keep
runtime and route-HTML output on the same helper.

**Verify**: add/extend architecture tests with a fixed fixture and assert the
exact object types, canonical URL, artifact paths, and safe serialization.
`npm test` → all tests pass.

### Step 2: Apply the contract to the base and route HTML

Update `index.html` with complete social image alt metadata and deterministic
alternate links for the text/JSON agent surfaces. Keep relative placeholders
valid when no `VITE_SITE_URL` is supplied; route generation will make them
absolute in a configured deployment.

Update `scripts/generate-route-html.mjs` to upsert the same alternates and one
JSON-LD script per route, using the route entry's canonical URL, title,
description, type, and breadcrumbs. Update `src/utils/seo.ts` so client-side
navigation does not leave stale JSON-LD or stale discovery links after a route
change. Preserve the existing `noindex, nofollow` behavior for `/llms`,
`/skill`, and 404 utility pages; agent files themselves remain directly
fetchable even when their preview documentation route is noindexed.

**Verify**: `npm run build` with a configured fixture site URL, then inspect
`dist/index.html`, one nested docs route HTML, `/docs/llms`, and OpenAPI route
HTML. Each must contain one canonical link, the expected robots value, the
expected JSON-LD type, and the deterministic alternate links; `npm test` and
`npm run type-check` pass.

### Step 3: Make LLM summaries and links use typed source metadata

Change `createLlmsArtifacts` to parse each source document through the existing
frontmatter/content helper rather than taking the first post-heading line.
Prefer the typed `description`, then the shared Markdown description
extraction fallback, and finally a cleaned first paragraph. Preserve the
existing section/navigation order and full-content output. When a site URL is
configured, emit canonical absolute links; without one, retain root-relative
links for local template use.

Load the Vite environment in `scripts/generate-llms.mjs` and pass the site URL
into the artifact helper. Generate/check the agent index (if added in Step 1)
alongside the two text exports. Update `src/docs/content/skill.md` and the
hosted `public/skill.md` so they describe the real repository/template
workflow, point to the collection/reference/OpenAPI/text artifacts, and do not
pretend that the template has a product API or authentication flow.

**Verify**: `npm run generate:llms` → the Installation summary is a useful
sentence rather than a requirements bullet; `npm run docs:check` → generated
LLM/skill/agent artifacts match source; `rg -n "Example Agent Skill|primary write endpoint|Authenticate \(" public/skill.md`
returns no matches.

### Step 4: Make production URL requirements observable

Keep development and credential-free template builds usable without a site
URL, but add a clear production verification rule: a production release check
must fail with an actionable message if the configured production metadata has
no valid `VITE_SITE_URL`/owned host, or if the generated sitemap is empty while
published routes exist. If the repository convention is to supply the URL from
`PAPERS_DEPLOY_HOST` in CI, wire that explicitly in the workflow rather than
silently guessing it in source. Add a test fixture for both configured and
unconfigured modes so local `docs:check` remains deterministic.

Update `robots.txt` generation to include the sitemap directive whenever the
production URL is valid, and leave it absent only in the explicit local/no-host
mode. Add appropriate immutable or short-lived cache headers for stable agent
artifacts without weakening security headers. Do not add a blanket SPA rewrite
that would bypass route HTML.

**Verify**: positive and negative architecture/release tests cover valid host,
missing host, empty sitemap, and generated agent index; `npm run docs:check`,
`npm run release:check`, and `npm run release:preview-check` pass in the
repository's normal no-host fixture mode.

### Step 5: Add published-surface smoke coverage

Extend `scripts/release-smoke.mjs`, `scripts/preview-smoke.mjs`, and the
browser/architecture tests to check:

- root and nested route HTML have canonical, robots, Open Graph/Twitter, and
  JSON-LD metadata;
- root paths `/llms.txt`, `/llms-full.txt`, `/skill.md`,
  `/docs-collection.json`, `/docs-references.json`, `/openapi-artifacts.json`,
  and the optional `/agents.json` return the expected content type and schema;
- `robots.txt` points to `sitemap.xml` for a configured host;
- the sitemap contains canonical indexable docs/OpenAPI routes and excludes
  noindex utility aliases;
- agent summaries link to canonical docs and match the typed collection
  descriptions.

**Verify**: `npm test`, `npm run release:check`, `npm run release:preview-check`,
`npx playwright test`, and `npm run lighthouse:check` → all pass; Lighthouse
SEO is >= 0.90 on every configured URL.

## Test plan

- Model pure helper tests after the existing SEO tests in
  `test/architecture.test.ts` (fixtures, exact canonical paths, sitemap and
  robots assertions).
- Add a route-HTML fixture assertion for one homepage, one nested docs route,
  the `/docs/llms` utility route, and one OpenAPI route.
- Add an LLM fixture with frontmatter `description` plus a list-first body to
  prove the typed summary wins over the old first-line heuristic.
- Add negative coverage for missing production URL/empty sitemap and for the
  placeholder skill text returning to generated output.
- Run the full command table before declaring the plan complete.

## Done criteria

- [x] Every published HTML route has one canonical URL, correct robots value,
      complete social metadata, shared JSON-LD, and agent alternate links.
- [x] `/llms.txt` uses typed page descriptions and configured absolute URLs;
      local/no-host mode remains deterministic and root-relative.
- [x] The hosted skill file is honest, source-owned, and points agents to the
      collection, reference graph, OpenAPI, and LLM artifacts.
- [x] A single machine-readable agent index exists if introduced and is
      generated/checked with the docs pipeline.
- [x] Production verification cannot silently ship an empty sitemap or
      missing canonical host metadata.
- [x] `npm test`, `npm run type-check`, `npm run lint`,
      `npm run format:check`, `npm run docs:check`, `npm run build`,
      `npm run release:check`, `npm run release:preview-check`,
      `npx playwright test`, and `npm run lighthouse:check` pass.
- [x] No unrelated files are modified; the adjacent WOFF shell-font delivery
      hardening is recorded in `plans/README.md`, and `plans/README.md` is
      updated.

## STOP conditions

Stop and report instead of improvising if:

- The existing static-host or route HTML contract would need to change to add
  discovery links or structured data.
- A proposed agent protocol requires credentials, remote calls, or an origin
  not already allowlisted by the repository.
- A production URL requirement would break credential-free CI without an
  explicit workflow/configuration change and test fixture.
- The shared SEO helper would create a circular dependency between runtime,
  scripts, and documentation configuration.
- The current route entries cannot identify an honest title/description or
  canonical URL for a new JSON-LD object; stop and add a bounded data contract
  rather than emitting guessed metadata.

## Maintenance notes

Treat `shared/seo.js` and the generated agent manifest as the single discovery
contract. Any new artifact, collection, API spec, locale, or version must add
its canonical URL, content type, and inclusion/noindex decision there and gain
one fixture assertion. Review structured data and `llms.txt` output whenever
frontmatter schema or route variants change. Keep the hosted skill focused on
document navigation and supported repository operations; product-specific auth
instructions belong in a consuming project's own generated skill.
