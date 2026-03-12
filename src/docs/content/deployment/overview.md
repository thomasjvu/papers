# Deployment Overview

`papers` builds to a static site with route-specific HTML output.

## What `npm run build` Produces

- the Vite app bundle in `dist/`
- generated docs JSON derived from your Markdown content
- route-specific HTML files with page-level metadata
- `robots.txt` and `sitemap.xml`
- generated social preview images
- `llms.txt` and `llms-full.txt`
- the Pagefind search index in `dist/pagefind/`

## What Your Host Must Support

At minimum, your host should:

- publish the `dist/` directory
- serve generated files directly, including `dist/docs/**/index.html`, `dist/llms/index.html`, and `dist/404.html`
- serve static assets normally
- avoid catch-all rewrites that send `/docs/*` or `/llms` to the homepage when matching files already exist

## Included Host Helpers

This repo already includes:

- `public/_headers`
- `vercel.json`
- `wrangler.toml`

Optional rewrite rules only make sense if you intentionally remove route-level HTML generation and accept losing per-page metadata on direct requests.

## Recommended Pre-Deploy Commands

```bash
npm test
npm run lint
npm run build
npm run release:check
```

## Platform Guides

- [Cloudflare](/docs/deployment/platforms/cloudflare)
- [Vercel](/docs/deployment/platforms/vercel)
- [Netlify](/docs/deployment/platforms/netlify)