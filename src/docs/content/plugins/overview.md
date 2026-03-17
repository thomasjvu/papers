# Plugin Overview

Phantasy uses a code-first plugin framework built around:

- `src/plugins/base-plugin.ts`
- `src/plugins/plugin-manager.ts`
- `src/plugins/manager/builtin-plugins.ts`
- `src/plugins/hook-bus.ts`

## Built-In Plugins

Built-ins are now capability-based rather than implicitly always-on.

- `coding`: coding tools and diagnostics
- `character`: companion identity, memory, voice, image, and presentation features
- `admin`: operational and browser automation surfaces

The generated inventory is the source of truth for exact descriptors and privilege flags: [Built-in plugins](../generated/plugins.md).

## Lifecycle

`PluginManager` is responsible for:

- registration
- manifest validation
- initialization
- config validation and persistence
- enable and disable state
- tool aggregation
- hook execution
- destruction and unload

## External Plugins

External plugins remain supported, but the install path is intentionally stricter than before:

- fetch package artifact
- stage and inspect manifest
- do not run lifecycle scripts during install
- explicitly enable after verification

That keeps remote install from becoming silent code execution.

## First-Party Installable Plugins

First-party installable plugins are moving toward standalone package repos.

- package-first plugins should have a real npm package
- the public Hub is its own repo and deployment, not a tab inside the main product repo
- the repo/package/source-of-truth policy is documented in [Plugin Repository Strategy](../architecture/plugin-repository-strategy.md)
- installable first-party plugins now export real source payloads into standalone repos, though some still need dependency-seam cleanup before the monorepo copy can disappear
- richer extracted plugins should prefer the stable `@phantasy/agent/plugin-runtime` and `@phantasy/agent/plugin-admin-ui` seams, but some extraction payloads still rely on temporary compatibility rewrites while cleanup continues
- the public Hub now tracks first-party plugins alongside themes, skills, workflows, and curated MCP presets, so installable extension discovery is no longer plugin-only
- the CLI now exposes a unified `phantasy extensions install|uninstall` surface so users can add or remove plugins, themes, skills, workflows, and MCP presets through one command family
- presets now materialize installable plugin bundles directly into agent config, so the default core stays lean while shapes such as vtuber, trader, or discord-mod can preinstall different extension sets
- the same modular pattern now applies to themes, first-party skills, and workflows, while curated upstream skills/MCP servers stay metadata-owned until Phantasy is the real source of truth

The current direction is:

- `@phantasy/agent` keeps the runtime loader and temporary extraction seams
- `phantasy-bot/hub` publishes the public install catalog
- `phantasy-bot/plugin-*` repos own installable plugin source over time
- `phantasy-bot/theme-*`, Phantasy-owned `skill-*`, and `workflow-*` repos now follow the same extraction policy for non-plugin extension types
- curated upstream skills and MCP presets stay in the flagship repo and Hub as install metadata instead of mirrored `@phantasy/*` repos
- `adventure`, `chronicle`, `romance-affection`, `versus`, and `web-search` now export real source payloads instead of blank scaffolds

## Capability Loading

The runtime resolves built-ins from selected capabilities in config or environment. If no capability is requested, the system defaults to `coding` plus `character`, while `admin` stays separate.

That means the repo can support coding agents, VTuber products, and production products without pretending they all belong in one trusted base runtime.

## Related Docs

- [Design Principles](../architecture/design-principles.md)
- [Runtime Packages](../architecture/runtime-packages.md)
- [Developing Plugins](./developing.md)
- [Marketplace](./marketplace.md)
- [Troubleshooting](./troubleshooting.md)
