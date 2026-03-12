# Cloudflare Pages

## Recommended Settings

Use these values in Cloudflare Pages:

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `20` or newer

## CLI Deploy

The repo already includes `wrangler.toml` and deploy scripts.

```bash
npm run build
npm run deploy
```

## Routing

Cloudflare Pages works best when it serves the generated route files directly.

Do not add a blanket `/docs/* -> /index.html` or `/llms -> /index.html` rule in `_redirects` while route HTML generation is enabled. Pages follows those rules before serving the generated per-page HTML, which collapses your page-level metadata back to the homepage.

## Environment Variables

Set the same `VITE_*` variables in the Pages dashboard that you use locally.

## Why It Fits Well

Cloudflare Pages is a good match because the final site is fully static, cacheable, and does not require server functions by default.
