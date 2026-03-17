# Consuming Phantasy

Build an AI companion/VTuber, then layer site, content, automations, and business around her on the same foundation.

This guide is for teams embedding Phantasy into another repo, product, or platform.

## Choose The Surface

| Need                  | Install                  | Notes                                                                                      |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| Full framework        | `@phantasy/agent`        | Easiest way to get a companion/VTuber, CMS, CLI, server, and shared runtime in one package |
| Headless runtime      | `@phantasy/agent-core`   | Public `AgentRuntime`, config, workflows, memory, approvals, and provider contracts        |
| Provider layer        | `@phantasy/providers`    | Unified multi-provider model and media adapters                                            |
| CLI                   | `@phantasy/cli`          | Command parsing, scaffolding, and non-visual runtime lifecycle                             |
| TUI                   | `@phantasy/tui`          | Interactive terminal UI on top of `AgentRuntime`                                           |
| Admin frontend        | `@phantasy/admin-web-ui` | Admin CMS frontend assets and path resolution                                              |
| Admin/server surfaces | `@phantasy/server-admin` | Express server, admin API, CMS, publishing, and operational route layer                    |
| Plugin authoring      | `@phantasy/plugin-sdk`   | Build first-party or external plugins against the stable SDK                               |

## Default Recommendation

If you are building a companion-driven product, a VTuber business, or a workflow application and want the fastest path, start with the meta package:

```bash
npm install @phantasy/agent
```

Then compose capabilities in config instead of hard-coding privileged behavior into your runtime:

```json
{
  "id": "kurisu",
  "name": "Kurisu",
  "instructions": "You are sharp, technically rigorous, and emotionally expressive.",
  "capabilities": {
    "coding": true,
    "character": true,
    "admin": true
  },
  "approvals": {
    "commands": "ask",
    "files": "ask",
    "browser": "ask"
  },
  "modelRouting": {
    "default": {
      "provider": "openai",
      "model": "gpt-4.1"
    },
    "fast": {
      "provider": "openai",
      "model": "gpt-4.1-mini"
    }
  }
}
```

That keeps companion identity, CMS surfaces, and capability composable:

- `{"character": true, "admin": true}` for a character-native product
- `{"coding": true}` for a coding agent
- `{"coding": true, "character": true}` for an in-character coding agent
- `{"coding": true, "character": true, "admin": true}` for a full operator stack

## Focused Package Consumption

If you want a smaller public surface and a narrower trust boundary, install only the packages you need:

```bash
npm install @phantasy/agent-core @phantasy/providers
```

Typical import shape:

```ts
import { createAgentRuntime, ConfigLoader } from '@phantasy/agent-core';
import { registerBuiltInProviders } from '@phantasy/providers';

registerBuiltInProviders();

const runtime = createAgentRuntime({
  agentConfig,
  providerService,
  routing,
  pluginManager,
  env: process.env,
  cwd: process.cwd(),
});
```

`@phantasy/agent-core` does not ship the built-in provider implementations.
Install `@phantasy/providers` when you want the default provider catalog, or
register your own provider definitions through the standalone provider surface.
If you want strict ownership boundaries, `@phantasy/providers` also supports
instance-owned registry/service wiring via `createProviderRegistry()` and
`createProviderService()`.
The core runtime also does not silently inherit config discovery, dotenv,
`process.env`, or `process.cwd()`; pass those explicitly when your host wants
them.
If you want Phantasy's default config discovery/bootstrap behavior, use
`createDefaultAgentRuntime(...)` from `@phantasy/agent` instead of `agent-core`.

The first-party packages are published as real package surfaces. Internally they stay aligned with the same shared implementation so public APIs do not drift.

## CLI And Server Consumption

Phantasy supports two main runtime paths:

- CLI-first development with `npx phantasy chat` or `npx phantasy start` after a local install, or `npx @phantasy/agent ...` for a zero-install run
- server deployment with the admin/server surface

The important point is that both paths sit on the same runtime model. You do not switch frameworks when moving from a local companion prototype to a hosted product or workflow application.

The CLI and TUI are intentionally composition shells, not alternate kernels.
They should stay rich and opinionated, but the shared runtime should remain
usable without them. That is why `@phantasy/agent-core` owns the host-first
runtime API while `@phantasy/agent` owns the default Phantasy bootstrap path.

### CLI Example

```bash
npx @phantasy/agent chat --config ./agent-config.json
```

### Server Example

```ts
import { Server } from '@phantasy/agent';

const server = new Server();
await server.start();
```

## Skills, MCP, And Workspace Compatibility

Phantasy treats the common agent compatibility surfaces as first-class:

- `AGENTS.md` for workspace-specific operating rules
- `SKILL.md` for structured, progressive-disclosure skills
- MCP for executable external tools

That means a consumer can build on the same conventions other agent ecosystems use without losing Phantasy-specific runtime features.

Example config:

```json
{
  "capabilities": { "coding": true, "character": true, "admin": false },
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

Skills can come from:

- project `skills/`
- user `~/.phantasy/skills/`
- bundled skills
- installed npm skill packages that ship a `SKILL.md`

## Source-Level Consumption

If you want exact source pinning, custom patching, or a mono-repo workflow, consume the repo as source instead of as published packages.

Typical patterns:

- git submodule
- git subtree
- workspace package inside a larger mono-repo

When doing that, keep the package boundaries intact:

- `src/agent-core/`
- `src/providers/`
- `src/cli/`
- `src/tui/`
- `src/admin-web-ui/`
- `src/server-admin/`
- `src/admin-ui/` as the dashboard app boundary

That will make future upgrades much easier than depending on internal service paths.

## Plugin Consumption

Use the SDK when you need to add new runtime capability:

```bash
npm install @phantasy/plugin-sdk
```

External plugins should be treated as staged extensions, not as part of the trusted base runtime. Phantasy’s remote install flow now stages and verifies before enablement, and does not auto-run lifecycle scripts during staging.

## What To Avoid

- Do not treat the admin UI as part of the trusted core.
- Do not put privileged tooling into the base runtime when an explicit capability and approval policy can own it.
- Do not couple persona to capability. Compose them.
- Do not depend on legacy docs that assume “everything is core”.

## Recommended Architecture For Consumers

1. Keep your product identity in config, prompts, bootstrap files, and content.
2. Keep capability selection in `capabilities`.
3. Treat companion presentation and the business surfaces around her as first-class product concerns, not theme polish.
4. Use skills for “how to do the work”.
5. Use MCP for “call the external system”.
6. Use plugins only when you need deeper runtime integration.

## See Also

- [Introduction](../getting-started/introduction.md)
- [Configuration](../getting-started/configuration.md)
- [Agent Compatibility](../architecture/agent-compatibility.md)
- [Runtime Packages](../architecture/runtime-packages.md)
- [Plugin Overview](../plugins/overview.md)
