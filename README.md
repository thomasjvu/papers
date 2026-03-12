# Phantasy Docs

This repo is the Phantasy documentation site, built on the `papers` docs framework.

It documents the flagship `@phantasy/agent` product story and keeps generated inventories alongside narrative docs so documentation drift is easier to spot.

## Start Here

- Product overview: `/docs/getting-started/introduction`
- Install path: `/docs/getting-started/installation`
- Smoke test path: `/docs/getting-started/first-run`
- Product taxonomy: `/docs/workspaces`

## Local Workflow

```bash
npm install
npm run dev
```

If `npm run dev` is already running and you changed Markdown or the docs tree, rerun:

```bash
npm run generate:docs
npm run generate:seo
```

## Main Files

- `shared/documentation-config.js`: homepage copy and navigation tree
- `src/docs/content/`: Markdown source
- `.env.local`: site metadata and GitHub links
- `src/globals.css`: theme and typography tokens

## Verification

```bash
npm test
npm run lint
npm run build
npm run release:check
```

## Build Output

`npm run build` regenerates:

- `public/docs-index.json`
- `public/docs-content/**/*.json`
- `public/robots.txt`
- `public/sitemap.xml`
- `public/images/og-image.svg`
- `public/images/twitter-card.svg`
- `public/llms.txt`
- `public/llms-full.txt`
- route-specific HTML files in `dist/`
- the Pagefind index in `dist/pagefind/`

## License

MIT. See [LICENSE](LICENSE).
