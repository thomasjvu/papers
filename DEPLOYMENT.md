# Deployment Guide

This project builds to `dist/` and runs as a single-page application with static assets.

## Deployment Checklist

1. Run `npm run build`.
2. Publish the `dist/` directory.
3. Make sure direct requests to `/docs/...` and `/llms` return `index.html`.
4. Preserve generated assets from `public/` such as `docs-index.json`, `docs-content/`, `llms.txt`, and `pagefind/`.

## Environment Variables

These are the only project-level variables you usually need:

```env
VITE_SITE_NAME="Your Docs"
VITE_SITE_URL="https://docs.example.com"
VITE_GITHUB_URL="https://github.com/your-org/your-repo"
VITE_GITHUB_BRANCH="main"
VITE_DEBUG_MODE="false"
```

`VITE_GITHUB_URL` enables the edit, issue, and source links at the bottom of each docs page.

## Static Hosting Notes

The app uses `BrowserRouter`, so SPA rewrites matter.

Included in the repo:

- `public/_redirects` for Netlify and Cloudflare Pages
- `vercel.json` for Vercel
- `public/_headers` for long-lived cache headers on hashed assets, fonts, favicons, and Pagefind files

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Optional CLI deploy: `npm run deploy`

`wrangler.toml` already points `pages_build_output_dir` to `dist`.

## Vercel

- Build command: `npm run build`
- Output directory: `dist`
- Rewrites: `vercel.json` is included

If you import the repo in Vercel, keep the project as a static site and let the included rewrites handle SPA routes.

## Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Rewrites: `public/_redirects` is included
- Headers: `public/_headers` is included

## Other Static Hosts

If your host does not support rewrite files directly, configure a fallback so these routes serve `index.html`:

- `/docs`
- `/docs/*`
- `/llms`

## Pre-Deploy Verification

Run these locally before shipping:

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

After deployment, verify:

- homepage loads
- `/docs/getting-started/introduction` loads directly
- `/llms` loads directly
- search works after a production build
- generated files are publicly available

## Generated Files To Expect

After `npm run build`, the final deployment should contain:

- `dist/index.html`
- `dist/docs-index.json`
- `dist/docs-content/**/*.json`
- `dist/llms.txt`
- `dist/llms-full.txt`
- `dist/pagefind/*`

## Troubleshooting

If refreshing a docs route returns a host 404, the rewrite rule is missing or not applied.

If search works in development but not production, make sure the Pagefind directory was generated and published.