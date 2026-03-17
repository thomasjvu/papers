# Framework Audit

This page summarizes the current state of the codebase after the truth-consolidation sweep.

## What Is Working Well

- The server bootstrap is modular and centers on `src/server/server.ts`.
- The CLI runtime is a real runtime, not a thin wrapper, and lives in `src/cli/runtime/agent-runtime.ts`.
- Memory is layered cleanly: markdown by default, vector backends optional.
- Workflows are modeled as graph execution rather than ad hoc chained prompts.
- The provider system and plugin system both already had the right instinct: registries, manifests, and validation.

## What Was Causing Drift

- Multiple hardcoded provider, plugin, tab, and default inventories had diverged from runtime truth.
- Docs were mixing old ports, old counts, old licensing text, and stale paths.
- Built-in plugins were code-first, but validation expected JSON sidecars.
- The old generated TypeScript provider catalog was large and imported broadly.

## What Is Now the Source of Truth

- Providers: `src/providers/builtin-registry.ts` and `src/provider-system/`
- Built-in plugins: `src/plugins/manager/builtin-plugins.ts` and each plugin's `getManifest()`
- Admin tabs: `src/admin-ui/components/layout/tab-registry-data.ts`
- Defaults: `src/config/constants.ts`
- Generated inventories: `apps/docs/src/docs/content/generated/*.md`

## Current Inventory Pages

- [Providers](../generated/providers.md)
- [Built-in plugins](../generated/plugins.md)
- [Admin tabs](../generated/admin-tabs.md)
- [CLI commands](../generated/cli-commands.md)
- [Admin API routes](../generated/api-routes.md)
- [Package exports](../generated/package-exports.md)
- [Defaults](../generated/defaults.md)

## Priority Follow-Through

- Keep generated docs checked in and refresh them with `bun run docs:generate`.
- Gate doc drift with `bun run docs:check`.
- Gate registry drift with `bun run validate:standards` so route files cannot quietly fall out of the mounted surface.
- Keep built-in plugin validation code-first.
- Prefer scoped/shared `PluginManager` lifecycles over ad hoc construction.
