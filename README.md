# papers

`papers` is a static documentation template built with React, Vite, TypeScript, generated Markdown content, and Pagefind search.

If you are evaluating the template, start inside the app at `/docs/getting-started/introduction`.
If you are customizing it for your own project, the shortest path is:

```bash
git clone git@github.com:thomasjvu/papers.git
cd papers
npm install
npm run dev
```

The dev server runs at `http://localhost:3333`.

## Best Starting Points

- Product overview: `/docs/getting-started/introduction`
- First setup steps: `/docs/getting-started/quick-start`
- Environment and verification: `/docs/getting-started/installation`
- Deployment guidance: `/docs/deployment/overview`

## What To Customize First

1. Update `shared/documentation-config.js`.
2. Replace the sample Markdown files under `src/docs/content/`.
3. Set `.env.local` values like `VITE_SITE_NAME` and `VITE_GITHUB_URL`.
4. Replace homepage copy and social links.
5. Run a production build before deploying.

## Core Commands

```bash
npm run dev
npm run test
npm run lint
npm run build
```

## What `npm run build` Produces

The production build regenerates and packages:

- per-page docs JSON in `public/docs-content/`
- the docs manifest in `public/docs-index.json`
- `llms.txt` and `llms-full.txt`
- the Pagefind search index
- the final static app in `dist/`

## Where The Template Is Configured

- `shared/documentation-config.js`: docs tree, homepage content, section metadata
- `src/docs/content/`: Markdown source content
- `src/config/ui.ts`: UI behavior toggles
- `src/constants/social.tsx`: footer and social links
- `src/lib/content.ts`: manifest and per-page content loading

## License

MIT. See [LICENSE](LICENSE).
