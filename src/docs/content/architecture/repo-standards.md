# Repository Standards

`bun run validate:standards` is the repo-specific guardrail layer.

Use it alongside:

- `bun run typecheck`
- `bun run stylelint`
- `bun run lint`

The important difference is scope. ESLint, TypeScript, and Stylelint know generic language rules. `validate-standards` knows Phantasy's architecture contract.

## What It Enforces

### Runtime integrity

- provider directories must match registered runtime providers
- bundled plugin manifests must validate and point at real files
- installable first-party package-surface metadata must stay aligned with the source plugin manifest
- source-extracted plugin payloads cannot add new host-private `@/` reach-through imports without an explicit, reviewed exception
- mounted admin routes cannot drift away from the route registry
- the Party-HQ protocol mirror cannot silently diverge

### Product metadata integrity

- primary admin tabs must map to valid workspaces
- workspace launcher tabs must exist and stay aligned with their section
- dashboard-promoted tabs and specialist admin surfaces must declare icons
- product admin surfaces cannot duplicate names or tab ids
- admin API route metadata cannot duplicate endpoint strings
- bundled dashboard widgets cannot silently collide on `plugin:widgetId`
- bundled widgets inherit ownership from plugin taxonomy, so widgets without plugin taxonomy are rejected

### Admin UI style discipline

- the repo-wide admin inline-style count is budgeted and non-regressing
- clean-room files may only use inline styles for explicit runtime hooks
- feature files cannot borrow CSS modules from unrelated tabs
- product surfaces cannot hardcode custom font families
- component CSS must use shared font tokens or `inherit`

### Admin UI size budgets

These are budget freezes, not ideal targets:

- max component file size: `1770` lines
- files over `700` lines: `3`
- files over `1200` lines: `0`

This keeps debt from growing while the repo is still being split by domain.

### Service-layer size budgets

These are also budget freezes:

- max service file size: `6155` lines
- files over `700` lines: `14`
- files over `1000` lines: `5`
- files over `2000` lines: `2`
- files over `4000` lines: `1`

This keeps the deepest orchestration and language-tooling code from silently becoming even more monolithic while broader domain splits are still in progress.

## Why Budget Freezes Instead Of Perfect Rules

The point is to stop regressions without pretending the codebase is already fully normalized.

That means:

- existing debt is fenced
- new debt must justify itself explicitly
- intentional refactors can ratchet budgets downward
- the standards script should fail on drift, not on history

Today that specifically means the admin UI no longer permits any components above
`1200` lines, and only three historical components remain above `700` lines.

## How To Tighten Or Adjust A Rule

When a cleanup pass lands:

1. lower the matching budget in `scripts/validate-standards.ts`
2. add newly-clean files to the clean-room list when appropriate
3. document new allowed dynamic-style hooks if the component still needs them
4. rerun `bun run validate:standards`, `bun run stylelint`, and `bun run typecheck`

When a rule is too strict:

1. fix the underlying drift if possible
2. if the exception is legitimate, encode it narrowly in `validate-standards.ts`
3. document the reason here or in [admin-ui-style-policy.md](./admin-ui-style-policy.md)

Do not widen budgets casually. If a budget changes upward, it should be tied to an intentional architectural decision, not convenience.

## What We Are Not Enforcing Yet

Deliberately out of scope for now:

- repo-wide raw color-token purity
- full domain-boundary import rules between every workspace module
- perfect file-size ceilings across every historical surface
- browser-level UI smoke coverage in the standards script itself

Those can be added later, but only if the rule is cheap to understand and cheap to maintain.

## Practical Workflow

For contributors:

- run `bun run validate:standards` before large UI or manifest changes
- treat a standards failure as architecture drift, not just lint noise
- prefer shrinking budgets after cleanup passes rather than creating one-off exemptions

For maintainers:

- use this file as the explanation layer
- use `scripts/validate-standards.ts` as the enforcement layer
- keep the policy intentionally boring, explicit, and easy to tune
