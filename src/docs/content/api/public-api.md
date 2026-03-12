# Public API

Phantasy exposes a small public HTTP surface alongside the authenticated admin shell.

The source of truth for the mounted public routes is the server route layer in:

- `src/server/routes/health-routes.ts`
- `src/server/routes/public-api-routes.ts`

## Always-Public Endpoints

### Health

```bash
GET /health
```

Current response shape:

```json
{
  "status": "ok",
  "timestamp": "2026-03-12T12:00:00.000Z"
}
```

### Agent Metadata

```bash
GET /agent.json
GET /.well-known/agent.json
GET /api/agent
```

- `/agent.json` and `/.well-known/agent.json` return ERC-8004-style agent metadata.
- `/api/agent` returns a public summary of the active agent config for external consumers.

## Public Content API

These routes are available only when the website mode allows public content delivery:

- `GET /api/content/entries`
- `GET /api/content/entries/:slugOrId`
- `GET /api/content/tags`
- `GET /api/content/pages`
- `GET /api/content/pages/:slug`

Practical rule:

- `public`: embedded site + public content API
- `api-only`: public content API without runtime HTML site
- `private`: no public content API

See [Website Modes](/docs/website-mode).

## Integration API

Custom integrations live under `/api/integrations/*`.

Mounted routes:

- `POST /api/integrations/:integrationId/chat/completions`
- `POST /api/integrations/:integrationId/transcription`
- `POST /api/integrations/voice/generate`
- `POST /api/integrations/webhook`
- `GET /api/integrations/:integrationId/threads/messages`
- `GET /api/integrations/messages`

Important details:

- chat completions are the OpenAI-compatible public chat surface
- integration routes use custom integration auth, not admin-session auth
- the router also serves CORS preflight for `/api/integrations/*`

## Platform Webhooks

Phantasy also mounts:

```bash
POST /api/webhooks/fanvue
```

That route delegates to the active Fanvue adapter when the integration is enabled.

## What Is Not Public

These surfaces are not part of the public API contract:

- `/admin/api/*`
- `/admin/media/*`
- `/admin/avatars/*`
- `/admin/api/logs/stream`

Those require authenticated admin access.

## Related Docs

- [Admin API](/docs/api/admin-api)
- [Website Modes](/docs/website-mode)
- [Authentication & Hosting](/docs/guides/AUTHENTICATION_SETUP)
