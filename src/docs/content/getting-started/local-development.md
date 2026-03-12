# Local Development

Phantasy is Bun-first in the main product repo and ships two common local paths: a fast repo loop and a production-like Docker loop.

## Fast Path

From the root of `@phantasy/agent`:

```bash
bun install
cp .env.example .env
./start.sh
```

`./start.sh` handles the expected local PostgreSQL container and then starts `bun run dev`.

Useful variants:

```bash
./start.sh postgres
./start.sh dev
./start.sh stop
./start.sh restart
```

## Manual Dev Commands

If you want finer control over the server and UI processes:

```bash
bun run dev
bun run dev:server
bun run dev:ui
```

The main scripts live in the root `package.json`:

- `bun run dev`: server plus Vite admin UI
- `bun run dev:server`: Express server only
- `bun run dev:ui`: Vite admin UI only
- `bun run build`: admin UI + server production build

## Production-Like Local Docker

Use Docker when you want the container path the product documents for self-hosting:

```bash
docker compose -f docker-compose.local.yml up -d
docker compose -f docker-compose.local.yml down
```

## Default Access Points

- Server/API: `http://localhost:2000`
- Admin UI Vite dev server: `http://localhost:5173`
- Embedded admin route: `http://localhost:2000/admin`

## Focused Verification

Prefer targeted checks before broad suites:

```bash
bun run test:core -- src/path/to/test.ts
bun run test:ui:components -- src/admin-ui/path/to/test.tsx
bun run validate:standards
bun run docs:check
```

Run the broader set when the change surface is wide:

```bash
bun run test
bun run typecheck
bun run build
```

## Related Docs

- [Installation](/docs/getting-started/installation)
- [First Run](/docs/getting-started/first-run)
- [Configuration](/docs/getting-started/configuration)
- [Deployment](/docs/guides/DEPLOY)
