# First Run

This is the quickest honest demo of Phantasy.

## Start The Flagship Shape

```bash
npm install @phantasy/agent
npx phantasy create business-cms my-brand
npx phantasy start --config config/agents/my-brand.json
```

Repo checkout path:

```bash
bun install
cp .env.example .env
./start.sh
```

## Check The Main Surface

1. Open `http://localhost:5173` in local dev or `http://localhost:2000/admin` in the server build.
2. Confirm the five workspaces are visible: Character, Site, Business, Automations, Operations.
3. In `Website`, set the mode to `public`.
4. In `Character`, give the companion a name, voice, or avatar.
5. In `Content`, publish a Chronicle entry.
6. Confirm the public site or `/blog` reflects that same runtime.

## Quick Server Smoke Test

Health:

```bash
curl http://localhost:2000/health
```

Expected shape:

```json
{
  "status": "ok",
  "timestamp": "2026-03-12T12:00:00.000Z"
}
```

Public agent summary:

```bash
curl http://localhost:2000/api/agent
```

## What The Admin UI Is For

The admin shell is where you operate the companion, not where you escape the product story.

Use it for:

- config editing
- publishing
- media and avatar setup
- workflow and notification handling
- monitoring and diagnostics

For avatar assets, the common paths are:

- `/public/vrm/...` for direct VRM files
- `/public/live2d/...` for direct Live2D entry files
- `/admin/avatars/<agentId>` for PNGTuber frame packs
- Media workspace uploads when you want storage-backed URLs

## When To Drop To Profiles

Once the flagship path feels clear, you can narrow capability on purpose:

```json
{ "pluginProfiles": ["coder"] }
```

```json
{ "pluginProfiles": ["coder", "character"] }
```

If `pluginProfiles` is omitted, the runtime stays on `["core-runtime"]`.

## Operational Checks

- logs: `bun run dev` locally, stdout in production
- protected status endpoints: `/admin/api/status/health` and `/admin/api/status/health/detailed`
- detailed route inventory: [Generated Admin API Route Inventory](/docs/generated/api-routes)

## Next

- [10 Minute Launch](/docs/guides/BUSINESS_AGENT_CMS_10_MINUTES)
- [Configuration](/docs/getting-started/configuration)
- [Runtime Packages](/docs/architecture/runtime-packages)
- [Deployment](/docs/guides/DEPLOY)
