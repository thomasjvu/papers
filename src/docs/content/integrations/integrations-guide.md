# Integration Model

Phantasy has five extension surfaces.

They overlap just enough to be confusing if you treat them casually, so here is the clean version.

## Quick Map

| Need                          | Use         |
| ----------------------------- | ----------- |
| Workspace behavior            | `AGENTS.md` |
| Reusable know-how             | `SKILL.md`  |
| Executable external tools     | MCP         |
| Runtime capability            | Plugin      |
| First-party capability bundle | Profile     |

## The Mental Model

- `AGENTS.md` changes how the agent behaves in a workspace
- skills teach workflows
- MCP gives the model real external tools
- plugins change the runtime
- profiles choose built-in plugin bundles

That separation keeps the trusted core smaller and the product easier to reason about.

## Common Shapes

### Coding Agent

```json
{
  "pluginProfiles": ["coder"]
}
```

### Companion

```json
{
  "pluginProfiles": ["character"]
}
```

### In-Character Coder

```json
{
  "pluginProfiles": ["coder", "character"]
}
```

### Hosted Product Surface

```json
{
  "pluginProfiles": ["coder", "character", "server-admin"]
}
```

That last shape is the one that adds the HTTP admin and server surface.

## `AGENTS.md`

Use it for:

- repo rules
- local workflow expectations
- tone and collaboration style
- "how we work here" guidance

If the behavior belongs to one workspace or repo, start here.

## Skills

Use skills when the model needs structured guidance, not new executable power.

Good fits:

- CLI playbooks
- review checklists
- operating procedures
- environment-specific instructions

## MCP

Use MCP when the model needs to call a real external system.

Typical examples:

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

Skills and MCP pair well: the skill explains the job, MCP does the job.

## Plugins

Use a plugin when you need deeper runtime hooks:

- lifecycle behavior
- tool registration
- platform adapters
- provider or storage integration

Plugins are the heaviest extension surface. Reach for them on purpose.

## Profiles

Built-in profile groups:

- `core-runtime`
- `coder`
- `character`
- `server-admin`

If `pluginProfiles` is omitted, Phantasy stays on `["core-runtime"]`.

## Decision Rule

Use this order:

1. workspace behavior: `AGENTS.md`
2. reusable know-how: skill
3. external executable tools: MCP
4. runtime hook or platform behavior: plugin
5. first-party built-in bundle: profile

## Related Docs

- [Bootstrapping](/docs/getting-started/bootstrapping)
- [Agent Compatibility](/docs/architecture/agent-compatibility)
- [Plugin Overview](/docs/plugins/overview)
- [Consuming Phantasy](/docs/guides/CONSUMING_PHANTASY)
