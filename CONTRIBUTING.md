# Contributing

Thanks for helping improve papers. The project is a static documentation
framework, so changes should preserve clean route URLs, deterministic build
artifacts, safe Markdown/MDX handling, and CDN-friendly output.

## Development setup

Use Node.js 24 or newer and npm:

```bash
npm ci
npm run dev
```

Read [AGENTS.md](AGENTS.md) before changing source or generated artifacts. It
defines ownership, route/security boundaries, deployment credentials, and the
verification ladder.

## Source boundaries

- Author content in `src/docs/content/`.
- Change navigation and instance configuration in `shared/`.
- Change framework behavior in `src/` and `scripts/`.
- Regenerate `public/` and other derived files with the documented commands.
- Do not commit local `.env` files, credentials, build output, or plan-index
  edits unless the maintainer explicitly requests them.

For themes, follow [CONTRIBUTING_THEMES.md](CONTRIBUTING_THEMES.md).

## Verification

Before opening a pull request, run the checks relevant to the change. For a
framework or release change, run the complete local gate:

```bash
npm test
npm run lint
npm run format:check
npm run type-check
npm run docs:check
npm run check:docs-tree
npm run check:security-policy
npm run check:assets
npm run check:runtime-audit
npm run build
npm run release:check
npm run create:smoke
npx playwright test
npm run lighthouse:check
```

The `create-papers` package is a public API. Template-affecting changes must
keep its packed tarball, manifest, fixture smoke test, supported Node range,
and changelog entry aligned.

## Pull requests

Describe the user-facing behavior, files changed, generated artifacts updated,
verification commands and outcomes, and any remaining deployment or registry
blocker. Include screenshots for visual/theme changes and direct route paths
for docs changes. Keep unrelated refactors out of a focused pull request.

Please do not include exploit details in a public issue. Follow
[SECURITY.md](SECURITY.md) for private reports.
