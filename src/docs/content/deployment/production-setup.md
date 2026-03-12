# Production Setup

## Set Real Metadata First

Before you ship, set the values users and crawlers should actually see. You can provide them through `.env.local`, `.env.production`, or your host's build environment.

```env
VITE_SITE_NAME="Your Docs"
VITE_SITE_URL="https://docs.example.com"
VITE_GITHUB_URL="https://github.com/your-org/your-repo"
VITE_GITHUB_BRANCH="main"
```

`VITE_SITE_URL` is what powers canonical URLs, sitemap entries, and absolute social metadata.

## Build Pipeline

A production build runs the content generators and the static bundle in one command:

```bash
npm run build
```

That regenerates docs JSON, sitemap, robots, social preview images, route-level HTML metadata, AI exports, the app bundle, and Pagefind assets.

## CI Baseline

A solid deployment pipeline is:

```bash
npm ci
npm test
npm run lint
npm run build
npm run release:check
```

## Description Control

If a page needs a specific search or preview summary, add frontmatter to the Markdown file:

```md
---
description: One clear sentence describing the page.
---
```

If you omit it, the generator falls back to the first meaningful paragraph.

## Asset And Routing Helpers

This repo already includes:

- `public/_headers` for static-asset caching and security headers
- `vercel.json` for Vercel fallback routing
- `wrangler.toml` for Cloudflare Pages configuration

Known docs routes are emitted as real HTML files, so avoid global `/docs/* -> /index.html` rewrites on hosts like Cloudflare Pages.

## Final Smoke Test

Before deploy, run:

```bash
npm run release:check
```

That verifies both the generated artifact set and a served preview of the built app.

After deploy, verify:

- the homepage loads
- a deep docs route loads directly
- `/llms` loads directly
- `/robots.txt` and `/sitemap.xml` load
- link previews use the expected title and description
- Pagefind search returns results
- GitHub footer links go to the expected repo
- the generated docs match the latest source content
