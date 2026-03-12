# Workspaces

Every first-party Phantasy feature belongs to one primary workspace.

This is the product taxonomy the repo uses for admin tabs, route metadata, manifests, presets, and documentation. The source of truth lives in `src/product/taxonomy.ts`.

## The Five Workspaces

| Workspace     | What it owns                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| `Character`   | identity, avatar, voice, memory, companion behavior, knowledge                   |
| `Site`        | website, themes, pages, media, Chronicle publishing, public delivery             |
| `Business`    | channels, integrations, notifications, offerings, subscriptions, wallet/payments |
| `Automations` | workflows, jobs, approvals, schedules, heartbeat-driven activity                 |
| `Operations`  | providers, routing, monitoring, logs, testing, auth, users, developer tools      |

`Notifications` exists in the admin shell as an inbox/launcher surface. It is not a sixth architecture domain.

## Current Admin Surface By Workspace

The shared admin tab registry is the quickest inventory check:

- `Character`: Companion, Skills, Games
- `Site`: Website, Content, Media, Themes, Video Studio, Creator Studio
- `Business`: Integrations, Notifications
- `Automations`: Automations, Browser Use
- `Operations`: Dashboard, Status, Providers, Developer, Workbench, Monitoring, Plugins, Users, Admin, Logs, Test

For the exact tab catalog, use [Generated Admin Tab Inventory](/docs/generated/admin-tabs).

## Placement Rules

When adding or documenting a feature, decide three things first:

1. Which workspace owns the feature?
2. Is it trusted-kernel logic, product-surface logic, or extension logic?
3. Which transport is adapting it: admin UI, admin API, CLI, website, or runtime?

Preferred shape:

- domain first
- transport second
- extension metadata explicit

That is why Phantasy treats `themes`, `skills`, `plugins`, and `workflows` as extension surfaces, not top-level product domains.

## Extension Mapping

- `themes` default to `Site` and `presentation`
- `skills` usually belong to `Character` or `Automations`
- `plugins` can land in any workspace, but first-party built-ins are grouped by profile
- `workflows` belong to `Automations`

## Why This Matters

The workspace model is not just UI labeling. It drives:

- admin tab ownership
- admin API route metadata
- preset/product-shape framing
- extension manifest validation
- documentation placement

If a feature cannot be assigned cleanly, the design is usually still too muddy.

## Related Docs

- [Use Cases](/docs/getting-started/use-cases)
- [Generated Admin Tab Inventory](/docs/generated/admin-tabs)
- [Generated Admin API Route Inventory](/docs/generated/api-routes)
- [Design Principles](/docs/architecture/design-principles)
