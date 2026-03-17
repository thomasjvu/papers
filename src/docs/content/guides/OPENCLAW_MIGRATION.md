# OpenClaw Migration

Phantasy is not a byte-for-byte clone of OpenClaw, but the local operating model is intentionally close enough that most teams can migrate by moving workspace files instead of rewriting everything.

## What Carries Over Directly

| OpenClaw surface             | Phantasy surface             | Notes                                                       |
| ---------------------------- | ---------------------------- | ----------------------------------------------------------- |
| `AGENTS.md`                  | `AGENTS.md`                  | Same role: workspace operating rules and local expectations |
| `SKILL.md`                   | `SKILL.md`                   | Same progressive-disclosure skill model                     |
| `metadata.openclaw.requires` | `metadata.openclaw.requires` | Preserved for gating                                        |
| `metadata.openclaw.install`  | `metadata.openclaw.install`  | Preserved for install hints                                 |
| `.mcp.json`                  | `.mcp.json`                  | Project-level MCP discovery still works                     |
| runtime `mcpServers`         | `agentConfig.mcpServers`     | Per-agent MCP override path                                 |

## What Changes

| OpenClaw habit                                  | Phantasy equivalent                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| one terminal-first runtime story                | terminal TUI, admin CMS web UI, and Party-HQ all sit on the same runtime            |
| ad hoc workspace identity                       | explicit presets such as `vtuber`, `operator`, and `developer`                      |
| session recall as an external concern           | markdown-first session history with ranked `/session-search` and `/session-list`    |
| auto-generated skills mixed into the active set | reflection artifacts start as drafts and only enter skill discovery after promotion |

## Migration Steps

### 1. Keep Your Workspace Files

Copy your existing agent instructions and skills into the same general locations:

```text
project/
├── AGENTS.md
├── skills/
│   └── your-skill/SKILL.md
└── .mcp.json
```

If you already have OpenClaw-style gating metadata in `SKILL.md`, keep it. Phantasy reads `metadata.openclaw` directly.

### 2. Create A Phantasy Agent Config

Start from a preset instead of hand-authoring everything from scratch:

```bash
npx phantasy create developer local-coder
```

Then point that config at the same project/workspace you already use.

### 3. Move MCP Configuration

You can keep project-wide MCP in `.mcp.json`, or move it into the agent config:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    }
  }
}
```

Precedence is:

1. `agentConfig.mcpServers`
2. project `.mcp.json`
3. `~/.phantasy/mcp.json`

### 4. Start The Runtime

```bash
npx phantasy chat --config config/agents/local-coder.json
```

Or run the full server/admin surface:

```bash
npx phantasy start --config config/agents/local-coder.json
```

### 5. Verify The Three Main Compatibility Loops

Instructions:

- Confirm `AGENTS.md` is being picked up by asking the agent about project rules.

Skills:

- Open the skills browser or trigger a known skill-backed task.

MCP:

- Run an MCP-backed task or inspect the runtime config with the CLI/admin surface.

### 6. Adopt The Phantasy-Specific Runtime Features

Session recall:

```text
/session-search refund policy
/session-list refund
```

Reflection drafts:

```text
/reflection-run
/reflections
/reflection-review <artifact>
/reflection-promote <artifact>
```

Promoted reflection skills become normal discovered skills. Drafts and archived artifacts stay out of the active skill set.

## Current Gaps

There is not yet a one-shot OpenClaw config importer or a legacy command alias layer. Today the migration path is file-compatible and workflow-compatible, not drop-in binary compatibility.

That means:

- copy `AGENTS.md`, skills, and MCP config directly
- generate a Phantasy agent preset
- re-enter any runtime-specific model/provider settings in the Phantasy config

## Related Docs

- [Quickstart](../getting-started/quickstart.md)
- [CLI](../cli.md)
- [Agent Compatibility](../architecture/agent-compatibility.md)
