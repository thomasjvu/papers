# CLI

The CLI is the coder-first path through Phantasy.

It runs on the same core runtime used by companion/VTuber products and server deployments, so you can combine coding capability with persona, memory, workflows, and later admin/server surfaces without switching frameworks.

The entrypoint is `src/cli/index.ts`. If no top-level command is provided, Phantasy starts the interactive chat/TUI flow.

## Main Commands

The generated command inventory is here: [generated/cli-commands.md](./generated/cli-commands.md).

## Common Usage

```bash
npx phantasy
npx phantasy chat --config config/agents/my-brand.json
npx phantasy chat --config config/agents/editorial-companion.json
npx phantasy start
npx phantasy workflow list
npx phantasy create agent
npx phantasy create business-cms my-brand
npx phantasy create developer local-coder
npx phantasy create plugin publishing-hook --workspace site --kind capability
npx phantasy create skill editorial-voice --workspace character --kind behavior
npx phantasy create theme atelier
npx phantasy setup
npx phantasy models auth import-codex --provider openai-codex
```

If the CLI is already installed globally or otherwise available on your `PATH`, you can use `phantasy` directly.

## Runtime Model

The CLI runtime is implemented in `src/cli/runtime/agent-runtime.ts`.

It loads agent config, bootstrap files, memory, selected profiles, skills, MCP servers, workflows, provider routing, and the terminal UI.

Example profile selection:

```json
{
  "pluginProfiles": ["coder", "character"]
}
```

That gives you a persona-driven coding agent without changing runtimes.

If you want the fully explicit local developer stack, use:

```bash
npx phantasy create developer local-coder
```

That preset opts into the composite `agent` profile on purpose, rather than inheriting coder tools from beginner product shapes.

## Notes

- The CLI is Bun-first in this repo.
- Global workspace setup uses `~/.phantasy/`.
- The CLI shares the same provider and plugin registries as the server path.
- `phantasy models auth` manages session-backed providers such as `openai-codex`.
- If no profile is requested, the runtime stays on `core-runtime`.
- `AGENTS.md`, `SKILL.md`, and MCP are all first-class parts of the CLI path. See [Agent Compatibility](/docs/architecture/agent-compatibility).
