# Database Shape

Phantasy's primary database contract is PostgreSQL plus an ordered SQL migration set in `migrations/`.

The migration runner lives at `scripts/run-migrations.ts` and records applied versions in `schema_migrations`.

`schema_migrations` is runner-owned. Migration SQL files should not self-record their own version history.

## What Is Migration-Owned

These tables and functions are part of the authoritative PostgreSQL schema:

- Core runtime and config:
  - `agent_configs`
  - `config_audit_log`
  - `config_locks`
  - `kv_store`
  - `agent_interactions`
  - `agent_statistics`
  - `agent_connections`
  - `agent_events`
- Memory and notes:
  - `memory_vectors`
  - `agent_notes`
- Financial and wallet surfaces:
  - `agent_wallets`
  - `wallet_snapshots`
  - `wallet_transfers`
  - `revenue_events`
  - `financial_sessions`
  - `rate_limits`
  - `custom_integration_rate_limits`
- Specialist protocol surfaces:
  - `erc8004_registrations`
  - `erc8004_feedback`
  - `erc8004_validations`
- PhantasyHub registry:
  - `hub_plugins`
  - `hub_workflows`
  - `hub_skills`
  - `hub_themes`
  - `hub_files`
  - `hub_stars`
  - `hub_downloads`
  - `hub_sessions`

## What Is Not A Separate Database Table

### Plugins

Runtime plugin configuration is stored inside `agent_configs.config` as JSONB, typically under top-level keys like `${pluginName}Config`.

The write path is `src/plugins/manager/plugin-config-persistence.ts`, which merges manifest defaults and persists the updated agent config through `src/services/core/config-management-service.ts`.

Plugins do not create first-party PostgreSQL columns or tables for their normal config path.

### Themes, Skills, And Workflows

Local first-party and project extensions are filesystem-discovered:

- Themes: `themes/`
- Skills: `skills/`
- Workflows: `workflows/`

They only touch PostgreSQL when published into the optional PhantasyHub registry, where their metadata is stored in dedicated `hub_*` tables with JSONB fields for manifests and richer metadata.

### MCP

MCP servers do not have a dedicated database table.

Configuration is layered from:

1. `agentConfig.mcpServers`
2. project `.mcp.json`
3. `~/.phantasy/mcp.json`

See `src/mcp/mcp-config-loader.ts`.

## Dynamic Exceptions

The PostgreSQL schema is mostly migration-owned, but one memory backend still creates part of its shape dynamically:

- `pgvector`: the `memory_vectors` table is migrated, but per-collection HNSW indexes are created at runtime because collection dimensions vary.

That codepath lives in:

- `src/memory/pgvector-store.ts`

## Current Release Read

The main PostgreSQL schema is no longer being created opportunistically at server startup. Runtime services now verify required tables and tell operators to run migrations first.

There is still historical cleanup debt, which is why `migrations/012_reconcile_runtime_schema.sql` exists: earlier versions created or mutated parts of the schema from application code. Treat that file as a one-time reconciliation artifact, not as a template for future broad catch-all migrations.

Also note:

- `config_locks` is historical infrastructure. It is migrated for compatibility with older work, but it is not part of the flagship config save path today.
- `memory_vectors` and `agent_notes` are only partially documented elsewhere, so this page should be treated as the current overview of persistence boundaries.

## Recommended Open Source Posture

For open source release, treat these as the database rules of the road:

- PostgreSQL shape changes require a new migration.
- Migration files should not mutate `schema_migrations` directly; only the runner should record applied versions.
- Plugin, workflow, skill, theme, and MCP configuration should prefer JSON/manifest fields over ad hoc first-party columns unless the data becomes a product-owned query surface.
- Runtime verification should fail fast when migrations are missing, but it should not silently mutate shared PostgreSQL schema outside the migration set.
