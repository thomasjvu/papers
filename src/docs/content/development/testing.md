# Testing

Phantasy uses a layered release gate. Run the smallest useful check first, then escalate to the full release gate when the surface is broad.

## Fast Checks

```bash
bun run test:core
bun run test:ui:components
bun run typecheck
bun run validate:standards
bun run docs:check
```

## Flagship Smoke

```bash
bun run test:browser:smoke
```

This Puppeteer flow verifies the flagship admin path against a real booted server:

- login
- dashboard
- companion
- website
- notifications

Run it against a clean PostgreSQL database. In CI, the workflow migrates `test_db` first; locally, set `PHANTASY_BROWSER_SMOKE_DATABASE_URL` if your default dev database contains stale encrypted provider secrets.

## Release Gate

```bash
bun run build
npm pack --dry-run --json --ignore-scripts --cache /tmp/phantasy-npm-cache
```

## Frameworks

- Vitest for unit and integration coverage
- Puppeteer for the flagship browser smoke flow
