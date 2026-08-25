# Plan 009: Add a maintainer and agent operating contract

> Executor instructions: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If
> anything in the STOP conditions section occurs, stop and report; do not
> improvise. When done, update the status row for this plan in
> plans/README.md.
>
> Drift check (run first): git diff --stat 3f2e086..HEAD -- AGENTS.md
> .github/pull_request_template.md README.md FRAMEWORK.md package.json
> scripts src shared test

## Status

- Priority: P2
- Effort: S
- Risk: LOW
- Depends on: plans/006-post-promotion-release-truth.md
- Category: dx, docs, tech-debt
- Planned at: commit 3f2e086, 2026-08-24

## Why this matters

The repository has useful scripts and release notes, but no root AGENTS.md,
PRODUCT.md, DESIGN.md, or ADR that gives a maintainer or coding agent one
authoritative operating contract. Guidance is split across FRAMEWORK.md,
RELEASING.md, package scripts, and conventions that are only discoverable by
search. The pull-request template also asks contributors to run format in
write-mode rather than the read-only format:check gate. A small, explicit
contract will reduce accidental source/generated-file edits, clarify the
static-host and security boundaries, and make future audit/execution passes
more reliable.

## Current state

Confirm these facts before editing:

- There is no root AGENTS.md, PRODUCT.md, DESIGN.md, or documented ADR
  directory in the current checkout.
- package.json contains the primary commands: npm run dev, npm run build,
  npm test, npm run lint, npm run format:check, npm run type-check,
  npm run docs:check, npm run check:docs-tree, npm run release:check, and
  npm run release:preview-check.
- FRAMEWORK.md describes the static/CDN-first direction, generated Markdown/
  MDX artifacts, Pagefind, Scalar, version/i18n scaffolding, themes, and
  starter CLI.
- RELEASING.md describes the build/release sequence and should remain the
  detailed release reference after the concise contract is added.
- .github/pull_request_template.md currently asks for npm run format, which
  writes files. Pull requests should ask for npm run format:check and explain
  when a contributor may intentionally run the write-mode formatter locally.
- .gitignore ignores CLAUDE.md; do not use an ignored file as the only
  repository operating contract.
- Existing generated outputs include dist, public generated metadata, and
  theme-resolved files. Their ownership and regeneration commands must be
  stated rather than guessed.

## Commands you will need

| Purpose            | Command                                                                                                                                                            | Expected on success                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Drift              | git diff --stat 3f2e086..HEAD -- AGENTS.md .github/pull_request_template.md README.md FRAMEWORK.md package.json scripts src shared test                            | Empty, or only reviewed changes                |
| Tests              | npm test                                                                                                                                                           | Exit 0                                         |
| Docs validation    | npm run docs:check && npm run check:docs-tree                                                                                                                      | Exit 0                                         |
| Format             | npm run format:check                                                                                                                                               | Exit 0                                         |
| Link/wording check | rg -n -e "npm run format" -e "AGENTS.md" -e "release:check" -e "static" -e "CSP" -e "OpenAPI" AGENTS.md .github/pull_request_template.md FRAMEWORK.md RELEASING.md | Expected references are present and consistent |
| Diff hygiene       | git diff --check                                                                                                                                                   | Exit 0                                         |

## Scope

In scope:

- AGENTS.md (create at repository root)
- .github/pull_request_template.md
- FRAMEWORK.md only for a concise pointer or wording that would otherwise
  contradict the operating contract
- README.md only for discoverability if needed
- A contract/discoverability check under test/ or scripts/ if the repository
  convention requires a machine check
- plans/README.md status row

Out of scope:

- Product source code, theme visuals, generated artifacts, dependency changes,
  or CI behavior beyond the pull-request template.
- Rewriting RELEASING.md in this small plan; add a pointer and leave its
  detailed release procedure intact unless a contradiction must be corrected.
- Creating a second agent-specific contract under an ignored path.
- Mandating tools that are not already available in package.json or the
  repository's documented workflow.

## Git workflow

- Branch: advisor/009-maintainer-agent-contract
- Commit the contract and template update together if the operator is
  executing this plan.
- Do not push or open a PR unless separately instructed.

## Steps

### Step 1: Write the root operating contract

Create AGENTS.md with short, actionable sections:

1. Project identity and constraints: React/Vite, static/CDN-first output,
   route HTML, themes, Pagefind, LLM exports, and Scalar/OpenAPI.
2. Source ownership: source docs/config/components versus generated dist,
   public artifacts, and theme-resolved files; name the regeneration commands.
3. Verification ladder: the exact install, test, lint, format, type, docs,
   build, release, preview, security, and audit commands, including which
   commands write output.
4. Change boundaries: preserve route/canonical URL contracts, validate
   untrusted content, keep CSP least-privilege, and do not add remote assets
   without configuration/header updates.
5. Deployment rules: PR validation is credential-free; only trusted main
   deployment can use cloud secrets; never claim an unverified public host.
6. Stop/report rules: missing credentials, host mismatch, source/generated
   drift, failed gates, or a request to broaden scope.
7. Handoff expectations: state changed files, commands run, known blockers,
   and whether generated output is intentionally untracked.

Keep the file concise and link to FRAMEWORK.md and RELEASING.md for details.
Do not put secret values, personal paths, or ephemeral run ids in it.

Verify: sed -n '1,240p' AGENTS.md -> all seven sections are present and no
secret value/path is present; git diff --check -> exit 0.

### Step 2: Align contributor instructions

Update .github/pull_request_template.md so the verification checklist uses
format:check, and distinguish read-only checks from commands such as build that
regenerate ignored output. Add a checkbox for docs/security/release gates when
the change touches content, headers, routes, or deployment. Point contributors
to AGENTS.md, FRAMEWORK.md, and RELEASING.md without duplicating long
procedures.

If README.md or FRAMEWORK.md contains a contradictory command or direction,
make the smallest wording correction and add a pointer to AGENTS.md. Do not
turn this into a general documentation rewrite.

Verify: rg -n "npm run format( |$)" .github/pull_request_template.md -> no
write-mode instruction remains; npm run format:check -> exit 0; npm run
docs:check -> exit 0.

### Step 3: Add discoverability and drift protection

Add a small check only if needed to prevent the contract from becoming stale.
It may assert that AGENTS.md exists, names the primary commands, and points to
the canonical detailed docs. Prefer an existing test/run-tests.mjs or a
zero-dependency script over introducing a new package.

Do not assert every prose sentence or create a brittle line-number contract.
If the check is added to CI, keep it credential-free and make its failure
message identify the missing contract section.

Verify: npm test -> all tests pass; removing a required heading in a temporary
copy causes the check to fail; current repository check exits 0.

### Step 4: Review the contract as a new executor

Read only AGENTS.md, FRAMEWORK.md, RELEASING.md, package.json, and the changed
pull-request template as if starting a new task. Confirm that a contributor
can answer:

- which command verifies a change without writing files;
- which commands regenerate outputs;
- which routes/hosts are promises versus local assumptions;
- where untrusted content and headers are controlled;
- when to stop instead of using credentials or broadening scope.

Remove duplicate or contradictory wording discovered during this review.

Verify: npm run lint && npm run format:check && npm run type-check -> exit 0;
git diff --check -> exit 0.

## Test plan

- Verify AGENTS.md presence and required command/ownership pointers using a
  lightweight check only if it adds durable value.
- Search the pull-request template for accidental write-mode formatting
  instructions.
- Run the existing docs, test, lint, type, and format gates.
- Inspect git status to ensure no generated files were changed by verification.

## Done criteria

- [ ] Root AGENTS.md exists, is concise, secret-free, and covers project
      constraints, source ownership, verification, security/deployment rules,
      stop conditions, and handoff expectations.
- [ ] The pull-request template uses format:check for verification and points
      to the canonical operating/release docs.
- [ ] No README/FRAMEWORK wording contradicts the operating contract.
- [ ] Any added discoverability check is credential-free, non-brittle, and
      passes in the current repository.
- [ ] npm test, npm run lint, npm run format:check, npm run type-check,
      npm run docs:check, and npm run check:docs-tree pass.
- [ ] No files outside the Scope list are modified, except the plan status
      row in plans/README.md.

## STOP conditions

Stop and report if:

- A requested instruction would require committing secret values, personal
  paths, ignored files, or ephemeral host credentials.
- Existing project/product constraints conflict and cannot be resolved by a
  pointer; do not choose a new product direction here.
- The contract check would need to encode unstable prose or package internals.
- A source/generated ownership rule cannot be stated accurately without first
  completing Plans 005–008.
- The change expands into a CI/deployment redesign or a full docs rewrite.

## Maintenance notes

- Keep AGENTS.md as the concise entry point; detailed release procedures stay
  in RELEASING.md and product architecture stays in FRAMEWORK.md.
- Update the command list whenever package.json scripts or supported hosts
  change.
- Reviewers should check that stop/report rules prevent unauthorized
  deployment and that generated-file ownership is explicit.
- Revisit this contract after Plan 006 establishes the authoritative build
  manifest/host proof and after Plan 008 records the content-engine direction.
