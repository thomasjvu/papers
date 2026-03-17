# Configuration Guide

Phantasy configuration resolves in this order:

1. Database values saved through the admin UI
2. Environment variables
3. Agent config files
4. Defaults from `src/config/constants.ts`

The current generated defaults snapshot is here: [./generated/defaults.md](./generated/defaults.md).

## Quick Start

```bash
bun run setup:env
```

Minimum practical configuration:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/phantasy_agent_dev
AUTH_SESSION_SECRET=replace-with-a-random-secret
OPENAI_API_KEY=sk-...
```

## Defaults

- Server port: `2000`
- Admin UI dev server: `5173`
- Default memory provider: `markdown`
- Default workspace path: `./workspace`

## Provider Config

Provider registration is runtime-driven. Use the generated provider inventory for the current list of registered adapters and expected environment variables:

- [./generated/providers.md](./generated/providers.md)

## Memory Config

Supported providers:

- `markdown`
- `pgvector`

## Related Docs

- [./architecture/memory-system.md](./architecture/memory-system.md)
- [./generated/defaults.md](./generated/defaults.md)
