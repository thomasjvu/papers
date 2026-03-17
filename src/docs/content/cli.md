# CLI Guide

The CLI is the fastest way to reach the Phantasy runtime when you want direct control over the companion, coding tools, memory, workflows, and compatibility files.

Today the main chat surfaces are:

- the terminal TUI
- the admin CMS web UI
- Party-HQ as the orchestration surface

Messaging adapters remain separate work and are not required for the core local workflow.

## Start The Runtime

Published package:

```bash
npx phantasy
npx phantasy chat --config config/agents/local-coder.json
npx phantasy start --config config/agents/local-coder.json
```

Source checkout:

```bash
bun run phantasy
bun run phantasy chat --config config/agents/local-coder.json
bun run dev
```

If you need a starter config first:

```bash
npx phantasy create vtuber my-brand
npx phantasy create operator ops-lead
npx phantasy create developer local-coder
```

The full command inventory is still generated in [generated/cli-commands.md](./generated/cli-commands.md).

## Use The TUI

The default chat surface is a real full-screen TUI, not a one-line prompt loop.

Input behavior:

- `Enter` inserts a newline
- `Ctrl+Enter` or `Cmd+Enter` sends
- `Alt+Up` and `Alt+Down` recall prior drafted inputs
- `/` opens slash-command autocomplete

Useful slash commands:

```text
/delegate <subagent> <task>
/delegate-parallel <agent>=<task> ;; <agent>=<task>
/file <path>
/memory <query>
/session-search <query>
/session-list [query]
/stash [name]
/fork [name]
/load <id>
/conversations
/reflections
/reflection-run
/reflection-review <artifact>
/reflection-promote <artifact>
/reflection-archive <artifact>
```

What these do:

- `@subagent task` and `/delegate` run the task in an isolated child runtime for that subagent
- `/delegate-parallel` fans out multiple isolated subagent tasks at once and returns each result separately
- `/session-search` searches prior sessions, including compacted summaries and topics
- `/session-list` lists or ranks recent sessions
- `/reflection-run` turns repeated successful tool patterns into reviewable artifacts
- `/reflection-promote` promotes a reviewed artifact into the active skill set

## Use The Web UI Or Party-HQ

If you want a browser surface instead of the terminal:

- admin route: [http://localhost:2000/admin](http://localhost:2000/admin)
- admin dev server: [http://localhost:5173](http://localhost:5173)

If you already operate through Party-HQ, keep doing that. Phantasy’s local runtime and Party-HQ are meant to describe the same agent, not two different stacks.

## Runtime Model

The CLI runtime is implemented in `src/cli/runtime/agent-runtime.ts`.

It loads:

- agent config
- bootstrap files such as `AGENTS.md`
- skills and MCP
- provider routing
- memory
- workflows
- plugins
- the TUI

Capability selection stays explicit:

```json
{
  "capabilities": { "coding": true, "character": true, "admin": false }
}
```

If `capabilities` is omitted, the runtime defaults to `coding` plus `character`.

## Compatibility Files

Phantasy keeps the familiar local-agent building blocks:

- `AGENTS.md` for workspace behavior
- `SKILL.md` for workflow knowledge
- `.mcp.json` and `mcpServers` for external tools

OpenClaw-style skill gating and installer metadata are preserved through `metadata.openclaw`.

Related docs:

- [Quickstart](./getting-started/quickstart.md)
- [Agent Compatibility](./architecture/agent-compatibility.md)
- [OpenClaw Migration](./guides/OPENCLAW_MIGRATION.md)

## Reflection Lifecycle

Reflection artifacts are intentionally staged:

1. repeated successful sessions generate a draft
2. you review the artifact
3. you promote it into the active skill set

Draft and archived reflection skills stay out of normal discovery. This keeps the learning loop useful without silently loading half-baked skills into the runtime.
