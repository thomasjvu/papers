# Configuration

Phantasy supports config from files, env, and persisted admin settings.

## Priority

Runtime merge order (highest wins):

1. DB/KV saved config
2. Environment variables
3. Agent config files
4. Defaults

Provider startup behavior:

- Env vars are highest precedence.
- Global `~/.phantasy/config.json` provider values fill missing env provider fields.

## Canonical Shape

- Use the current runtime schema directly when writing config files.
- Route model selection through `modelRouting`.
- Put provider credentials and flags under `providers`.
- Put channel/platform settings under `integrations`.
- Put vector memory settings under `memoryConfig`.

Legacy alias fields are no longer part of the documented config contract.

## Quick Start

```bash
phantasy init --output config/agents/my-agent.json
phantasy validate config/agents/my-agent.json
```

## Example Config

```json
{
  "id": "my-agent",
  "name": "My Agent",
  "personality": "Helpful and concise.",
  "instructions": "Be accurate and clear.",
  "capabilities": {
    "coding": true,
    "character": true,
    "admin": false
  },
  "approvals": {
    "commands": "ask",
    "files": "ask",
    "browser": "ask"
  },
  "modelRouting": {
    "default": { "provider": "kilo-gateway", "model": "minimax/minimax-m2.5:free" },
    "fast": { "provider": "kilo-gateway", "model": "minimax/minimax-m2.5:free" }
  },
  "providers": {
    "kilo-gateway": { "enabled": true }
  },
  "memoryConfig": {
    "enabled": true,
    "provider": "markdown"
  }
}
```

## Capability Selection

`capabilities` is the main first-party capability switch.

Supported values:

- `coding`
- `character`
- `admin`

Examples:

Coding agent:

```json
{
  "capabilities": { "coding": true, "character": false, "admin": false }
}
```

In-character coding companion:

```json
{
  "capabilities": { "coding": true, "character": true, "admin": false }
}
```

Self-hosted full product:

```json
{
  "capabilities": { "coding": true, "character": true, "admin": true }
}
```

Environment override:

```bash
PHANTASY_CAPABILITIES=coding,character
```

If `capabilities` is omitted, the runtime defaults to `coding` plus `character`.

## Approval Policy

Use `approvals` to gate privileged actions:

- `commands`: shell, git, npm, node execution
- `files`: write and edit actions
- `browser`: browser-driving actions

Example:

```json
{
  "approvals": {
    "commands": "ask",
    "files": "ask",
    "browser": "ask",
    "remember": {
      "persist": true,
      "revokeOnRestart": false
    },
    "enableCodingTools": true
  }
}
```

## External Plugins

`optionalPlugins` is for extra capability beyond the first-party built-in capabilities.

Remote plugins are staged and verified before enablement. Install no longer implies execution.

## Skills And MCP

Two additional config surfaces matter for compatibility with modern agent setups:

- `skills`: enable or disable discovered `SKILL.md` capabilities
- `mcpServers`: attach external MCP tool servers

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

See [Agent Compatibility](/docs/architecture/agent-compatibility) for the full model.

## Global Provider Keys

Set reusable provider credentials once:

```bash
phantasy setup provider --provider kilo-gateway --api-key <key> --enabled true
```

List available provider IDs:

```bash
phantasy setup provider --list
```

Global schema:

```json
{
  "providers": {
    "<providerId>": {
      "apiKey": "string",
      "apiUrl": "string",
      "enabled": true
    }
  }
}
```

## Validation

```bash
phantasy validate config/agents/my-agent.json
```

`kilo-gateway` dynamic model list keeps only free entries:

- zero prompt/completion pricing
- model name/id containing `"free"`
