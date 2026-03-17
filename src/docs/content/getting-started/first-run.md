# First Run

This guide gets you from zero to a running Phantasy companion/VTuber product with the current flagship story intact.

## Default Path: `vtuber`

If you are evaluating Phantasy for the first time, do not start with raw profile composition. Start with the flagship runtime shape:

```bash
npm install @phantasy/agent
npx phantasy create vtuber my-brand
npx phantasy start --config config/agents/my-brand.json
```

That gives you the opinionated product surface Phantasy is best at:

- a companion/VTuber identity
- a built-in site and publishing stack around her
- business channels and notifications
- workflows and automations
- operational controls in the same runtime

If the CLI is already on your `PATH`, you can drop the `npx` prefix.

## Source Checkout Path

If you are working from the repo instead of the published package:

```bash
bun install
bun run dev:up
```

This starts:

- **Server** at `http://localhost:2000` (API + Admin UI)
- **Vite dev server** at `http://localhost:5173` (proxies API to port 2000)

If `.env` does not exist yet, the command copies `.env.development`, ensures the local PostgreSQL container is running, and uses the local-only login `admin` / `phantasy-dev-password`.

## Verify The Main Surface

After boot:

1. Open `http://localhost:5173` during local dev or `http://localhost:2000/admin` for the server build.
2. Confirm the five workspaces are visible: Character, Site, Business, Automations, Operations.
3. In `Website`, set the site mode to `public`.
4. In `Character`, configure the companion's identity or appearance.
5. In `Content`, publish a Chronicle entry.
6. Confirm `/blog` renders from the same runtime.

## Verify The Server

### Health check

```bash
curl http://localhost:2000/health
```

Expected response:

```json
{
  "status": "healthy",
  "version": "2.0.0",
  "uptime": 123.45
}
```

### Chat API smoke test

```bash
curl -X POST http://localhost:2000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "List the active runtime capabilities.",
    "userId": "test-user"
  }'
```

## Use The Admin UI

Navigate to `http://localhost:5173` during local dev.

The admin UI is for:

- operational visibility
- config editing
- plugin enable/disable flows
- external plugin staging and review

For avatar assets, the CMS path is now straightforward:

- upload files in the `Media` workspace to local storage, R2, or S3 and use the returned URL
- use uploaded media URLs or small project-local `/public/vrm/...` and `/public/live2d/...` paths for direct model files; avoid checking large model packs into git
- use `/admin/avatars/<agentId>` or a media/CDN pack root for PNGTuber frame packs
- or import a local PNGTuber folder directly from Appearance and let Phantasy upload it into the default media provider with inferred outfits and expressions
- choose **Makise Kurisu Starter** in onboarding if you want to feel a real PNGTuber companion immediately; Phantasy will copy the bundled Kurisu pack into `./.phantasy/pngtuber/<your-agent-id>/` and wire the config for you

It is part of the same runtime family, not a separate product bolted onto the companion.

## Advanced: Compose Capabilities Directly

Once the flagship path makes sense, drop down to explicit capability composition when you need a narrower trust boundary.

Coding agent:

```json
{
  "capabilities": { "coding": true, "character": false, "admin": false }
}
```

In-character coding companion:

```json
{
  "capabilities": { "coding": true, "character": true, "admin": false }
}
```

If you do not set `capabilities`, the runtime defaults to `coding` plus `character`.

CLI-only flow:

```bash
npx phantasy chat --config config/agents/my-brand.json
```

## Monitoring

### Logs

View real-time logs:

```bash
# Development mode shows logs automatically
bun run dev

# Production: logs go to stdout
bun run start 2>&1 | tee agent.log
```

### Metrics

Access metrics at:

- `http://localhost:2000/metrics` - Prometheus format
- `http://localhost:2000/health` - Health status

## Troubleshooting

### Common Issues

**"Cannot connect to database"**

```bash
# Ensure PostgreSQL is running
bun run db:migrate
```

**"No AI provider configured"**

- Check that at least one API key is set in `.env`
- Verify the key is valid by testing with curl

**"Plugin initialization failed"**

- Check logs for specific error messages
- Ensure required environment variables are set
- Verify plugin configuration is valid

### Debug Mode

Enable verbose logging:

```bash
DEBUG=phantasy:* bun run dev
```

## Next Steps

- [Build An AI VTuber In 10 Minutes](/docs/guides/BUSINESS_AGENT_CMS_10_MINUTES)
- [Open Source FAQ](/docs/guides/OPEN_SOURCE_FAQ)
- [CLI](/docs/cli) for the coder-first interaction path
- [Configuration](/docs/getting-started/configuration) for capability selection, approvals, and model routing
- [Runtime Packages](/docs/architecture/runtime-packages) for the public package surfaces
- [Architecture Overview](/docs/architecture/system-design) - Understand the system design
- [Plugin Development](/docs/plugins/developing) - Create custom plugins
- [Deployment Guide](/docs/deployment/environment) - Deploy to production
