# Bootstrapping

Phantasy has two filesystem stories:

- a machine-level home at `~/.phantasy/`
- a product/runtime workspace, usually `./workspace`

Keeping those separate makes the repo easier to reason about.

## Global Home

Use the global home for provider credentials, hooks, and a default personal workspace:

```bash
phantasy setup
phantasy setup provider --list
phantasy setup provider --provider openai --api-key <key>
```

`phantasy setup` creates a structure like this:

```text
~/.phantasy/
├── config.json
├── credentials/
├── hooks/
└── workspace/
    └── default/
        ├── AGENTS.md
        ├── SOUL.md
        ├── USER.md
        ├── IDENTITY.md
        ├── TOOLS.md
        ├── HEARTBEAT.md
        ├── BOOT.md
        ├── memory/MEMORY.md
        └── sessions/
```

That is the personal operator home, not the only place a product runtime can live.

## Runtime Workspace

The actual runtime resolves its workspace root from:

1. `memoryConfig.workspacePath`
2. `PHANTASY_WORKSPACE`
3. `./workspace`

When it looks for agent context files, it checks these candidates in order:

- `<workspaceRoot>`
- `<workspaceRoot>/<agentId>`
- `<workspaceRoot>/agents/<agentId>`
- `~/.phantasy/workspace/<agentId>`

So a repo-local workspace, an agent-specific subfolder, and the global fallback can all work.

## What Lives In The Workspace

Phantasy uses the workspace for a few different surfaces:

- context files such as `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `TOOLS.md`, `BOOT.md`, and `HEARTBEAT.md`
- markdown memory under `agents/<agentId>/memory/`
- conversation history under `agents/<agentId>/conversations/`
- per-user context under `users/<userId>/USER.md`

One subtle point: the bootstrapped global default workspace includes `memory/MEMORY.md`, while the repo/runtime memory path usually lands under `agents/<agentId>/memory/`. Both are understood by the current loader.

## Good Default

For a normal product setup:

- keep secrets in env vars or `~/.phantasy/config.json`
- keep product memory and companion data in `./workspace`
- let the CLI and admin shell point at the same workspace root

If the data should travel with the repo, do not leave it only under `~/.phantasy/`.

## Next

- [Configuration](/docs/getting-started/configuration)
- [Memory System](/docs/architecture/memory-system)
- [Agent Compatibility](/docs/architecture/agent-compatibility)
