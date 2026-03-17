# Documentation

Public docs live in `apps/docs/src/docs/content`.

## Style

- Keep pages short, product-first, and specific.
- Explain one idea per section.
- Prefer links to canonical pages over repeating the same guidance in multiple places.
- Keep commands minimal and runnable.
- Treat marketing copy as secondary to clarity.

## Source Of Truth

- Narrative pages in `apps/docs/src/docs/content/` explain the product, workflows, and operating model.
- Generated reference pages in `apps/docs/src/docs/content/generated/` come from `scripts/lib/doc-inventory.ts`.
- Root repo guides such as `README.md`, `CONTRIBUTING.md`, `MIGRATION.md`, and `TROUBLESHOOTING.md` stay short and point back to the docs app.
- Package READMEs explain package-local usage. They are not the canonical product docs.

## Generated Pages

Do not hand-edit:

- `apps/docs/src/docs/content/generated/providers.md`
- `apps/docs/src/docs/content/generated/plugins.md`
- `apps/docs/src/docs/content/generated/skills.md`
- `apps/docs/src/docs/content/generated/themes.md`
- `apps/docs/src/docs/content/generated/workflows.md`
- `apps/docs/src/docs/content/generated/mcp.md`
- `apps/docs/src/docs/content/generated/presets.md`
- `apps/docs/src/docs/content/generated/admin-tabs.md`
- `apps/docs/src/docs/content/generated/cli-commands.md`
- `apps/docs/src/docs/content/generated/api-routes.md`
- `apps/docs/src/docs/content/generated/package-exports.md`
- `apps/docs/src/docs/content/generated/defaults.md`
- `apps/docs/src/docs/content/generated/party-hq-protocol.md`

Refresh them with:

```bash
bun run docs:generate
```

## Author Workflow

1. Update the narrative page when user-facing behavior changes.
2. Regenerate inventories when metadata, routes, providers, presets, or defaults change.
3. Run `bun run docs:check` before merging.

For broad release work, use:

```bash
bun run release:check
```

## Drift Rules

- If a fact can be generated from code, generate it.
- If a fact needs explanation or tradeoffs, keep it in narrative docs.
- If a short repo guide starts growing into a manual, move that detail into `apps/docs/src/docs/content` and leave a link behind.
