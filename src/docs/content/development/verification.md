# Verification

Prefer targeted verification first, then escalate to the broader suite when the change surface warrants it.

This mirrors the working agreement in the main `@phantasy/agent` repo.

## Targeted Checks

```bash
bun run test:core -- src/path/to/test.ts
bun run test:ui:components -- src/admin-ui/path/to/test.tsx
bun run validate:standards
bun run docs:check
```

Use these when your change is local to one subsystem or one workspace surface.

## Broad Checks

```bash
bun run test
bun run typecheck
bun run build
```

Add the style layer when you touch admin UI CSS:

```bash
bun run stylelint
```

## When To Regenerate Inventories

If you change any of these source-of-truth surfaces, refresh the generated docs in the main product repo:

- admin tabs
- admin API routes
- package exports
- providers
- built-in plugins
- bundled skills/themes

Command:

```bash
bun run docs:generate
```

If you maintain `papers` alongside the product repo, sync that generated folder into the docs site instead of hand-editing copies:

```bash
PAPERS_GENERATED_DOCS_SOURCE=../agent/docs/generated npm run sync:generated
npm run docs:check
```

That keeps the generated inventory pages tied to the code-derived source and catches drift before release.

## Release-Oriented Checks

For release or package-surface changes:

```bash
bun run typecheck
bun run test
bun run validate:standards
bun run docs:check
bun run build
npm pack --dry-run
```

## Why `validate:standards` Matters

Lint and typecheck catch generic issues. `validate:standards` enforces Phantasy-specific architectural contracts such as:

- taxonomy metadata integrity
- admin route and tab consistency
- plugin/theme/skill manifest integrity
- admin UI style-policy rules

## Related Docs

- [Repository Standards](/docs/architecture/repo-standards)
- [Admin UI Style Policy](/docs/architecture/admin-ui-style-policy)
- [Local Development](/docs/getting-started/local-development)
