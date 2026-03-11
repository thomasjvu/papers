# Cloudflare Pages

## Dashboard Setup

Use these settings in Cloudflare Pages:

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `20` or newer

## CLI Deployment

The repo includes `wrangler.toml` and npm scripts for Pages deployment.

```bash
npm run build
npm run deploy
```

## Routing

`public/_redirects` covers the SPA fallback for `/docs/...` and `/llms` when deployed on Cloudflare Pages.

## Environment Variables

Set the same `VITE_*` variables in the Pages dashboard that you use locally.

## Good Fit

Cloudflare Pages works especially well here because the final site is fully static and the generated artifacts are easy to cache globally.
