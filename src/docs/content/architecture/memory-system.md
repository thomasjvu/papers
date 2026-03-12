# Memory System

Phantasy is markdown-first by default.

That means a fresh local install can persist memory without standing up a vector database first.

## Memory vs Knowledge

- Memory: user facts, daily notes, persistent context, conversation-adjacent state
- Knowledge: uploaded or indexed external documents queried through knowledge tooling

## Supported Memory Providers

- `markdown`: default, filesystem-backed
- `sqlite`: local vector search
- `qdrant`: external vector database
- `pgvector`: PostgreSQL vector storage

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

- Use `markdown` when you want zero-config local persistence.
- Use `sqlite` when you want local semantic search without an external service.
- Use `qdrant` or `pgvector` when you want a dedicated vector layer.

## Related Docs

- [Configuration](/docs/getting-started/configuration)
- [Workspaces](/docs/workspaces)
