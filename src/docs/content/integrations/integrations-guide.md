# Integration Model

Phantasy has five extension surfaces. They solve different problems and should not be mixed together casually.

## Quick Map

| Need                                           | Use         | Why                                                        |
| ---------------------------------------------- | ----------- | ---------------------------------------------------------- |
| Workspace-specific operating behavior          | `AGENTS.md` | Repo or workspace instructions                             |
| Teach the model how to do something            | `SKILL.md`  | Declarative instructions, examples, progressive disclosure |
| Give the model executable external tools       | MCP         | Real API and system tool access                            |
| Add runtime capability or platform integration | Plugin      | Deeper runtime hooks, tools, lifecycle behavior            |
| Bundle first-party capability                  | Capability  | Stable set of built-in plugins selected as one unit        |

## The Mental Model

- `AGENTS.md` changes behavior in a workspace.
- Skills change what the model knows how to do.
- MCP changes what external tools the model can call.
- Plugins change the runtime itself.
- Capabilities choose which built-in plugin sets are active.

That separation is what keeps the core runtime smaller and easier to trust.

## Recommended Composition Patterns

### Coding Agent

```json
{
  "capabilities": { "coding": true, "character": false, "admin": false }
}
```

Use this when the agent should focus on shell, files, search, and editing.

### Companion Or Persona Agent

```json
{
  "capabilities": { "coding": false, "character": true, "admin": false }
}
```

Use this for personality-driven agents with memory, voice, image, and companion behavior.

### In-Character Coding Agent

```json
{
  "capabilities": { "coding": true, "character": true, "admin": false }
}
```

This is the intended way to build agents like Kurisu that should both act in-character and code effectively.

### Hosted Product Surface

```json
{
  "capabilities": { "coding": true, "character": true, "admin": true }
}
```

Use `admin: true` or `@phantasy/server-admin` when you want the HTTP admin surface and dashboard deployment path.

## AGENTS.md

Use `AGENTS.md` for:

- repo-specific instructions
- local workflow rules
- preferred coding style
- team expectations

Good examples:

- “Prefer short responses in this repo.”
- “Run focused tests before broad suites.”
- “Do not touch generated assets without explicit approval.”

## Skills

Skills are the right tool when the model needs structured guidance rather than new executable power.

Use skills for:

- CLI workflows
- operator playbooks
- review checklists
- environment-specific procedures

Skills can be discovered from:

- project `skills/`
- user `~/.phantasy/skills/`
- bundled skills
- npm packages that ship a `SKILL.md`

If you publish skill packages, prefer the `@phantasy/skill-*` naming pattern so discovery stays obvious.

## MCP

Use MCP when the model needs to call a real external system.

Typical MCP uses:

- GitHub
- databases
- issue trackers
- internal APIs

Example:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

Skills and MCP often pair well:

- skill teaches the workflow
- MCP provides the executable tool

## Plugins

Plugins are for runtime-level capability, not basic prompt guidance.

Use a plugin when you need:

- lifecycle hooks
- runtime tool registration
- platform adapters
- memory/provider/runtime integration

Plugins are the heaviest extension surface and should be used deliberately.

## Capabilities

Capabilities are the stable, first-party runtime bundles:

- `coding`
- `character`
- `admin`

The default headless runtime stays explicit. Privileged tools and server surfaces do not silently expand beyond the selected capabilities and approval policy.

## Decision Rules

Use these rules in order:

1. If it is just workspace behavior, use `AGENTS.md`.
2. If it is instructions or workflow knowledge, use a skill.
3. If it is executable access to an external system, use MCP.
4. If it must hook the runtime or platform layer, use a plugin.
5. If it is a standard first-party capability bundle, use `capabilities`.

## See Also

- [Agent Compatibility](../architecture/agent-compatibility.md)
- [Bootstrapping](../getting-started/bootstrapping.md)
- [Plugin Overview](../plugins/overview.md)
- [Consuming Phantasy](../guides/CONSUMING_PHANTASY.md)
