# Plugin Overview

Phantasy uses a code-first plugin framework built around:

- `src/plugins/base-plugin.ts`
- `src/plugins/plugin-manager.ts`
- `src/plugins/manager/builtin-plugins.ts`
- `src/plugins/hook-bus.ts`

## Built-In Plugins

Built-ins are now profile-based rather than implicitly always-on.

- `core-runtime`: no built-ins by default
- `coder`: coding tools and diagnostics
- `character`: companion identity, memory, voice, image, and presentation features
- `server-admin`: operational and browser automation surfaces

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

## Profile Loading

The runtime resolves built-ins from selected profiles in config or environment. If no profile is requested, the system falls back to `core-runtime`.

That means the repo can support coding agents, companion businesses, and production products without pretending they all belong in one trusted base runtime.

## Related Docs

- [Design Principles](../architecture/design-principles.md)
- [Runtime Packages](../architecture/runtime-packages.md)
- [Developing Plugins](./developing.md)
- [Integration Model](../integrations/integrations-guide.md)
- [Generated Built-in Plugin Inventory](../generated/plugins.md)
