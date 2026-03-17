# Introduction

Phantasy lets you build an AI companion/VTuber who can run her own site, content, automations, and business.

It is designed around one idea: the companion, the runtime, and the product surface should compose cleanly instead of being stitched together from separate systems.

```bash
npm install @phantasy/agent
```

## Five Workspaces

- `Character`: identity, memory, behavior, knowledge, avatar, and voice
- `Site`: website, themes, pages, media, and Chronicle publishing
- `Business`: channels, integrations, notifications, subscriptions, wallet/payments
- `Automations`: workflows, jobs, schedules, approvals, and browser-driven tasks
- `Operations`: providers, routing, monitoring, logs, auth, users, testing, developer tools

These are the top-level product workspaces. Plugins, themes, skills, workflows, and packages are how the system stays modular underneath that story, not how beginners are expected to think about the product.

## Shared Foundation

Phantasy ships as a headless runtime core with a batteries-included product layer on top.

Exact exports live in [Package Exports](/docs/generated/package-exports).

That split matters for trust. The unified runtime uses explicit `capabilities` plus `approvals` instead of implicit always-on privileged tools.

## Product Shapes

The main beginner stories are:

- `vtuber`
- `operator`
- `developer`

They all map to the same runtime and the same five workspaces. The difference is which part of the companion's business users notice first.

## What You Get

- Plugin system with code-first built-ins and external plugin support
- CLI runtime and Express server runtime
- Markdown-first memory with optional vector backends
- Provider routing across multiple model vendors
- Workflow engine for deterministic multi-step execution
- Built-in admin API, dashboard, and CMS surfaces for operating the companion business
- Live2D and VRM support for 2D/3D companion/VTuber presentation
- Website mode, headless publishing, and Chronicle content flows

## Trust Model

- Public routes use exact or prefix rules with HTTP method scoping
- Admin routes are protected by default
- Remote plugins are fetched into quarantine, not auto-installed with lifecycle scripts
- Published artifacts are allowlisted and tested so local workspace state does not leak into npm

## Recommended Starting Points

- [Use Cases](/docs/getting-started/use-cases)
- [Installation](/docs/getting-started/installation)
- [First Run](/docs/getting-started/first-run)
- [10-minute VTuber launch](/docs/guides/BUSINESS_AGENT_CMS_10_MINUTES)
- [CLI](/docs/cli)
- [Design Principles](/docs/architecture/design-principles)
- [Runtime Packages](/docs/architecture/runtime-packages)
- [Package Exports](/docs/generated/package-exports)
- [System Design](/docs/architecture/system-design)
