# Memory System

Phantasy keeps markdown as the readable zero-config default, but the flagship deployment path is PostgreSQL with `pgvector`.

That means you can still start small without a database, while the main production and Docker story stays on one authoritative Postgres stack.

## Memory vs Knowledge

- Memory: user facts, daily notes, persistent context, conversation-adjacent state
- Knowledge: uploaded or indexed external documents queried through knowledge tooling

## Supported Memory Providers

- `markdown`: zero-config, filesystem-backed default
- `pgvector`: recommended PostgreSQL vector storage

The current defaults snapshot is here: [../generated/defaults.md](../generated/defaults.md).

## Default Behavior

The default memory config comes from `src/config/constants.ts`:

```json
{
  "provider": "markdown",
  "workspacePath": "./workspace"
}
```

## Where Memory Lives

Project workspaces typically persist under `workspace/`. The CLI global workspace uses `~/.phantasy/workspace/`.

Common files:

- `MEMORY.md`
- `YYYY-MM-DD.md`
- per-user notes under `users/`

## Runtime Shape

Key pieces in the current codebase:

- `src/memory/` for backend implementations
- `src/services/core/memory-service.ts` for runtime integration
- `src/memory/conversation-markdown-store.ts` for markdown conversation persistence

## Practical Guidance

- Use `markdown` when you want readable local persistence and the simplest setup.
- Use `pgvector` when you want the main Docker/self-hosted Phantasy stack.

## Related Docs

- [Configuration](../configuration.md)
- [Framework audit](./framework-audit.md)
