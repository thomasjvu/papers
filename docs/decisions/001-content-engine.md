# ADR 001: Keep the native content engine and add bounded parity seams

- **Status:** Accepted
- **Date:** 2026-08-24
- **Decision owner:** papers maintainers
- **Scope:** content parsing, metadata, references, OpenAPI depth, and static artifacts

## Decision

Keep the current project-owned Markdown/MDX pipeline as the source of truth.
Improve it incrementally with typed metadata, reference extraction, and a
small adapter seam for capabilities that are not safe to couple directly to
the renderer. Preserve the existing Vite build, clean route URLs, generated
JSON, route HTML, Pagefind, LLM exports, theme system, design book, and static
CDN deployment contract.

This is the **Native** option in the plan's decision set. A future bounded
hybrid can be evaluated behind the artifact adapter, but no external content
engine becomes a production dependency or a second source of truth without a
new ADR and a dual-build diff gate.

## Implementation status — 2026-08-25

The two bounded parity milestones have now landed on the native path:

- `shared/contentSchema.js` validates typed frontmatter and
  `public/docs-collection.json` publishes a versioned collection manifest with
  entries and navigation metadata.
- `public/docs-references.json` is generated from the same link extraction used
  by validation and powers runtime backlinks.
- `public/openapi-artifacts.json` deterministically summarizes local OpenAPI
  operations, parameters, request bodies, responses, examples, tags, servers,
  and component schemas. The existing Scalar viewer remains the interactive
  surface.

These capabilities close the previously identified native gaps without
renaming the existing JSON, route HTML, or static-host artifacts. They improve
the project-specific parity score, but do not claim equivalence with every
Fumadocs plugin, framework integration, or generated API playground feature.

## Why this is the right boundary

papers is already strong where a static documentation product needs control:
it owns the visual shell, themes, clean route HTML, canonical metadata,
Pagefind, LLM-oriented exports, and Scalar/OpenAPI rendering. Those outputs
are generated from the same source tree and are checked by `docs:check`, the
route smoke checks, and browser tests.

Fumadocs is the relevant comparison for content-framework depth. Its official
MDX collection material documents schema-oriented collections, while its
headless material documents reusable navigation, page, and UI primitives. Its
OpenAPI documentation describes a deeper generated reference surface than the
current Scalar viewer. These are useful parity targets, not reasons to replace
the static artifact contract. See the [Fumadocs MDX collection
example](https://github.com/fuma-nama/fumadocs/blob/dev/apps/docs/content/docs/mdx/index.mdx),
[headless/core example](https://github.com/fuma-nama/fumadocs/blob/dev/apps/docs/content/docs/headless/index.mdx),
[OpenAPI documentation](https://v14.fumadocs.dev/docs/ui/openapi), and
[repository](https://github.com/fuma-nama/fumadocs).

## Repository-specific parity scorecard

Evidence levels are:

- **Shipped/tested** — present in source and covered by a repository gate.
- **Shipped/weakly verified** — present, but coverage or failure behavior is incomplete.
- **Prototype/partial** — a usable slice exists, but the general contract is missing.
- **Roadmap** — explicitly planned but not shipped.
- **Absent** — no supported implementation.

| Capability                                                                    | papers evidence and level                                                                                                                      | Fumadocs comparison                                                                   | Minimum acceptable outcome                                                                        | User affected                |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------- |
| Markdown/MDX parsing and safe custom components                               | `scripts/lib/docsArtifacts.mjs`, `scripts/lib/mdxCompile.mjs`, and architecture tests; **shipped/tested**                                      | MDX is a first-class collection input                                                 | Keep Markdown-first authoring, sanitized MDX shortcodes, and negative tests for unsupported input | Authors, reviewers           |
| Schema-validated frontmatter and typed collections                            | `shared/contentSchema.js`, `docs-collection.json`, parser tests, and `docs:check`; **shipped/tested**                                          | Official MDX collection examples use typed collection metadata/schema                 | Keep additive versioned metadata and source diagnostics                                           | Authors, tooling maintainers |
| TOC, anchors, links, references, structured metadata                          | `toc`, typed `links`, `docs-references.json`, backlinks, `contentValidation`; **shipped/tested**                                               | Headless/content APIs expose structured page/navigation data and references           | Keep graph extraction and validation on one parser                                                | Authors, SEO, agents         |
| Navigation/sidebar metadata and version/i18n                                  | `shared/documentation-config.js`, `shared/docsRouting.js`, and route tests; **shipped/tested**                                                 | Fumadocs provides reusable page/tree primitives and metadata                          | Preserve the single navigation source and add typed per-node metadata only when needed            | Readers, maintainers         |
| Search and generated LLM/agent artifacts                                      | Pagefind, `public/llms.txt`, `public/llms-full.txt`, `/docs/llms`, `/docs/skill`; **shipped/tested**                                           | Comparable search/content export behavior is available through the ecosystem          | Keep deterministic search and machine-readable exports as release artifacts                       | Readers, agents              |
| OpenAPI generated pages, playground, examples, response samples, schema types | Scalar viewer plus deterministic `openapi-artifacts.json`, overview UI, and artifact tests; **shipped/weakly verified**                        | Official OpenAPI docs describe generated pages and richer interactive/schema surfaces | Keep Scalar for interaction; extend the additive adapter only for a concrete user journey         | API users, SDK authors       |
| Static route HTML, CDN hosting, canonical URLs, Vite compatibility            | `scripts/generate-route-html.mjs`, Vite build, Vercel rewrites, Cloudflare workflow; **shipped/weakly verified** until an owned host is proven | Fumadocs commonly assumes a framework/runtime integration                             | Never change route/artifact names without compatibility tests; prove one owned host               | Operators, SEO               |
| Theme and visual customization/design book                                    | `themes/`, `src/globals.css`, `DESIGN.md` workflow; **shipped/tested**                                                                         | UI primitives are reusable, but visual direction is project-specific                  | Keep theme assets/configuration independent from content-engine choice                            | Designers, product teams     |
| Local development, starter CLI, tests, contribution complexity                | Vite dev server, `create-papers`, Node tests, browser smoke; **shipped/weakly verified**                                                       | Fumadocs has a broader ecosystem but also framework assumptions                       | Keep one install path and a short credential-free verification ladder                             | Contributors                 |
| Upgrade/maintenance burden and dependency/security surface                    | npm audit, CSP/header policy, sanitizer/OpenAPI URL tests; **shipped/weakly verified**                                                         | External engine would add framework and dependency coupling                           | Add capability only with an owner, security boundary, and artifact diff                           | Maintainers, operators       |

The conclusion is deliberately asymmetric: papers is not yet on par with
Fumadocs as a general-purpose content framework, but a migration would trade
away its strongest static/visual properties before the missing content
capabilities have been measured against real project requirements.

## Native benchmark fixture

The reusable fixture is in
[`test/fixtures/content-engine/fixture.mdx`](../../test/fixtures/content-engine/fixture.mdx)
with nested navigation metadata in
[`navigation.json`](../../test/fixtures/content-engine/navigation.json). It
contains frontmatter, headings, a same-page anchor, an internal asset link, an
external link, a code block, a supported MDX `Callout`/`Tabs` composition, a
Mermaid block, and an OpenAPI asset reference.

The architecture test loads the fixture, runs the native artifact helpers and
MDX compiler, checks TOC/reference retention, and runs the documentation
validator against a temporary content/public root. The observed native output
now is:

- frontmatter is validated against the typed `title`, `description`, `tags`,
  `keywords`, `icon`, `order`, `draft`, `toc`, `full`, and `sidebar` schema;
- TOC IDs and internal references are derived from the same source body;
- MDX is compiled to sanitized HTML while Markdown remains a Markdown artifact;
- generated records retain `sourcePath`, canonical metadata, `contentFormat`,
  references, and typed link records;
- collection and reference manifests preserve navigation metadata, inbound
  links, and source diagnostics without replacing the existing docs index.

The remaining gaps are explicit: arbitrary user-defined collection schemas,
validation of unknown MDX component names, full generated operation pages or
playground behavior, and a proven owned deployment host.

## Bounded external capability spike

No production dependency was changed for this spike. The reproducible evidence
set is the official Fumadocs source/docs links above plus this repository's
native fixture and `npm ls --depth=0`. The official materials establish the
collection/headless/OpenAPI capability targets; they do not establish that
those outputs can be emitted unchanged by this Vite build.

The compatibility result is:

| Slice                                             | Result                                        | Constraint                                                                                                                |
| ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| MDX collections/schema/TOC/references             | **Pass as a target, not an integrated spike** | Worth emulating behind native typed artifacts; installing it would create a second source model now                       |
| OpenAPI generated pages/playground/examples/types | **Partial**                                   | Current Scalar route is stable, but generated pages and schema-derived types need a separate adapter contract             |
| Vite/static route HTML/Pagefind/LLM/theme outputs | **Unproven**                                  | No official evidence in the reviewed materials guarantees the current artifact names or CDN behavior                      |
| Hosting/runtime assumptions                       | **Tradeoff**                                  | A framework-specific runtime integration would expand the deployment contract and weaken the current static-first promise |

This is enough evidence for a direction decision, not enough evidence for a
framework migration. A future hybrid spike must be disposable, must emit the
current artifact contract, and must compare route paths, metadata, content
semantics, Pagefind input, LLM exports, and security behavior before any
dependency is promoted.

## Weighted decision

Scores are 1 (poor) to 5 (strong) for this repository; weights reflect the
current product direction. The numbers are decision aid, not a claim of
vendor quality.

| Criterion                         |  Weight |   Native | Bounded hybrid | Migration |
| --------------------------------- | ------: | -------: | -------------: | --------: |
| Product value and content depth   |      20 |        3 |              4 |         5 |
| Static/CDN and Vite compatibility |      20 |        5 |              4 |         2 |
| Visual/theme control              |      15 |        5 |              4 |         2 |
| Correctness/type safety           |      15 |        3 |              4 |         5 |
| OpenAPI depth                     |      10 |        2 |              4 |         5 |
| Security boundary                 |      10 |        4 |              3 |         2 |
| Dependency and upgrade cost       |       5 |        5 |              3 |         2 |
| Maintenance/contribution cost     |       5 |        4 |              3 |         2 |
| **Weighted total (/5)**           | **100** | **3.85** |       **3.65** |  **3.10** |

Native wins now because the highest-weight constraints are static delivery,
visual ownership, and a trustworthy release contract. The hybrid option is the
reopen path once a concrete capability can preserve those constraints. A full
migration is rejected because it requires proof of route/artifact compatibility
and a rollback path that do not exist yet.

## Implementation sequence

### Milestone 1 — typed native content contract — COMPLETE

Owner: content/tooling maintainers. Inputs are Markdown/MDX plus the shared
navigation tree. Output is the existing per-page JSON shape with an additive,
versioned metadata block. Add a schema for frontmatter, source diagnostics,
reference kinds, and navigation metadata; keep `public/docs-content/**`, route
HTML names, canonical paths, Pagefind input, and LLM output stable. Add
fixtures and negative tests for malformed frontmatter, broken links, unknown
components, and unresolved anchors.

Gate: `npm run docs:check`, `npm test`, and an artifact compatibility test that
compares route paths, canonical metadata, and content semantics to the current
fixture baseline. Passed locally with typed parser, collection, and graph
coverage.

### Milestone 2 — bounded API-reference adapter — COMPLETE

Owner: API/docs maintainers. Input is the validated OpenAPI config/spec. Output
is an additive API-reference artifact consumed by the current OpenAPI route:
operation pages, examples, response samples, and optional schema-derived type
snippets. The adapter must use the existing allowlisted URL validator and CSP;
it must not fetch arbitrary sources during a normal build.

Gate: local and remote-allowlist negative tests, route/browser tests for every
spec ID, deterministic output comparison, and the current release/browser
ladder. Passed locally for local specs; remote specs remain runtime-only and
are not fetched by the build.

### Reopen trigger and rollback

Reopen this ADR when typed metadata plus the API adapter still cannot satisfy
the top two user journeys, or when maintainers explicitly require a feature
that the native pipeline cannot represent without duplicating a framework.
Before adopting an external engine, require a throwaway dual build, a full
artifact/route diff, a dependency/security review, and a one-commit rollback to
the native generator. Until then, the current generator remains authoritative.

## Production-readiness consequence

This ADR removes strategic ambiguity; it does not erase operational blockers.
The project can claim strong project-specific parity for typed native content,
reference diagnostics, and OpenAPI metadata while retaining its static-shell
strengths. It still should not claim complete Fumadocs ecosystem parity: the
remaining differences are framework/plugin breadth, full generated API
playground pages, and external deployment proof. The production verdict
remains conditional until the owned-host deployment proof and a completed
production build/browser ladder are green.
