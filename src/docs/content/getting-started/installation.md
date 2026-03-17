# Installation

Phantasy is Bun-first for local development and npm-compatible for published package installs.

## Default Install

Most teams should start with the full framework and the flagship `vtuber` shape: an AI companion/VTuber who runs her own site, content, automations, and business.

```bash
npm install @phantasy/agent
npx phantasy create vtuber my-brand
npx phantasy start --config config/agents/my-brand.json
```

That gives you the full product story:

- `Character`
- `Site`
- `Business`
- `Automations`
- `Operations`

If the CLI is already on your `PATH`, you can drop the `npx` prefix. For published-package onboarding, keep it.

If you are unsure which preset to choose, choose `vtuber`. That is the path the docs, demo flow, and release story are optimized around.

## Local Repo Development

Use Node.js 22.12+ LTS for repo tooling. The repo now ships `.nvmrc` and `.node-version` so `nvm use` and similar tools land on the expected major automatically.

```bash
git clone https://github.com/phantasy-bot/agent.git
cd agent
bun install
bun run dev:up
```

Default local access:

- Server/API: `http://localhost:2000`
- Admin UI dev server: `http://localhost:5173`

If `.env` does not exist yet, `bun run dev:up` copies `.env.development`, starts the local PostgreSQL container, and boots the dev stack. The local-only login is `admin` / `phantasy-dev-password`.

The repo checkout should still feel like the flagship product. By default, the admin shell leads with the five workspaces plus notifications, not local-developer tooling.

## Advanced Local Developer Runtime

Use the developer shape only when you intentionally want repo-oriented surfaces such as `Workbench`, `Developer`, and `Test` inside the admin shell.

```bash
npx phantasy create developer local-coder
npx phantasy chat --config config/agents/local-coder.json
```

If you are evaluating Phantasy as an open source product, do not start here. This is the sharp-tools path for trusted local environments.

## Product Shapes

- `vtuber`: companion/VTuber + site + publishing + connected apps + operations
- `operator`: same companion foundation with operational capabilities layered in
- `developer`: trusted-local coding/runtime surface with workbench tooling

## Advanced Runtime Composition

Smaller package surfaces still exist for trust boundaries and specialized deployments, but they are now documented as advanced composition in [Runtime Packages](/docs/architecture/runtime-packages).

## Useful Commands

```bash
bun run dev
bun run dev:server
bun run dev:ui
bun run typecheck
bun run test
bun run build
```

## Release Checks

```bash
bun run lint
bun run stylelint
bun run typecheck
bun run test
bun run validate:standards
bun run docs:check
bun run build
npm pack --dry-run --cache /tmp/phantasy-npm-cache
```

## Next

- [Use Cases](/docs/getting-started/use-cases)
- [CLI](/docs/cli)
- [Design Principles](/docs/architecture/design-principles)
- [Runtime Packages](/docs/architecture/runtime-packages)
- [Configuration](/docs/getting-started/configuration)
- [First Run](/docs/getting-started/first-run)
