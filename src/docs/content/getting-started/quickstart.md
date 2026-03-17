# Quickstart

This is the fastest path to a usable Phantasy runtime with the current chat surfaces:

- the terminal TUI
- the admin CMS web UI
- Party-HQ as the orchestration surface

Messaging adapters such as Telegram, Slack, WhatsApp, and Signal are planned separately. You do not need them to get a full local agent loop running.

## 1. Install

Published package:

```bash
npm install @phantasy/agent
```

Source checkout:

```bash
bun install
```

## 2. Create A Starter Agent

The recommended presets are still the main beginner path:

```bash
npx phantasy create vtuber my-brand
npx phantasy create operator ops-lead
npx phantasy create developer local-coder
```

Use `developer` if you want the most obvious coding-first setup. Use `vtuber` or `operator` if you want the flagship companion story first.

## 3. Start Chat

TUI:

```bash
npx phantasy chat --config config/agents/local-coder.json
```

Server + admin UI:

```bash
npx phantasy start --config config/agents/local-coder.json
```

From a source checkout, the equivalent commands are:

```bash
bun run phantasy chat --config config/agents/local-coder.json
bun run dev
```

Default local surfaces:

- TUI: launched by `phantasy chat`
- Admin CMS: [http://localhost:2000/admin](http://localhost:2000/admin)
- Admin UI dev server: [http://localhost:5173](http://localhost:5173)
- API/server: [http://localhost:2000](http://localhost:2000)

## 4. Use The TUI Like An Actual Editor

The TUI now supports multiline drafting instead of a single-line prompt box:

- `Enter` inserts a newline
- `Ctrl+Enter` or `Cmd+Enter` sends the message
- `Alt+Up` and `Alt+Down` walk input history
- `/` opens slash-command suggestions

Useful first commands:

```text
/delegate reviewer audit the routing layer
/delegate-parallel reviewer=check provider routing ;; researcher=compare docs
/memory <query>
/session-search <query>
/session-list [query]
/reflections
/reflection-run
```

## 5. Turn Repeated Work Into Reusable Skills

For multi-agent setups, you can delegate directly from the TUI:

- `@subagent task` streams one isolated delegated run
- `/delegate <subagent> <task>` does the same through slash commands
- `/delegate-parallel <agent>=<task> ;; <agent>=<task>` runs multiple isolated subagents at once

Subagent delegation stays isolated from the parent runtime's in-memory conversation state, so switching workstreams no longer mutates the active agent in place.

Phantasy can watch repeated successful tool sequences and turn them into reviewable reflection artifacts.

Run:

```text
/reflection-run
```

Then review the generated artifact list:

```text
/reflections
/reflection-review <artifact-id-or-slug>
/reflection-promote <artifact-id-or-slug>
```

Draft reflection skills stay out of normal skill discovery until you promote them.

## 6. Bring Your Existing Agent Setup

Phantasy intentionally keeps the familiar local-agent files:

- `AGENTS.md`
- `SKILL.md`
- `.mcp.json`
- `agentConfig.mcpServers`

If you are coming from OpenClaw-style projects, start with [OpenClaw Migration](../guides/OPENCLAW_MIGRATION.md) and [Agent Compatibility](../architecture/agent-compatibility.md).

## Next

- [CLI](../cli.md)
- [Installation](./installation.md)
- [First Run](./first-run.md)
- [Bootstrapping](./bootstrapping.md)
