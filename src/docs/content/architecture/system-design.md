# System Design

Phantasy has two runtime entrypoints that share one core:

- CLI runtime in `src/cli/runtime/`
- server runtime in `src/server/`

Both sit on top of the same config loader, provider routing layer, plugin manager, memory system, and workflow engine.

## High-Level Shape

```text
CLI Runtime / Express Server
        |
        v
  Core Runtime Surface
        |
        +-- Plugin Manager + Hook Bus
        +-- Provider Routing
        +-- Memory Layer
        +-- Workflow Engine
        +-- MCP Integration
```

## Key Design Choices

### Minimal Trusted Core

The base runtime keeps only contracts and orchestration that every agent needs:

- config loading
- plugin contracts
- hook execution
- memory interfaces
- workflow execution
- provider routing interfaces

Privileged tools and server surfaces are layered on as profiles.

### Profile-Based Capability Loading

Built-in plugins are selected by profile. The default profile is `core-runtime`, which means privileged built-ins are not loaded unless explicitly requested.

### Personality Is Orthogonal To Capability

Persona does not define tool surface.

An agent can be both a coding agent and a companion by composing `coder` and `character`. That lets products share one runtime while varying the outward identity and capability mix.

### Compiled Admin Routing

The admin API uses a compiled route registry instead of probing handlers linearly on every request. That makes the dispatch path smaller, easier to audit, and less allocation-heavy.

### Staged Plugin Installation

Remote plugins are fetched into a staged state and must be explicitly enabled after verification. Lifecycle scripts and auto-build steps are not run during staging.

### Search That Avoids Whole-Store Scans

- markdown memory maintains an on-disk index
- sqlite memory filters candidates in SQL before scoring
- query text is pushed down into memory backends where possible

## Repo Boundaries

- `src/core-runtime/`: public core-runtime surface
- `src/profile-coder/`: public coding profile surface
- `src/profile-character/`: public character/media profile surface
- `src/server-admin/`: public server/admin surface
- `src/admin-ui/`: dashboard app boundary, not part of the trusted runtime core
- `src/plugins/`: plugin framework and built-ins
- `src/admin-api/`: admin API routes and route registry
- `src/memory/`: memory providers and interfaces
- `src/services/`: business logic and integration services

## Admin UI Boundary

The admin UI is part of the product surface, not the runtime trust boundary.

That matters for both engineering and marketing:

- it keeps the runtime story smaller
- it lets the dashboard evolve without redefining the core
- it makes it clearer which code is framework infrastructure and which code is application UI

## Source Of Truth

When architectural docs and generated inventories disagree, prefer the generated inventories and the public package surfaces in `src/core-runtime/`, `src/profile-coder/`, `src/profile-character/`, and `src/server-admin/`.

See also: [Design Principles](./design-principles.md)
