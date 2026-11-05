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

- Author content in `src/docs/content/` as regular files. The build fails on
  symlinks in a content folder and on a content folder that resolves outside
  the repository, so a link cannot publish a file from the build machine.
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
npm run release:check:papers   # release:check plus the starter package check
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

## Verification tooling

Use Node 24 or newer. `npm test` transpiles test imports with the existing
TypeScript dependency and Node synchronous module hooks. The historical
`test/register-ts-node.mjs` command path remains compatible; ts-node is no longer
required. Type checking is still a separate required gate.

With npm install-script policy enabled, `npm ci` uses the committed,
version-pinned approvals for esbuild
and vue-demi. Optional fsevents native build scripts are denied; its shipped
binary or the file watcher's fallback is used. Review changed scripts before
updating these approvals. Do not approve every dependency's install scripts.

The dependency overrides keep KaTeX on the supported direct version and select
patched minimatch/glob releases for tooling that has not updated its ranges.
Verify lint, coverage, the mutation runner's dry run, and the browser suite when
changing those overrides. `npm run release:check:papers` requires a clean full
dependency audit; consumer release checks retain their runtime audit.

The Vite build step has a 4 GiB heap ceiling for the optional API viewer's module
graph. This avoids repeated garbage collection near Node's default heap limit;
it does not reserve that memory or change the browser bundle budget. The build
helper resolves Vite normally so workspace-hoisted installations also work.

Production JavaScript chunks have a hard 600 kB budget. The single generated
Mermaid parser module has an explicit 700 kB budget because it cannot be split at
module boundaries. Violations fail the build. `dist/bundle-budget.json` records
each emitted chunk's measured bytes and limit. Keep the API viewer and its CSS
behind the interactive-viewer action; do not make them initial-shell imports.

The adjacent-page footer stays hidden while the initial Markdown skeleton is
present. Keep it in normal flow once content is ready; showing it at the
skeleton's temporary height creates a large layout shift when the article grows.
