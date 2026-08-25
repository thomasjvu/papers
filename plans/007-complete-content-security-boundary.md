# Plan 007: Complete the content security boundary after dependency hardening

> Executor instructions: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If
> anything in the STOP conditions section occurs, stop and report; do not
> improvise. When done, update the status row for this plan in
> plans/README.md.
>
> Drift check (run first): git diff --stat 3f2e086..HEAD -- src/components
> src/pages shared scripts public .github package.json package-lock.json

## Status

- Priority: P0
- Effort: M
- Risk: HIGH
- Depends on: plans/004-security-and-host-hardening.md and
  plans/006-post-promotion-release-truth.md
- Category: security, tests, deployment, docs
- Planned at: commit 3f2e086, 2026-08-24

## Why this matters

Plan 004 upgraded runtime packages, added a security-policy checker, removed
the legacy X-XSS-Protection header, and isolated Cloudflare credentials from
pull-request validation. The content boundary is still incomplete: Mermaid
currently uses antiscript mode with htmlLabels enabled and inserts generated SVG
through dangerouslySetInnerHTML, OpenAPI spec URLs are arbitrary strings, and
the policy checker does not prove complete Cloudflare/Vercel parity or run as a
release gate. These are high-impact correctness and security gaps for a docs
system that renders user-authored Markdown/MDX and can embed remote API
descriptions.

## Current state

Confirm these excerpts before editing:

- src/components/MermaidDiagram.tsx — the current renderer configures
  securityLevel as antiscript and htmlLabels as true, then inserts the
  Mermaid SVG through dangerouslySetInnerHTML in both the normal and enlarged
  render paths. The current comment says antiscript is needed for strong labels.
  Existing tests prove that Markdown emits a Mermaid placeholder, but do not
  inspect rendered SVG or sanitizer behavior.
- scripts/lib/mdxCompile.mjs and scripts/lib/docsArtifacts.mjs — build-time
  Markdown/MDX is converted to HTML and passed through the existing sanitizing
  path. Reuse that boundary where possible; do not create a second ad hoc
  sanitizer with different policy.
- documentation-config.d.ts — OpenAPI spec url is typed as string in the
  OpenApiSpec configuration.
- shared/documentation-config.js — configured specs use local paths today, but
  the type and runtime accept any string.
- src/pages/OpenApiPage.tsx and src/components/OpenApiReference.tsx — the
  configured URL is passed to an anchor and to Scalar's spec configuration.
  There is no allowed-origin policy or malformed-URL check.
- scripts/check-security-policy.mjs — checks selected default/object/frame,
  style/font, and self-only script directives in generated headers. It does
  not derive or compare every directive, does not enforce configured
  connect-src/font-src origins, and is not part of release:check or CI as a
  dedicated gate.
- public/\_headers and vercel.json — contain parallel but separately edited
  security header policies. The current policy permits Google font stylesheet
  and font origins; both files need to remain semantically equivalent.
- package.json — check:security-policy exists, while release:check does not
  invoke it. npm audit --omit=dev --audit-level=high --json currently reports
  zero high/critical runtime findings in the checked environment.
- .github/workflows/ci.yml and deploy.yml — validation is credential-free for
  PRs; deployment receives Cloudflare secrets only on trusted main pushes.
  Keep that separation while adding security gates.

Security/design constraints:

- User-authored content is untrusted input. Prefer Mermaid strict mode with
  plain text labels. If rich labels are a product requirement, the allowed
  subset must be explicit, sanitized, tested, and used consistently in both
  normal and enlarged render paths.
- OpenAPI references must be either root-relative files copied into the
  published artifact or HTTPS URLs whose origins are explicitly configured.
  Reject javascript:, data:, blob:, file:, protocol-relative, malformed, and
  unapproved URLs. Do not silently broaden an allowlist.
- CSP must be least privilege. A source needed by Scalar or fonts must be
  named in configuration and reflected in both header implementations. Do not
  add unsafe-eval, wildcard script sources, or broad connect-src as a
  convenience.
- npm audit is evidence, not a complete security review. A reachable
  high/critical advisory requires a patch/removal or a written, versioned
  exception with owner and expiry.

## Commands you will need

| Purpose         | Command                                                                                                                | Expected on success                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Drift           | git diff --stat 3f2e086..HEAD -- src/components src/pages shared scripts public .github package.json package-lock.json | Empty, or only reviewed changes                                     |
| Tests           | npm test                                                                                                               | All tests pass, including security regression cases                 |
| Security policy | npm run check:security-policy                                                                                          | Exit 0 and verifies complete policy parity                          |
| Audit           | npm audit --omit=dev --audit-level=high --json                                                                         | Zero reachable high/critical, or an explicitly documented exception |
| Build           | npm run build                                                                                                          | Exit 0 with local assets and headers generated                      |
| Release         | npm run release:check                                                                                                  | Exit 0 and includes security policy/audit gates                     |
| Typecheck       | npm run type-check                                                                                                     | Exit 0                                                              |
| Diff hygiene    | git diff --check                                                                                                       | Exit 0                                                              |

## Scope

In scope (the only product files this plan should modify):

- src/components/MermaidDiagram.tsx
- src/components/OpenApiReference.tsx
- src/pages/OpenApiPage.tsx
- src/pages/DocsPage.tsx if needed for shared validation errors
- src/types/documentation-config.d.ts
- shared/documentation-config.js
- shared/openapiRouting.js if needed for validation helpers
- scripts/lib/contentSecurity.mjs (create if needed)
- scripts/lib/openapiSpecUrls.mjs (create if needed)
- scripts/check-security-policy.mjs
- scripts/release-smoke.mjs if needed to invoke the policy result
- package.json
- package-lock.json
- public/\_headers
- vercel.json
- .github/workflows/ci.yml
- .github/workflows/deploy.yml
- RELEASING.md (extend the existing security/release section)
- test/architecture.test.ts (extend the existing architectureTests array for
  the new security behavior)

Out of scope:

- A general component redesign or replacing Scalar.
- Switching hosting providers or claiming control of an unverified host.
- Broad dependency upgrades unrelated to a reported reachable advisory.
- A Fumadocs migration or content-engine rewrite; use Plan 008.
- Performance budgets, font reduction, and browser automation; use Plan 005.
- Committing secrets or weakening CSP to make a third-party embed work.

## Git workflow

- Branch: advisor/007-complete-content-security-boundary
- Commit per logical security boundary if the operator is executing this plan.
- Do not push or deploy unless separately instructed.

## Steps

### Step 1: Define one testable OpenAPI URL policy

Create a shared validator used by configuration validation, build-time checks,
and both OpenAPI UI entry points. Its result should distinguish local
root-relative assets from approved HTTPS remote URLs and return an actionable
error for invalid values.

Add an explicit allowedOrigins configuration field for remote URLs. Normalize
origins without accepting credentials, fragments, non-default ports that were
not configured, protocol-relative URLs, encoded scheme tricks, or trailing-path
ambiguity. Reject empty ids, duplicate ids, missing default ids, unsupported
schemes, malformed values, and remote origins not in the allowlist. For local
paths, require a root-relative path, prevent traversal, and verify the asset is
copied/available in the generated artifact. Preserve the configured default
spec behavior but never make an unknown route id select a different spec.

Verify: npm test -> all URL-policy cases pass, including local valid, approved
HTTPS, unapproved HTTPS, javascript:, data:, blob:, file:, protocol-relative,
credentials, traversal, malformed, duplicate, and missing-default cases;
npm run build -> configured local spec assets remain available.

### Step 2: Close the Mermaid rendering boundary

Prefer reverting Mermaid to strict security mode and representing diagram labels
with plain text. If the product genuinely requires formatted labels, define a
small allowed markup policy and sanitize the generated SVG output with one
reviewed helper before either dangerouslySetInnerHTML insertion. The policy
must cover both normal and enlarged render paths, event-handler attributes,
foreignObject, external href/src, URL-bearing SVG attributes, scripts, and
style content. Do not assume Mermaid antiscript is equivalent to a complete
application sanitizer.

Keep keyboard/zoom behavior intact. Add a visible or accessible error state
when rendering or sanitization rejects a diagram rather than injecting the
untrusted output.

Verify: npm test -> malicious Mermaid labels and SVG payload fixtures produce
no script, event-handler, foreign-object, external URL, or unsafe style output;
the normal and enlarged paths use the same policy; npm run type-check -> exit 0.

### Step 3: Add regression tests around generated content

Add test fixtures for Markdown/MDX Mermaid blocks, HTML labels, inline HTML,
links, and OpenAPI references. Assert at the boundary that expected safe
content survives and unsafe content is removed or causes a clear validation
error. Test the actual helper used by production code, not a copy of its
logic. Include a regression for the current antiscript/htmlLabels setting so
future dependency or configuration changes cannot silently widen the output.

Verify: npm test -> all existing tests and the new security regression suite
pass; the tests fail if the sanitizer or strict Mermaid mode is bypassed.

### Step 4: Make CSP/header policy complete and equivalent

Refactor scripts/check-security-policy.mjs around a parsed directive map. Check
all security-relevant directives emitted by public/\_headers and vercel.json,
including default-src, script-src, style-src, font-src, img-src, connect-src,
object-src, frame-src, base-uri, form-action, frame-ancestors, and
upgrade-insecure-requests where present. Derive expected remote origins from
the OpenAPI and font configuration instead of duplicating hidden strings.

Require Cloudflare and Vercel policies to be semantically equivalent for the
supported deployment surface, and reject wildcard or unsafe sources not
explicitly approved. Add fixture tests for missing directives, an extra
unapproved origin, a Cloudflare/Vercel mismatch, and an approved Scalar
connect origin. Keep X-XSS-Protection absent.

Verify: npm run check:security-policy -> exit 0 for current headers;
npm test -> policy fixtures pass; changing one header file to remove a required
origin or add a wildcard -> non-zero.

### Step 5: Wire security gates into release and CI

Make release:check invoke the complete security policy check and a
machine-readable runtime dependency audit. Ensure the audit command is
deterministic enough for CI and fails on reachable high/critical advisories.
If a temporary exception is unavoidable, store only advisory id, affected
package, rationale, owner, mitigation, and expiry in a checked file and make
the checker fail after expiry.

Run these checks after npm ci and before artifact upload/deploy. Keep all
credential-free PR validation jobs free of Cloudflare secrets. The deploy job
may consume credentials only after validation succeeds on a trusted push.

Verify: npm run release:check -> includes policy and audit gates and exits 0
with the current dependency tree; CI configuration inspection -> no secret
reference in pull-request validation; a fixture or temporary command that
introduces a high advisory -> release gate exits non-zero.

### Step 6: Document the security contract

Add a concise maintainer-facing section to RELEASING.md or the existing
security documentation describing: trusted content boundaries, Mermaid policy,
OpenAPI local/remote URL rules, CSP source ownership, audit exceptions, and
the required release commands. Include the rule that a new remote embed or
font origin must update configuration and both supported header outputs.

Verify: npm run format:check && npm run docs:check -> exit 0; documentation
search finds no instruction to bypass the policy checker or use arbitrary
OpenAPI URLs.

## Test plan

- Unit-test the OpenAPI URL validator with valid local/HTTPS cases and every
  rejected scheme/origin/path case listed in Step 1.
- Regression-test Mermaid output through the actual renderer/helper boundary,
  including both display modes and malicious labels/attributes.
- Test parsed CSP directive equivalence for current headers and negative
  fixtures.
- Test release gate wiring so removing a security check from release:check is
  detectable.
- Run npm audit with dev dependencies omitted at high severity and record any
  exception only if the repository genuinely cannot patch it.

## Done criteria

- [ ] OpenAPI references are validated at configuration/build/runtime entry
      points; only root-relative local assets or explicitly allowed HTTPS
      origins are accepted.
- [ ] Unknown OpenAPI ids cannot silently fall back to the default spec.
- [ ] Mermaid output is strict/plain or sanitized by one shared, tested policy
      in every render path; no unreviewed raw SVG boundary remains.
- [ ] Security regression tests cover XSS-shaped labels, SVG attributes,
      external URLs, malformed OpenAPI URLs, and CSP drift.
- [ ] public/\_headers and vercel.json have complete, equivalent policies with
      only configured origins and no legacy X-XSS-Protection header.
- [ ] npm run check:security-policy, npm audit --omit=dev --audit-level=high
      --json, npm test, npm run type-check, and npm run release:check pass.
- [ ] CI runs the security gates before artifact upload/deployment without
      exposing deployment credentials to pull requests.
- [ ] Security ownership and exception/expiry rules are documented.
- [ ] No files outside the Scope list are modified, except the plan status
      row in plans/README.md.

## STOP conditions

Stop and report if:

- The current Mermaid library cannot produce the required diagrams in strict
  mode and the proposed rich-label policy would require allowing script,
  foreignObject, arbitrary URLs, or broad inline styles.
- Sanitizing the SVG would change legitimate diagrams in a way that requires a
  product/design decision.
- An OpenAPI consumer requires arbitrary remote URLs, wildcard origins, or
  credentials embedded in URLs.
- Scalar requires a network source that cannot be represented by a narrow,
  documented connect-src policy.
- A reachable high/critical advisory has no patch and no owner willing to
  accept a time-bounded exception.
- Cloudflare and Vercel cannot be kept equivalent without changing the hosting
  support promise.
- A fix would require deployment credentials, DNS changes, or changes in
  Plan 005/008 scope.

## Maintenance notes

- Treat every new renderer, shortcode, embedded file type, or remote integration
  as a new content boundary requiring a fixture and policy review.
- Keep URL validation in shared code so build-time and browser behavior cannot
  drift.
- Reviewers should inspect negative tests first: they must fail when a future
  dependency upgrade reintroduces raw SVG/HTML or broad URL/CSP behavior.
- Plan 006 owns build/deployment identity; Plan 005 owns browser/performance
  coverage; Plan 008 owns whether the content engine should remain native or
  adopt a bounded Fumadocs slice.
