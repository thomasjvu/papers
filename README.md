# papers

`papers` is a static documentation template built with React 19, Vite 6, TypeScript, Tailwind CSS, and Pagefind.

It is designed for teams that want a docs site with a polished UI, generated search assets, `llms.txt` output, and straightforward static hosting.

## What This Repo Is

The app is a client-side documentation site powered by generated content files:

- Source content lives in `src/docs/content/*.md`
- Navigation and homepage structure live in `shared/documentation-config.js`
- Build scripts generate `public/docs-index.json`, per-page JSON under `public/docs-content/`, `public/llms.txt`, `public/llms-full.txt`, and the Pagefind index
- The runtime loads the docs index once, fetches page content on demand, and renders it through React Router

## Highlights

- Static-first content pipeline with generated JSON and search indexes
- Command palette search with Pagefind integration
- File tree navigation, table of contents, and interactive documentation map
- Dark mode, reduced motion support, and font switching
- Rich Markdown rendering with syntax-highlighted code blocks and live examples
- Built-in `llms.txt` and `llms-full.txt` generation
- Ready for Cloudflare Pages, Vercel, Netlify, and other static hosts

## Quick Start

```bash
git clone https://github.com/thomasjvu/papers.git
cd papers
npm install
npm run dev
```

The dev server runs at [http://localhost:3333](http://localhost:3333).

## Common Commands

```bash
npm run dev
npm run lint
npm run type-check
npm run test
npm run build
npm run generate:docs
npm run generate:llms
npm run generate:pagefind
```

## Project Structure

```text
public/                     Static assets and generated output inputs
scripts/                    Build-time generators
shared/                     Shared homepage and navigation config
src/components/             UI components
src/docs/content/           Source Markdown content
src/lib/                    Runtime content/navigation helpers
src/pages/                  Route entry points
src/providers/              React context providers
test/                       Lightweight architecture regression tests
```

## Customization Points

- `shared/documentation-config.js`: homepage copy, nav tree, tags, and footer links
- `src/docs/content/`: your Markdown pages
- `src/config/ui.ts`: mobile docs UI toggles
- `src/constants/social.tsx`: footer social links
- `src/globals.css`: theme tokens and component styling
- `.env.local`: site metadata and GitHub editing links

## Deployment

Build output is written to `dist/`.

For client-side routes like `/docs/...` and `/llms`, your host must serve `index.html` on direct requests. This repo includes:

- `public/_redirects` for Netlify and Cloudflare Pages
- `vercel.json` rewrites for Vercel
- `public/_headers` cache headers for static assets

More detail lives in [DEPLOYMENT.md](DEPLOYMENT.md).

## Documentation Internals

If you want to script against the generated content or understand how the build pipeline works, see [DOCUMENTATION_API.md](DOCUMENTATION_API.md).

## License

MIT. See [LICENSE](LICENSE).