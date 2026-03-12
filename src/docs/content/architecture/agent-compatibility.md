# Agent Compatibility

Phantasy intentionally supports the common local-agent surfaces people already use across modern coding-agent stacks:

- `AGENTS.md` for local operating instructions
- `SKILL.md` for on-demand capability instructions
- `.mcp.json` and `mcpServers` for Model Context Protocol tools
- profile and plugin config for runtime capability composition

## The Short Version

- `AGENTS.md` tells the agent how to behave in a workspace
- `SKILL.md` teaches the agent how to do a workflow
- MCP gives the agent callable external tools
- plugins and profiles extend the runtime itself

Use all four together when needed. They are complementary, not competing abstractions.

## `AGENTS.md` And Bootstrap Files

Phantasy bootstraps per-agent workspaces with a small set of local instruction files:

- `AGENTS.md`
- `SOUL.md`
- `IDENTITY.md`
- `TOOLS.md`
- `USER.md`
- `memory/MEMORY.md`

The CLI prompt builder loads those files into the system prompt so local workspace instructions shape the agent without forking the runtime.

Use `AGENTS.md` for operating rules and workflow expectations, not for volatile memory or one-off task notes.

## `SKILL.md` Compatibility

Phantasy’s skill system is built around the Agent Skills pattern: markdown instructions with YAML frontmatter, loaded progressively.

What Phantasy supports:

- project skills in `./skills/*/SKILL.md`
- user skills in `~/.phantasy/skills/*/SKILL.md`
- bundled skills shipped with the framework
- linked skills from plugins
- optional npm-delivered skill packages

Skills are instruction surfaces. They teach the model when and how to use tools, CLIs, workflows, and conventions.

Phantasy also supports OpenClaw-style gating and installer metadata through `metadata.openclaw`.

## MCP Compatibility

Phantasy supports Model Context Protocol servers as external tool providers.

Configuration precedence:

1. `agentConfig.mcpServers`
2. project `.mcp.json`
3. `~/.phantasy/mcp.json`

That matches the practical setup most teams expect: shared project defaults with local overrides and per-agent specificity.

## Skills vs MCP vs Plugins

| Need                                     | Use               |
| ---------------------------------------- | ----------------- |
| Teach the model a workflow or CLI        | `SKILL.md`        |
| Give the model executable external tools | MCP               |
| Add runtime/platform capability          | profile or plugin |
| Set local workspace behavior             | `AGENTS.md`       |

## Example Composition

```json
{
  "pluginProfiles": ["coder", "character"],
  "skills": {
    "github": { "enabled": true }
  },
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

This gives you:

- coder tools from the runtime
- persona and companion behavior from the character profile
- GitHub workflow instructions from a skill
- live GitHub actions through MCP

## Recommendation

Keep the base runtime boring.

Put local behavior in `AGENTS.md`, reusable workflow knowledge in `SKILL.md`, external tools in MCP, and product/runtime concerns in profiles or plugins.
