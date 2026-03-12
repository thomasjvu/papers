# Consuming Phantasy

Build an AI companion/VTuber, then layer site, content, automations, and business around her on the same foundation.

This guide is for teams embedding Phantasy into another repo, product, or platform.

## Choose The Surface

| Need                  | Install                       | Notes                                                                                      |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------ |
| Full framework        | `@phantasy/agent`             | Easiest way to get a companion/VTuber, CMS, CLI, server, and shared runtime in one package |
| Trusted base runtime  | `@phantasy/core-runtime`      | Smallest trust boundary                                                                    |
| Coding capability     | `@phantasy/profile-coder`     | Shell, edit, search, glob, filesystem, doctor                                              |
| Character capability  | `@phantasy/profile-character` | Persona, memory, voice, image, and Live2D/VRM-oriented companion features                  |
| Admin/server surfaces | `@phantasy/server-admin`      | Express server, admin API, CMS, publishing, and operational route layer                    |
| Plugin authoring      | `@phantasy/plugin-sdk`        | Build first-party or external plugins against the stable SDK                               |

## Default Recommendation

If you are building a companion-driven product, a VTuber business, or a workflow application and want the fastest path, start with the meta package:

```bash
npm install @phantasy/agent
```

Then compose profiles in config instead of hard-coding capabilities into your runtime:

```json
{
  "id": "kurisu",
  "name": "Kurisu",
  "instructions": "You are sharp, technically rigorous, and emotionally expressive.",
  "pluginProfiles": ["character", "server-admin", "coder"],
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

- `["character", "server-admin"]` for a character-native product
- `["coder"]` for a coding agent
- `["coder", "character"]` for an in-character coding agent
- `["coder", "character", "server-admin"]` for a full operator stack

## Focused Package Consumption

If you want a smaller public surface and a narrower trust boundary, install only the packages you need:

```bash
npm install @phantasy/core-runtime @phantasy/profile-coder
```

Typical import shape:

```ts
import { ConfigLoader, PluginManager } from '@phantasy/core-runtime';
import { CODER_PROFILE_PLUGIN_NAMES } from '@phantasy/profile-coder';
```

The first-party packages are published as real package surfaces. Internally they stay aligned with the same shared implementation so public APIs do not drift.

## CLI And Server Consumption

Phantasy supports two main runtime paths:

- CLI-first development with `npx phantasy chat` or `npx phantasy start`
- server deployment with the admin/server surface

The important point is that both paths sit on the same runtime model. You do not switch frameworks when moving from a local companion prototype to a hosted product or workflow application.

### CLI Example

```bash
npx phantasy chat --config ./agent-config.json
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
  "pluginProfiles": ["coder", "character"],
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

- `src/core-runtime/`
- `src/profile-coder/`
- `src/profile-character/`
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
- Do not put privileged tooling into the base runtime when a profile can own it.
- Do not couple persona to capability. Compose them.
- Do not depend on legacy docs that assume “everything is core”.

## Recommended Architecture For Consumers

1. Keep your product identity in config, prompts, bootstrap files, and content.
2. Keep capability selection in `pluginProfiles`.
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
