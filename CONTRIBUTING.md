# Contributing to Papers

Papers is a static documentation framework (React, Vite, Pagefind, OpenAPI, `llms.txt`).
Alkahest maintains this repo and dogfoods it through `alkahest/apps/docs` and
`alkahest/apps/dev-docs`.

## Where to change what

| Layer | Location in Papers | In Alkahest monorepo |
| --- | --- | --- |
| Framework UI/runtime | `src/`, `scripts/`, `themes/` | Synced from `vendor/papers` |
| Site navigation/homepage | `shared/documentation-config.js` | Per-app overlay (not synced) |
| Markdown content | `src/docs/content/` | Per-app overlay (not synced) |
| Themes | `themes/` | Synced; upstream new themes here |

## Dogfood workflow (Alkahest)

1. Reproduce or fix in `vendor/papers` (or export from `apps/docs` via `pnpm run papers:export` in the monorepo).
2. Open a PR on `github.com/thomasjvu/papers`.
3. After merge, bump the submodule and run `pnpm run papers:pull` in Alkahest.

Do not land framework fixes only under `apps/docs/src` — the next sync will overwrite them unless exported upstream.

## Local development

```bash
npm install
npm run dev
npm run check:docs-tree
npm test
npm run build
npm run release:check
```

## Themes

See [CONTRIBUTING_THEMES.md](./CONTRIBUTING_THEMES.md) for theme packaging and registry updates.

## Releases

See [RELEASING.md](./RELEASING.md).