# System Design

Phantasy is organized as one product with three layers:

- `Trusted kernel`: config, provider contracts, memory/storage interfaces, workflow execution, plugin contracts, approvals, and shared orchestration
- `Product surfaces`: Character, Site, Business, Automations, and Operations across CLI, TUI, admin UI, admin API, and server delivery
- `Extension surfaces`: plugins, themes, skills, workflows, and publishable package wrappers

## Runtime Entry Points

Two runtime entry points share the same kernel:

- CLI runtime in `src/cli/runtime/`
- server runtime in `src/server/`

Both sit on top of the same config loader, provider routing layer, plugin manager, memory system, workflow engine, and MCP integration.

```text
CLI Runtime / Express Server
        |
        v
   Trusted Kernel
        |
        +-- Config + Approvals
        +-- Provider Routing
        +-- Memory Layer
        +-- Workflow Engine
        +-- Plugin Manager + Hook Bus
        +-- MCP Integration
        |
        v
  Product + Extension Surfaces
```

## Layer Boundaries

### Trusted Kernel

The kernel keeps only contracts and orchestration that every runtime path needs:

- config loading
- plugin contracts and lifecycle wiring
- provider routing interfaces
- memory interfaces
- workflow execution
- approvals and runtime guardrails

Privileged tools and server surfaces are layered on top as explicit capabilities instead of being silently bundled into the base runtime.

### Product Surfaces

Product surfaces adapt the kernel into the five workspaces:

- `Character`: identity, memory, voice, and companion presentation
- `Site`: themes, pages, media, and publishing
- `Business`: channels, integrations, notifications, and monetization
- `Automations`: workflows, approvals, jobs, and schedules
- `Operations`: providers, auth, monitoring, logs, testing, and developer controls

The taxonomy definitions that enforce those workspace boundaries live in `src/product/taxonomy.ts` and `src/product/taxonomy-validation.ts`.

### Extension Surfaces

Extension surfaces stay separate from the kernel so they can evolve and publish independently:

- `src/plugins/`
- `themes/`
- `skills/`
- `workflows/`
- `packages/`

## Repo Boundaries

- `src/agent-core/`: public headless runtime surface
- `src/providers/`: public provider surface
- `src/cli/`: public CLI surface
- `src/tui/`: public terminal UI surface
- `src/admin-web-ui/`: public admin CMS frontend surface
- `src/server-admin/`: public server/admin surface
- `src/admin-ui/`: dashboard app boundary, not part of the trusted runtime core
- `src/admin-api/`: admin API routes and route registry
- `src/services/`: business logic and integration services
- `src/memory/`: memory providers and interfaces

## Operational Design Choices

### Capability-Based Loading

Built-in plugins are selected by capability. The headless runtime defaults to `coding` plus `character`; `admin` stays separate unless explicitly requested or added by the server surface.

### Personality Is Orthogonal To Capability

Persona does not define tool surface. A runtime can compose `coding`, `character`, and `admin` without tying capability selection to one outward persona.

### Compiled Admin Routing

The admin API uses a compiled route registry instead of probing handlers linearly on every request. That keeps dispatch smaller, easier to audit, and less allocation-heavy.

### Staged Plugin Installation

Remote plugins are fetched into a staged state and must be explicitly enabled after verification. Lifecycle scripts and auto-build steps are not run during staging.

### Search That Avoids Whole-Store Scans

- markdown memory maintains an on-disk index
- vector memory backends push filtering and ranking work down into PostgreSQL
- query text is pushed down into memory backends where possible

## Source Of Truth

When architectural docs and generated inventories disagree, prefer the generated inventories and the public package surfaces in `src/agent-core/`, `src/providers/`, `src/cli/`, `src/tui/`, `src/admin-web-ui/`, and `src/server-admin/`.

See also: [Design Principles](./design-principles.md)
