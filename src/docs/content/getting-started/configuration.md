# Configuration

Phantasy merges configuration from a few places. The order matters.

## Priority

Highest wins:

1. persisted admin/database config
2. environment variables
3. agent config files
4. built-in defaults

Generated defaults live in [Defaults Inventory](/docs/generated/defaults).

## The Shape That Matters

Use the current runtime schema directly.

The main keys are:

- `pluginProfiles`
- `modelRouting`
- `providers`
- `integrations`
- `memoryConfig`
- `skills`
- `mcpServers`

Legacy aliases are not the documented contract anymore.

## Minimal Example

```json
{
  "id": "my-agent",
  "name": "My Agent",
  "instructions": "Be clear and reliable.",
  "pluginProfiles": ["character", "server-admin"],
  "modelRouting": {
    "default": { "provider": "kilo-gateway", "model": "minimax/minimax-m2.5:free" },
    "fast": { "provider": "kilo-gateway", "model": "minimax/minimax-m2.5:free" }
  },
  "providers": {
    "kilo-gateway": { "enabled": true }
  },
  "memoryConfig": {
    "provider": "markdown"
  }
}
```

## Profiles

`pluginProfiles` is the main capability switch:

- `core-runtime`
- `coder`
- `character`
- `server-admin`
- `agent` as shorthand for `coder + character + server-admin`

If you omit `pluginProfiles`, the runtime stays on `["core-runtime"]`.

## Skills And MCP

Two config surfaces round out the modern agent model:

- `skills` for enabling `SKILL.md` instruction packs
- `mcpServers` for attaching external Model Context Protocol tools

Example:

```json
{
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

## Validation

```bash
phantasy init --output config/agents/my-agent.json
phantasy validate config/agents/my-agent.json
```

## Related Docs

- [Agent Compatibility](/docs/architecture/agent-compatibility)
- [Providers Inventory](/docs/generated/providers)
- [Runtime Packages](/docs/architecture/runtime-packages)
