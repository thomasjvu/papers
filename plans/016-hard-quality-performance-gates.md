# Plan 016: Turn quality, performance, and privacy into hard gates

> **Executor instructions:** Improve signal quality without hiding measured
> regressions. Keep Plan 006 as the separate owned-host/deployment blocker. Do
> not weaken budgets to make CI green; use route-specific budgets and document
> intentional heavy surfaces.

## Status

- **Priority:** P1
- **Status:** BLOCKED — local privacy/CI/browser/performance slice is complete; Plan 006 host proof and dev-tool audit ownership remain.
- **Effort:** M
- **Risk:** MED — CI runtime and tooling changes can create false failures if
  baselines are not deterministic.
- **Depends on:** plans/006-post-promotion-release-truth.md (BLOCKED pending
  credentials/host), plans/011-defer-and-slim-openapi-runtime.md (DONE),
  plans/012-seo-and-agent-discovery-contract.md (DONE)
- **Category:** tests | perf | security | release
- **Planned at:** commit `ecaa12a`, 2026-08-25

## Re-audit finding

The current read-only gate is healthy: `npm test` passes 37 tests, typecheck,
lint, formatting, docs, security, assets, runtime audit, release smoke, and
preview smoke all pass. That is not yet a complete production signal:

- Lighthouse runs once and treats performance as a warning
  (`lighthouserc.cjs:16-25`); the observed scores were 0.69 for `/docs`, 0.29
  for OpenAPI, and 0.79–0.80 for the homepage/deep page.
- Lighthouse reports are uploaded to temporary public storage
  (`lighthouserc.cjs:27-29`, `.github/workflows/ci.yml:95-100`). Arbitrary
  consumer docs may contain private material even in an otherwise open-source
  framework checkout.
- Browser coverage is six Chromium/Desktop Chrome smoke tests
  (`test/browser/docs.spec.mjs:20-116`, `playwright.config.mjs:1-15`), with no
  coverage signal and no committed accessibility interaction matrix.
- CI rebuilds after validation: the validate job already builds and uploads
  `build-output-node-22` (`.github/workflows/ci.yml:46-67`), but the Lighthouse
  job installs dependencies and runs another full build
  (`.github/workflows/ci.yml:86-100`) before measuring. The browser job already
  demonstrates the cheaper artifact-download pattern
  (`.github/workflows/ci.yml:119-123`). This duplicate build/install work is a
  concrete source of slow or apparently stalled feedback.
- Full `npm audit` reports 10 development-tooling advisories (2 low, 1
  moderate, 7 high), including `@lhci/cli`, `lighthouse`, `tmp`, and
  `extract-zip`; the shipped runtime audit is clean. The distinction is
  documented in `RELEASING.md:101-114`, but CI-tool supply chain risk remains.

## User impact

A green PR can still regress first-load performance on common docs routes, leak
report URLs for private fork content, or break keyboard/mobile/browser behavior
outside the single happy-path engine. High advisories in tools that run against
repository content also increase maintainer and CI risk even when they do not
ship to browsers.

## Target contract

- Performance budgets are deterministic, route-specific, and blocking for the
  supported default surface; the heavy OpenAPI route has an explicit budget and
  does not pull into the shell.
- CI builds the production artifact once per workflow and reuses it for
  Lighthouse and browser jobs; repeated dependency installation is cache-backed
  and observable.
- Lighthouse output stays private to repository/CI artifacts unless a
  maintainer explicitly opts into public sharing.
- Browser smoke covers the supported shell across desktop/mobile viewport,
  keyboard/focus, direct reload/404, reduced motion, and at least one additional
  maintained browser engine or an explicit support decision.
- Critical parser, routing, security, artifact, and config helpers have a
  measurable unit/fixture coverage signal and negative cases.
- Tooling advisories are patched, removed, or tracked with owner/expiry; a
  high/critical reachable CI-tool issue cannot disappear into a runtime-only
  audit.

## Steps

### 1. Establish deterministic performance budgets

Run Lighthouse with a fixed local preview, warm-up, stable throttling, and at
least three runs or a median policy. Record current metrics by route: performance
score, LCP/CLS/TBT, transfer bytes, request count, and largest JS/font assets.
Use error-level thresholds for homepage, docs landing, and a representative deep
page. Give OpenAPI its own route budget while enforcing that it is absent from
the initial shell.

First improve the failing `/docs` and OpenAPI measurements enough to meet the
agreed thresholds; do not simply change `warn` to `error` while the baseline is
below it. Keep the build-time asset-size check as a fast preflight.

### 2. Remove public report leakage by default

Replace `temporary-public-storage` and the action's public upload mode with
private GitHub artifacts or a no-upload mode. Set retention and permissions
explicitly. Add a test/review check that report URLs, source content, and
environment values are not sent to an external report service by default.

If public sharing is retained as an opt-in maintainer workflow, separate it from
required PR validation and document the data exposure.

### 3. Expand browser and accessibility signal

Add a compact matrix for mobile viewport, keyboard-only navigation, focus return
from search/theme dialogs, reduced motion, direct deep-route reload, invalid
route, and offline/local asset failures. Decide whether Firefox/WebKit is a
support target; if yes, run the most valuable smoke subset there, otherwise
document the Chromium support boundary.

Add semantic assertions for heading order, accessible names, focus visibility,
color-mode controls, and no horizontal overflow. Use an automated a11y scanner
only if its dependency is maintained and pinned; retain human-readable
interaction assertions for regressions the scanner cannot see.

### 4. Add coverage and negative fixtures

Choose a coverage mechanism compatible with the existing Node/TypeScript test
runner and publish a summary in CI. Cover content parsing/diagnostics, collection
routing, variant resolution, SEO/agent serialization, OpenAPI URL validation,
Mermaid sanitization, build identity, and CLI packaging. Add malformed and
security-negative fixtures instead of chasing a global percentage alone.

Keep browser tests focused on user-visible behavior; do not make CI depend on a
live production host for unit or browser coverage.

### 5. Close the dev-tool supply-chain loop

Inventory the ten full-audit findings and update/remove the vulnerable Lighthouse
chain where patched versions exist. If a tool must remain, pin the safe
transitive resolution, record the reason and review date, and isolate it from
untrusted network/content inputs. Add a scheduled full audit and keep the
existing shipped-runtime high/critical gate in every release.

### 6. Remove duplicate CI work

Make the Lighthouse job download the validated Node 22 build artifact instead
of running a second `npm run build`. Keep only the dependencies required to
serve/measure the artifact, or use a small dedicated measurement image. Reuse
the npm cache and install Chromium only in the jobs that need it. Add timing
annotations for install, build, preview startup, Lighthouse, and Playwright so
future stalls identify the phase rather than appearing as a silent wait.

Do not remove the artifact upload/download integrity check: Lighthouse and
browser tests must measure the exact build that passed validation.

### 7. Reconcile with the live release gate

After Plan 006 supplies credentials and an owned `PAPERS_DEPLOY_HOST`, run the
full build identity/post-deploy smoke and compare live headers, canonical URLs,
agent artifacts, route HTML, and build manifest. The plan is not allowed to mark
the overall project ready while the deployment proof remains absent.

## Verification

| Check                      | Expected result                                                                  |
| -------------------------- | -------------------------------------------------------------------------------- |
| performance CI             | three-run/median route budgets are deterministic and blocking                    |
| report privacy review      | no default external public upload; private artifacts retain expected reports     |
| browser matrix             | supported viewport/keyboard/reload/404/reduced-motion paths pass                 |
| coverage command           | summary is emitted and critical modules have negative fixtures                   |
| CI timing                  | Lighthouse/browser consume one validated build; phase timings are visible        |
| full `npm audit`           | no unowned high/critical tooling advisory, or an explicit time-bounded exception |
| `npm run release:check`    | all existing artifact/security gates remain green                                |
| Plan 006 post-deploy smoke | owned host serves the exact built revision and canonical identity                |

## Done criteria

- [ ] Lighthouse performance and transfer budgets are blocking and met by all
      supported default routes, with a separately bounded OpenAPI route.
- [x] CI does not publish arbitrary docs content to public report storage by
      default.
- [x] Browser/accessibility/reduced-motion coverage reflects the documented
      support matrix.
- [x] Critical generator/security/runtime boundaries have coverage and negative
      fixtures.
- [ ] Development-tool advisories have patched/removed resolutions or an
      owner/expiry exception.
- [ ] Plan 006's live build-identity/post-deploy proof is green.

## Stop conditions

- A stricter budget fails because the preview environment is nondeterministic;
  fix the harness before changing thresholds.
- A proposed scanner or Lighthouse replacement introduces a new high/critical
  advisory or public data path without a security review.
- A browser failure needs a live host, secret, or external API; use a local
  fixture and leave the host proof to Plan 006.

## Maintenance notes

Review budgets and the support matrix whenever dependencies, fonts, Scalar,
Pagefind, route HTML, or theme assets change. Keep the full audit separate from
the shipped-runtime audit, but never interpret a clean browser bundle as proof
that the CI supply chain is risk-free.
