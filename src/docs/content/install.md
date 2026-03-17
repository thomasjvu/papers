# Installation

Phantasy lets you build an AI companion/VTuber who can run her own site, content, automations, and business.

## System Requirements

- **Bun** 1.3.0+
- **Node.js** 22.12.0+ LTS
- **PostgreSQL** 14+ for persistent server data
- **Git**

### Optional Services

- **Redis** for cache-heavy deployments
- **pgvector** when you want vector memory
- **Docker** for local Postgres or full containerized runs

## Default Install

Most teams should start with the full framework and the flagship `vtuber` shape:

```bash
npm install @phantasy/agent
npx phantasy create vtuber my-brand
npx phantasy start --config config/agents/my-brand.json
```

That install supports the full five-workspace product story around the companion:

- `Character`
- `Site`
- `Business`
- `Automations`
- `Operations`

## From Source

```bash
git clone https://github.com/phantasy-bot/agent.git
cd agent
bun install
bun run build
```

The published CLI entrypoint uses `#!/usr/bin/env bun`, so Bun still needs to be installed even when the package is installed with npm.

If the CLI is already on your `PATH`, you can drop the `npx` prefix.

Advanced package surfaces are listed in [generated/package-exports.md](./generated/package-exports.md) and explained in [architecture/runtime-packages.md](./architecture/runtime-packages.md).

## Quick Start

### 1. Configure environment

```bash
bun run setup:env
```

Minimum useful configuration:

```env
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...

DATABASE_URL=postgresql://user:pass@localhost:5432/phantasy
AUTH_ADMIN_PASSWORD_HASH=$2b$10$...
AUTH_JWT_SECRET=replace-with-a-32+-character-secret
AUTH_SESSION_SECRET=replace-with-a-second-32+-character-secret
PHANTASY_SECRET_ENCRYPTION_KEY=replace-with-a-stable-secret
```

### 2. Start local development

Fastest path on macOS/Linux:

```bash
bun run dev:up
```

That creates `.env` from `.env.development` when needed, ensures the local Postgres container exists, and then starts the Bun development stack.

Manual split:

```bash
bun run dev:infra
bun run dev
```

Or fully containerized:

```bash
docker compose -f docker-compose.local.yml up -d
```

### 3. Access the app

- **Server/API:** `http://localhost:2000`
- **Admin UI in dev:** `http://localhost:5173`
- **Admin UI via server build:** `http://localhost:2000/admin`

At that point you already have the built-in CMS shell. The next step is configuring the Character, Site, Business, Automations, and Operations workspaces around the same companion runtime.

## Character Runtime Setup

If you want Live2D support for the companion/VTuber, vendor the pinned runtime stack locally:

```bash
bun run setup:live2d
```

That vendors the pinned Cubism Core, PIXI 6.5.2, and `pixi-live2d-display` assets used by the current Live2D integration. See [LIVE2D setup](./guides/LIVE2D_SETUP.md) for details.

## Verify the Install

```bash
npx phantasy help
bun run typecheck
bun run lint
bun run validate:standards
bun run stylelint
bun run docs:check
```

## Troubleshooting

### Database connection failed

```bash
bun run dev:infra
```

Or start PostgreSQL with your system service manager.

### Live2D model does not render

```bash
bun run setup:live2d
```

Then reload the admin UI and confirm the model URL points to a reachable `.model3.json`.

### Dependency drift or stale generated docs

```bash
bun install
bun run docs:generate
bun run docs:check
```

## Next Steps

- [Configuration](./configuration.md)
- [CLI Reference](./cli.md)
- [10-minute VTuber launch](./guides/BUSINESS_AGENT_CMS_10_MINUTES.md)
- [Website Mode](./website-mode.md)
- [Chronicle](./features/chronicle.md)
