# Deployment Overview

This project is a static site build with SPA routing.

## Build Output

`npm run build` produces `dist/` with:

- the Vite app bundle
- generated docs JSON files
- `llms.txt` exports
- Pagefind search assets

## What Hosts Must Support

At minimum, your host should:

- publish the `dist/` directory
- serve static assets normally
- rewrite `/docs/...` and `/llms` to `index.html`

## Included Host Helpers

- `public/_headers`
- `public/_redirects`
- `vercel.json`
- `wrangler.toml`

## Recommended Pre-Deploy Commands

```bash
npm run lint
npm run type-check
npm run build
```

## Platform Guides

- [Cloudflare](/docs/deployment/platforms/cloudflare)
- [Vercel](/docs/deployment/platforms/vercel)
- [Netlify](/docs/deployment/platforms/netlify)
