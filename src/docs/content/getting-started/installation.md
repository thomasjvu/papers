# Installation

Phantasy is Bun-first in the repo and npm-friendly when you install the published package.

## Default Install

This is the shortest path and the one the docs are tuned for:

```bash
npm install @phantasy/agent
npx phantasy create business-cms my-brand
npx phantasy start --config config/agents/my-brand.json
```

That gives you the flagship product shape: companion, site, business, automations, and operations in one runtime.

If the CLI is already on your `PATH`, you can drop `npx`.

## Repo Install

If you are working from source instead of the published package:

```bash
git clone https://github.com/phantasy-bot/agent.git
cd agent
bun install
cp .env.example .env
./start.sh
```

Default local access:

- Server/API: `http://localhost:2000`
- Admin UI dev server: `http://localhost:5173`
- Embedded admin route: `http://localhost:2000/admin`

## Which Shape To Pick

- `business-cms`: default, public-facing companion business
- `operator`: same foundation, more operationally foregrounded
- `creator`: same foundation, publishing/media foregrounded

If you are evaluating the product, do not start with the developer-only shape. It is useful, but it is not the best first impression.

## Useful Repo Commands

```bash
bun run dev
bun run dev:server
bun run dev:ui
bun run test
bun run typecheck
bun run build
```

## Release Checks

```bash
bun run typecheck
bun run test
bun run validate:standards
bun run docs:check
bun run build
npm pack --dry-run
```

## Next

- [First Run](/docs/getting-started/first-run)
- [Local Development](/docs/getting-started/local-development)
- [Configuration](/docs/getting-started/configuration)
