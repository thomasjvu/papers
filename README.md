# papers

`papers` is a static documentation starter built with React, Vite, TypeScript, generated Markdown content, Pagefind search, `llms.txt` exports, and SEO-friendly static route metadata.

If you are evaluating the template, start in the app at `/docs/getting-started/introduction`.
If you are adopting it for your own project, this is the shortest path:

```bash
git clone git@github.com:thomasjvu/papers.git
cd papers
npm install
npm run dev
```

The dev server runs at `http://localhost:3333`.

## Start Here

- Product overview: `/docs/getting-started/introduction`
- Setup path: `/docs/getting-started/quick-start`
- Environment and validation: `/docs/getting-started/installation`
- Deployment checklist: `/docs/deployment/production-setup`

## Writer And Developer Workflow

1. Update `shared/documentation-config.js` if the docs tree or homepage copy needs to change.
2. Edit Markdown in `src/docs/content/`.
3. If `npm run dev` is already running, rerun `npm run generate:docs` after docs-tree or Markdown changes.
4. Rerun `npm run generate:seo` after changing `VITE_SITE_URL`, homepage messaging, or page descriptions. The generator follows Vite env resolution, so `.env`, `.env.local`, `.env.production`, and host build env variables are all supported.
5. Run `npm run generate:llms` if you want fresh AI exports without a full build.
6. Run `npm test`, `npm run lint`, `npm run build`, and `npm run release:check` before shipping.

## Core Commands

```bash
npm run dev
npm run generate:docs
npm run generate:seo
npm run generate:llms
npm test
npm run lint
npm run build
npm run release:check
```

## What To Customize First

- `shared/documentation-config.js`: docs tree, homepage copy, footer links
- `src/docs/content/`: the pages your users read
- `.env.local`: site name, canonical URL, GitHub repo metadata
- `src/globals.css`: theme tokens, typography, code styling
- `src/constants/social.tsx`: footer links

## Build Output

`npm run build` regenerates and packages:

- `public/docs-index.json`
- `public/docs-content/**/*.json`
- `public/robots.txt`
- `public/sitemap.xml`
- `public/images/og-image.svg`
- `public/images/twitter-card.svg`
- `public/llms.txt`
- `public/llms-full.txt`
- route-specific HTML files in `dist/`
- the Pagefind search index in `dist/pagefind/`
- the final static app in `dist/`

## SEO Notes

Set `VITE_SITE_URL` in `.env.local`, `.env.production`, or your host build environment if you want canonical URLs, sitemap entries, and social metadata to use your real production domain.

Add `description:` frontmatter to any Markdown page that needs a custom search or social summary. If you omit it, the generator uses the first meaningful paragraph.

## Release Docs

- [RELEASING.md](RELEASING.md)
- [CHANGELOG.md](CHANGELOG.md)

## License

MIT. See [LICENSE](LICENSE).

