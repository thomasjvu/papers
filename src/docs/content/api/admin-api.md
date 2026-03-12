# Admin API

The admin surface is mounted under `/admin/api/*` and is protected by the same auth system as the admin UI.

The route inventory is generated from the mounted handlers and route registry, so the fastest drift check is:

- [Generated Admin API Route Inventory](/docs/generated/api-routes)

## Auth Model

Admin routes are protected by default.

Typical access paths:

- browser session cookie from `/auth/login`
- bearer token issued after admin authentication

Operationally relevant protections also cover:

- `/admin/media/*`
- `/admin/avatars/*`
- `/admin/api/logs/stream`

## Route Shape

Phantasy uses two admin route paths:

1. a compiled admin route registry for most route modules
2. a small number of explicit Express mounts for native monitoring or static/admin concerns

The current mounted groups span all five workspaces:

- `Character`: agent config, notes, memory, knowledge, character-card
- `Site`: content, themes, website, media, video
- `Business`: integrations, notifications, wallet, financial, ACP
- `Automations`: workflow and browser-use surfaces currently land through tabs/plugins rather than a large standalone admin route group
- `Operations`: providers, setup, validation, monitoring, status, plugins, users

## Health And Observability

Useful admin endpoints include:

- `GET /admin/api/status/health`
- `GET /admin/api/status/health/detailed`
- `GET /admin/api/monitoring/*` for realtime monitoring routes

Admin log streaming uses a WebSocket upgrade on:

```bash
GET /admin/api/logs/stream
```

That stream is admin-only and currently exists for log streaming rather than as a general-purpose event bus.

## Tab And Route Inventories

Use these generated pages together:

- [Generated Admin Tab Inventory](/docs/generated/admin-tabs)
- [Generated Admin API Route Inventory](/docs/generated/api-routes)

Tabs describe what operators can navigate to. Route inventory describes what is actually mounted.

## Related Docs

- [Public API](/docs/api/public-api)
- [Authentication & Hosting](/docs/guides/AUTHENTICATION_SETUP)
- [Workspaces](/docs/workspaces)
