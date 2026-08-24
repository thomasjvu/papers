# Plan 004: Harden dependencies, CSP, and preview deployment

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c0f4e52..HEAD -- package.json package-lock.json src public themes scripts .github vercel.json wrangler.toml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M (roughly one to two days, with dependency/network work possibly
  extending the calendar time)
- **Risk**: HIGH — dependency upgrades and CSP changes can break Mermaid,
  Scalar, remote specs, theme fonts, or host previews if not tested by surface.
- **Depends on**: `plans/001-restore-verification-baseline.md`,
  `plans/002-unify-route-and-html-contract.md`
- **Category**: security | dependencies | deployment | tests
- **Planned at**: commit `c0f4e52`, 2026-08-23

## Why this matters

The read-only audit reports 18 npm audit findings, including high-severity
transitive/runtime-path advisories under Mermaid, React Router, Scalar, and
their dependency trees. Reachability still needs classification, but the
project deliberately renders untrusted-looking Markdown through DOMPurify and
Mermaid and ships a browser-facing OpenAPI explorer, so “the audit is noisy” is
not a sufficient release decision. Separately, the checked-in CSP only permits
self-hosted connections while themes and configured OpenAPI specs can use
remote origins, and the PR workflow passes Cloudflare credentials to a deploy
action running in a pull-request context.

## Current state

- `package.json:49-65` declares runtime dependencies including
  `@scalar/api-reference-react`, `dompurify`, `mermaid`, `react-router-dom`,
  and Markdown/MDX processing packages.
- The installed tree at the planned commit includes direct runtime versions
  that `npm audit --omit=dev --audit-level=high` associates with 18 advisories
  overall. The audit output includes high findings in runtime-reachable trees
  as well as build-only/transitive packages; the remediation must distinguish
  those classes rather than claiming every advisory is exploitable in the SPA.
- `src/utils/MarkdownProcessor.tsx:100-165` sanitizes generated HTML with an
  allowlist and URI restriction. `src/components/MermaidDiagram.tsx:20-32`
  configures Mermaid with `securityLevel: 'strict'`, but
  `src/components/MermaidDiagram.tsx:221` and `:260` insert Mermaid SVG into
  the DOM after rendering. These are valuable defenses that need regression
  tests around dependency upgrades.
- `shared/documentation-config.js:103-115` allows OpenAPI spec URLs such as
  local assets or external URLs, and `src/components/OpenApiReference.tsx`
  passes the selected URL to Scalar.
- `themes/lorelei/theme.json:9-17` and `themes/rx-78/theme.json:9-17` load
  Google Fonts CSS. `public/_headers:6` currently sets `style-src 'self'
'unsafe-inline'`, `font-src 'self'`, and `connect-src 'self'`, which does not
  describe those optional theme/spec origins.
- `public/_headers:5-9` contains useful hardening headers but also retains the
  obsolete `X-XSS-Protection` header. `vercel.json:1-12` defines rewrites but
  no equivalent security headers, so the security posture varies by host.
- `.github/workflows/deploy.yml:48-68` runs Cloudflare Pages deployment on
  pushes and also invokes a Cloudflare Pages action in every pull-request
  job. The action receives `CLOUDFLARE_API_TOKEN`, account ID, project name,
  and GitHub token in a workflow that builds code from the PR.
- `wrangler.toml:5` names the project `papers-docs`, while the workflow uses
  `secrets.CLOUDFLARE_PROJECT_NAME`; the checked-in configuration and deploy
  target are not yet proven to be the same project.

## Commands you will need

| Purpose              | Command                                   | Expected on success                                                                |
| -------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| Dependency inventory | `npm ls --depth=0 --omit=dev`             | direct runtime tree is resolved                                                    |
| Audit                | `npm audit --omit=dev --audit-level=high` | no unresolved reachable high/critical findings; documented exceptions are explicit |
| Lockfile             | `npm ci --dry-run`                        | exit 0 with lockfile/manifest consistency                                          |
| Tests                | `npm test`                                | all security/architecture cases pass                                               |
| Types                | `npm run type-check`                      | exit 0                                                                             |
| Build                | `npm run build`                           | exit 0                                                                             |
| Static headers       | `node scripts/check-security-policy.mjs`  | exit 0 and every supported host policy is consistent                               |
| Preview              | `npm run release:preview-check`           | exit 0; route and asset smoke remains green                                        |
| Scope                | `git status --short`                      | only Scope paths plus lockfile/generated policy changes are modified               |

## Scope

**In scope — the executor may modify or add only these paths:**

- `package.json` and `package-lock.json` — direct dependency upgrades/removals
  and an auditable runtime security command.
- `src/utils/MarkdownProcessor.tsx`, `src/components/MermaidDiagram.tsx`,
  `src/components/OpenApiReference.tsx` — only defensive input/URL handling
  and regression-fix changes required by the audit.
- `shared/documentation-config.js` and theme manifests — explicit, validated
  origin configuration for external fonts/specs.
- `public/_headers`, `vercel.json`, `wrangler.toml` — matching host security
  headers and project identity documentation.
- `.github/workflows/deploy.yml` and any small security-policy checker under
  `scripts/` — least-privilege deployment/preview behavior.
- `test/architecture.test.ts` and new security/policy tests under `test/`.

**Out of scope:**

- Do not weaken sanitization, set a broad `script-src https:`, or permit
  arbitrary runtime origins to make a third-party integration “just work.”
- Do not paste advisory secrets, tokens, or private URLs into plans, tests, or
  committed logs. Reference credential types and configuration locations only.
- Do not change application features unrelated to the audited dependency,
  header, or deployment boundary.
- Do not declare a vulnerability exploitable solely because `npm audit` lists
  it; classify whether the affected code is shipped to browsers, used at
  build/release time, or unreachable.

## Git workflow

- Branch: `advisor/004-security-host-hardening` (or the operator's established
  convention).
- Match the repository's conventional commit style.
- Do not commit, push, or open a PR unless explicitly asked.

## Steps

### Step 1: Classify and patch the dependency surface

Capture the audit output and `npm ls` tree without copying secret values. For
each high/critical advisory, record package, dependency path, affected use in
this app, fixed version if available, and whether it is runtime/browser,
build-only, or unreachable. Upgrade direct runtime dependencies first:
`dompurify`, `mermaid`, `react-router-dom`, and Scalar where fixes exist. Remove
or replace a package only when its current code path does not need it. Keep
the lockfile in sync and avoid broad, unrelated major upgrades.

If an advisory remains because a transitive package has no fixed version,
isolate it from the browser bundle or document the exact reason it is not
reachable. Do not mark the plan complete with an unexplained high/critical
runtime finding.

**Verify**: `npm ci --dry-run` → exit 0; `npm ls --depth=0 --omit=dev` → exit
0; `npm audit --omit=dev --audit-level=high` → no unresolved reachable
high/critical advisory; `npm run build` → exit 0.

### Step 2: Preserve and test the Markdown/MDX security boundary

Audit the final DOM path for Markdown, precompiled MDX HTML, Mermaid SVG, live
examples, and hosted files. Ensure every content path passes through an
allowlist/validated URL boundary before DOM insertion. Keep Mermaid's strict
security mode unless a documented, reviewed change proves it is safe.

Add regression tests that assert defensive properties without embedding
weaponized payloads in the repository: disallowed markup/attributes are
removed, unsafe URL protocols are rejected, Mermaid output is not treated as
trusted page markup, and configured OpenAPI URLs accept only the documented
protocol/host policy. Include a test for empty/malformed external-spec
configuration and a failure message that does not expose fetched content.

**Verify**: `npm test` → all existing and new security cases pass;
`npm run type-check` → exit 0; `rg -n "dangerouslySetInnerHTML|innerHTML" src` →
every remaining sink is documented by a sanitizer/strict-render test and no
new unreviewed sink exists.

### Step 3: Make CSP and host headers reflect the supported configuration

Choose one defensible policy:

1. self-host optional theme fonts and OpenAPI specs, keeping a mostly
   self-only CSP; or
2. generate an explicit allowlist from configured theme/spec origins and apply
   the same policy to Cloudflare and Vercel.

Do not use an unrestricted origin wildcard. Validate external spec URLs as
HTTPS (unless a local-development exception is explicitly scoped to dev),
extract their origins, and include only those origins in `connect-src`. For
remote Google Fonts, either self-host the CSS/fonts or include the exact CSS
and font origins in `style-src`/`font-src`. Keep scripts self-only. Remove the
obsolete `X-XSS-Protection` header unless a documented host requirement says
otherwise.

Add a small read-only checker that parses the generated/static policy and
asserts `script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`,
appropriate font/connect origins, and equivalent Vercel/Cloudflare headers.

**Verify**: `node scripts/check-security-policy.mjs` → exit 0 for default and
remote-font/spec fixtures; a fixture with an unapproved script origin → exit 1;
`npm run release:preview-check` → exit 0.

### Step 4: Remove secrets from untrusted PR deployment execution

Separate trusted production deploy from PR validation. The default PR workflow
must build and test without Cloudflare credentials. If preview deploys are
required, use a dedicated trusted mechanism with a restricted token/project,
explicit fork handling, least-privilege GitHub permissions, and no ability for
PR code to read production credentials. Keep the production push-to-main
deploy gated on the protected branch and confirm the project name comes from
one authoritative configuration source.

Do not print token values or add them to diagnostics. Preserve the PR comment
behavior only after the safe preview path is proven.

**Verify**: inspect the workflow with `rg -n "pull_request|CLOUDFLARE|apiToken|permissions|projectName" .github/workflows/deploy.yml`; PR validation has no production Cloudflare token; `git diff --check` → exit 0; a trusted main push still has exactly one production deploy step.

### Step 5: Add release-time security checks and document exceptions

Expose the approved audit/policy commands through package scripts or CI. Make
CI fail on reachable high/critical findings and report build-only exceptions
with package paths and rationale. Update deployment documentation with the
host/header policy, external-font/spec setup, and the preview trust model.

Run the full build/release checks after dependency and CSP changes; do not
accept a security fix that only passes unit tests while breaking a supported
theme or OpenAPI route.

**Verify**: `npm test && npm run type-check && npm run build && npm run release:check` → exit 0; `npm audit --omit=dev --audit-level=high` → approved result; `git status --short` → only Scope paths plus intentional lock/generated policy changes.

## Test plan

- Add policy tests for self-only scripts, configured remote font origins,
  configured OpenAPI origins, invalid schemes, and equivalent Cloudflare/
  Vercel headers.
- Add sanitizer/Mermaid regression cases beside the existing architecture
  tests or in a focused `test/security.test.ts`, using the project’s direct
  assertion style.
- Verify one build with the default theme and one with each registered theme
  that loads remote fonts or theme-specific assets.
- Verify OpenAPI default and alternate specs through the Plan 002 route smoke.

## Done criteria

- [ ] Every reachable high/critical dependency advisory is patched, removed,
      or has a documented non-reachability exception approved by the maintainer.
- [ ] Lockfile and manifest install cleanly with `npm ci`.
- [ ] Markdown, MDX, Mermaid, live examples, and OpenAPI URL paths retain a
      tested sanitization/validation boundary.
- [ ] Cloudflare and Vercel policies are equivalent for scripts, frames,
      objects, fonts, connections, and referrers.
- [ ] PR validation cannot use production Cloudflare credentials; trusted
      production deploy remains protected.
- [ ] `npm test`, `npm run type-check`, `npm run build`,
      `npm run release:check`, and the policy checker exit 0.
- [ ] `plans/README.md` status row is updated to `DONE` or `BLOCKED` with a
      reason.

## STOP conditions

Stop and report instead of improvising if:

- A dependency upgrade requires a major framework migration or changes the
  public renderer/API contract; split that into a new migration plan.
- A high/critical advisory affects shipped browser code and no fixed version
  or isolation path is available.
- A working theme or OpenAPI spec requires a broad CSP wildcard or unsafe
  script evaluation; choose self-hosting or escalate the product decision.
- A deployment preview cannot be made safe without granting PR code access to
  production credentials.
- A sanitizer test fails after a dependency upgrade; do not weaken the
  allowlist to recover the old output.

## Maintenance notes

- Re-run the runtime audit and policy checker on every dependency or theme/spec
  configuration change.
- Any new remote integration must declare its origin and add a policy fixture;
  do not edit CSP by hand for one-off browser errors.
- Keep the distinction between build-only and browser-reachable advisories in
  the release notes so future maintainers do not either ignore real findings
  or block on irrelevant tooling noise.
