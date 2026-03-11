# Production Setup

## Required Metadata

Before you ship, set the site metadata you actually want users to see.

```env
VITE_SITE_NAME="Your Docs"
VITE_SITE_URL="https://docs.example.com"
VITE_GITHUB_URL="https://github.com/your-org/your-repo"
VITE_GITHUB_BRANCH="main"
```

## Asset And Cache Behavior

`public/_headers` configures long-lived cache headers for hashed assets, fonts, favicons, and Pagefind files.

## SPA Rewrite Rules

Direct route loads need an HTML fallback.

This repo includes:

- `public/_redirects`
- `vercel.json`

If you deploy elsewhere, recreate equivalent rewrites.

## CI Suggestions

A good production pipeline runs:

```bash
npm ci
npm run lint
npm run type-check
npm run build
```

## Final Smoke Test

After deploy, verify:

- homepage loads
- a deep docs route loads directly
- `/llms` loads directly
- Pagefind search returns results
- edit / issue / source links go to the expected repo
