# Plan 008: Choose a content-source strategy before rebuilding Fumadocs

> Executor instructions: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If
> anything in the STOP conditions section occurs, stop and report; do not
> improvise. When done, update the status row for this plan in
> plans/README.md.
>
> Drift check (run first): git diff --stat 3f2e086..HEAD -- FRAMEWORK.md
> README.md src scripts shared package.json package-lock.json

## Status

- Priority: P2
- Effort: M
- Risk: MED
- Depends on: plans/003-deterministic-content-pipeline.md,
  plans/005-productize-template-and-performance.md, and
  plans/007-complete-content-security-boundary.md
- Category: direction, migration, tech-debt, docs
- Planned at: commit 3f2e086, 2026-08-24

## Why this matters

The project has a real differentiator: a visual, themeable, static/CDN-first
documentation shell with generated route HTML, Pagefind, LLM exports, and
OpenAPI rendering. It is not yet on par with Fumadocs as a general-purpose
content framework, whose official materials describe type-safe MDX collections,
frontmatter/schema validation, TOC and structured metadata, extracted
references, and a mature headless/UI layer. Its OpenAPI integration also
advertises generated pages, an interactive playground, examples, response
samples, and schema-derived TypeScript definitions. Rebuilding those features
piecemeal without a decision will create two content models and make the
static release contract harder to trust. This plan produces a bounded parity
scorecard and a decision record before any broad migration.

## Current state

Confirm these facts before editing:

- FRAMEWORK.md — describes the shipped Markdown/frontmatter pipeline,
  build-time sanitized MDX, Pagefind, Scalar OpenAPI, version/i18n scaffolding,
  and the starter CLI. Its roadmap lists SSR, a plugin seam, a publish CLI,
  interactive MDX Tabs, and content lint, but does not define a content-engine
  compatibility contract.
- scripts/lib/docsArtifacts.mjs — parses a small frontmatter surface such as
  title, description, and inline tags and converts MDX to sanitized HTML.
- scripts/lib/contentValidation.mjs — validates the documentation tree,
  routes, frontmatter, links, and anchors. The pipeline is deterministic after
  Plan 003, but its data model is project-owned and not type-safe collection
  metadata.
- src/components/ContentRenderer.tsx — selects the generated HTML branch or
  Markdown renderer at runtime. Generated JSON and route HTML are project
  artifacts rather than a general content collection API.
- src/components/docs/TableOfContents.tsx and the sidebar/navigation modules —
  consume project-specific generated data. Preserve these UI and static-host
  strengths during the strategy decision.
- shared/documentation-config.js and src/pages/OpenApiPage.tsx —
  configure Scalar and project-owned OpenAPI route selection. This is not yet
  the generated-pages/playground/schema-examples surface described by Fumadocs
  OpenAPI documentation.
- package.json — uses Vite/React and already has the project's generation
  commands. Do not assume a Next.js-only integration is acceptable.
- Official comparison references, checked on 2026-08-24:
  - Fumadocs MDX collections:
    https://github.com/fuma-nama/fumadocs/blob/dev/apps/docs/content/docs/mdx/index.mdx
  - Fumadocs headless/core capabilities:
    https://github.com/fuma-nama/fumadocs/blob/dev/apps/docs/content/docs/headless/index.mdx
  - Fumadocs OpenAPI:
    https://v14.fumadocs.dev/docs/ui/openapi
  - Fumadocs framework/repository support:
    https://github.com/fuma-nama/fumadocs

Terminology for this plan:

- Native means extending the current project-owned source format and
  generator/validation libraries.
- Bounded hybrid means adopting a narrowly scoped external content capability
  behind an adapter while retaining the current static route/artifact contract.
- Migration means making an external content engine the source of truth for
  the supported content model, not merely adding a UI component.
- Parity means matching the user-visible and maintainer-visible capabilities
  that matter to this project, not copying every Fumadocs implementation detail.

## Commands you will need

| Purpose                 | Command                                                                                                   | Expected on success                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Drift                   | git diff --stat 3f2e086..HEAD -- FRAMEWORK.md README.md src scripts shared package.json package-lock.json | Empty, or only reviewed changes                     |
| Existing gates          | npm test && npm run type-check && npm run docs:check                                                      | Exit 0                                              |
| Production contract     | npm run build && npm run release:check                                                                    | Exit 0 from a fresh build                           |
| Current dependency view | npm ls --depth=0                                                                                          | Direct dependencies resolve without invalid entries |
| Diff hygiene            | git diff --check                                                                                          | Exit 0                                              |

## Scope

In scope:

- FRAMEWORK.md
- README.md if needed for the public framework direction
- docs/decisions/001-content-engine.md (create the decision record)
- test/fixtures/content-engine/ (create the bounded benchmark fixture), or a
  disposable temporary directory not committed to the repository
- A small adapter/interface design document, if the decision selects hybrid
- plans/README.md status row

Out of scope:

- Installing a new content engine into the production dependency graph before
  the decision is approved.
- A broad migration of src/docs/content, generated artifacts, route HTML, or
  navigation in this plan.
- Replacing the existing Vite/static deployment with Next.js/SSR solely to
  obtain framework parity.
- Reimplementing Fumadocs' code or copying its source.
- Performance, security, hosting, or browser work owned by Plans 005–007.

## Git workflow

- Branch: advisor/008-content-source-strategy
- Commit the decision record and roadmap edits together if the operator is
  executing this plan.
- Do not push or open a migration PR from this plan.

## Steps

### Step 1: Define the project-specific parity scorecard

Write a scorecard that separates user capabilities, source/content capabilities,
deployment constraints, and maintainer ergonomics. At minimum score:

- Markdown/MDX parsing and safe custom components
- schema-validated frontmatter and typed collections
- TOC, anchors, link checking, references, and structured metadata
- navigation/sidebar metadata and version/i18n behavior
- search and generated LLM/agent artifacts
- OpenAPI generated pages, playground, examples, response samples, and schema
  types
- static route HTML, CDN hosting, canonical URLs, and Vite compatibility
- theme/visual customization and the current design-book workflow
- local development, starter CLI, tests, and contribution complexity
- upgrade/maintenance burden and dependency/security surface

Define evidence levels: shipped and tested, shipped but weakly verified,
prototype, documented roadmap, or absent. Do not award parity based only on a
package name or a demo screenshot. Record the user group affected and the
minimum acceptable outcome for this repository.

Verify: the scorecard contains every category above, cites a repository path or
official Fumadocs reference for each claim, and distinguishes current behavior
from roadmap intent.

### Step 2: Benchmark the native content model

Create a small fixture containing frontmatter, nested navigation metadata,
headings/TOC, internal and external links, an anchor reference, a code block,
an MDX component, a Mermaid block, and an OpenAPI reference. Run the existing
generator/validator and record:

- source-to-artifact transformations and type information retained
- validation failures for malformed metadata, links, anchors, and components
- generated route/JSON/LLM/search outputs
- what a plugin or theme author must import to extend the model
- which data is inferred repeatedly instead of represented once

Keep the fixture either in the test suite as a reusable contract or in a
disposable directory; do not add a second production content format. If a
native improvement is obviously small and required to measure the scorecard,
record it as a follow-up rather than implementing it here.

Verify: npm test && npm run docs:check -> exit 0; the benchmark report lists
observed artifacts and explicit gaps, not qualitative claims alone.

### Step 3: Run a bounded external capability spike

Evaluate Fumadocs capabilities against the fixture without changing production
dependencies. Prefer a temporary checkout or throwaway directory. Test only
the smallest relevant slices:

1. MDX collection/schema/frontmatter/TOC/reference extraction.
2. OpenAPI generation or data extraction relevant to the project's static
   route contract.
3. Ability to emit or adapt data needed by the existing Vite route HTML,
   Pagefind, LLM exports, themes, and canonical URL checks.

Record framework assumptions, supported runtimes, generated output shape,
server/build requirements, accessibility behavior, upgrade cadence, and
security boundaries. If the official implementation is tied to a host/runtime
that conflicts with Vite/static/CDN goals, treat that as a tradeoff rather than
silently redesigning the product.

Verify: the spike has a reproducible command or a precise reason a capability
could not be run; no package.json/package-lock.json production change is made;
the report names each capability as pass, partial, or fail with evidence.

### Step 4: Decide native, bounded hybrid, or migration

Use the scorecard and spike to choose exactly one of:

- Native: retain the project-owned model and add typed collection metadata,
  references, and OpenAPI features incrementally.
- Bounded hybrid: adopt a focused external parser/collection/OpenAPI slice
  behind an adapter that emits the current documented artifacts and preserves
  static hosting.
- Migration: make an external engine the source of truth, with an explicit
  route/artifact compatibility and migration sequence.

The decision must include a weighted table for product value, static-host
compatibility, visual/theming control, correctness/type safety, OpenAPI depth,
security, dependency cost, and maintenance. State why the two rejected options
are not selected now and the trigger that would reopen the decision.

Verify: a reviewer can select the same option using only the decision record,
scorecard, and benchmark evidence; no open-ended “investigate later” wording
remains for the primary direction.

### Step 5: Record a bounded implementation sequence

If Native or Bounded hybrid is selected, define the first two milestones with
exact interfaces and compatibility tests. The first milestone must not alter
published route URLs or artifact names. If Migration is selected, define a
dual-read/dual-build transition, rollback point, content inventory, and
artifact diff gate before deleting the current generator.

Map each missing parity item to a plan or issue-sized follow-up. In particular,
separate content type-safety, OpenAPI depth, plugin seams, and SSR/hosting
decisions. Update FRAMEWORK.md roadmap language so it reflects the selected
direction instead of promising an unscoped “plugin seam” or generic parity.

Verify: the sequence names owners/inputs/outputs and a machine-checkable gate
for each milestone; npm run format:check && npm run docs:check -> exit 0.

### Step 6: Re-run the production-readiness verdict

After the decision record is complete, compare it to the existing
plans/README.md verdict. Keep the verdict “not production-ready” if Plans
006/007 or the browser/performance gates in Plan 005 remain open. The purpose
of this step is to remove strategic ambiguity, not to declare parity early.

Verify: npm test && npm run type-check && npm run build && npm run release:check
-> exit 0; git diff --check -> exit 0; the decision record is the only
strategy source that the roadmap points to.

## Test plan

- Use the content fixture to run native validation and artifact generation.
- Add no production dependency for the spike; if an adapter is selected,
  write its contract tests as a later implementation plan.
- Compare generated artifacts by path, metadata, route, and content semantics,
  not only byte-for-byte output.
- Include negative cases for invalid frontmatter, broken links, unknown MDX
  components, missing OpenAPI assets, and unsupported runtime assumptions.

## Done criteria

- [ ] A repository-specific Fumadocs parity scorecard exists with evidence and
      explicit current/roadmap/absent classifications.
- [ ] A representative content fixture has been evaluated by the native
      pipeline and its gaps are recorded.
- [ ] A bounded external capability spike is reproducible or its limits are
      documented, with no unapproved production dependency change.
- [ ] One of Native, Bounded hybrid, or Migration is selected with weighted
      tradeoffs and rejected alternatives.
- [ ] The decision record preserves static route/artifact constraints and
      identifies the first implementation milestones and rollback point.
- [ ] FRAMEWORK.md and any public roadmap language match the decision.
- [ ] npm test, npm run type-check, npm run docs:check, npm run build, and
      npm run release:check pass.
- [ ] No files outside the Scope list are modified, except the plan status
      row in plans/README.md.

## STOP conditions

Stop and report if:

- The Fumadocs capability or compatibility claim cannot be verified from
  official documentation, a reproducible spike, or repository evidence.
- The spike would require changing production dependencies, route URLs,
  hosting, or content files before the decision is reviewed.
- The only path to the desired capability is a runtime/hosting change that
  conflicts with the documented static/CDN-first product constraint.
- Native and hybrid approaches cannot be compared because the fixture does not
  represent a real supported content feature.
- A migration would require deleting the current generator before a dual-build
  diff and rollback path exists.
- The proposed decision depends on accepting the unresolved security or
  deployment gaps in Plans 006/007.

## Maintenance notes

- Revisit the scorecard whenever a new content primitive, OpenAPI feature,
  hosting target, or runtime is added.
- Keep the current artifact contract as the compatibility seam until a later
  plan proves a replacement with route and content diffs.
- Reviewers should look for accidental framework-driven product changes:
  losing themes, static deployment, LLM exports, or the design-book workflow
  is not an acceptable hidden cost of “parity.”
- This plan decides direction; it does not authorize the migration itself.
