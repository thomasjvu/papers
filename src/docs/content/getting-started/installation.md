# Installation

## Requirements

- Node.js 18 or newer
- npm 9 or newer

## Install Dependencies

```bash
npm install
```

## Optional Environment Variables

Use `.env.local` when you want real site metadata, canonical URLs, sitemap output, or GitHub footer links.

```env
VITE_SITE_NAME="Your Docs"
VITE_SITE_URL="https://docs.example.com"
VITE_GITHUB_URL="https://github.com/your-org/your-repo"
VITE_GITHUB_BRANCH="main"
VITE_DEBUG_MODE="false"
```

## First-Run Checklist

1. Install dependencies.
2. Update `shared/documentation-config.js`.
3. Replace the sample Markdown files in `src/docs/content/`.
4. Run `npm run dev`.
5. Rerun `npm run generate:docs` after docs-content or docs-tree edits while dev is running.
6. Rerun `npm run generate:seo` after changing site metadata or page descriptions.
7. Run `npm test`, `npm run lint`, `npm run build`, and `npm run release:check` before deploy.

## Project Paths To Know

```text
shared/documentation-config.js   Docs tree, homepage content, footer links
src/docs/content/                Markdown source files
src/lib/content.ts               Docs manifest and per-page content loading
src/config/ui.ts                 Mobile shell behavior
src/globals.css                  Theme and typography tokens
src/constants/social.tsx         Footer links
scripts/generate-docs.mjs        Markdown-to-JSON generation
scripts/generate-seo.mjs         robots, sitemap, social preview image generation
scripts/generate-route-html.mjs  route-level HTML metadata snapshots
scripts/generate-llms.mjs        llms.txt generation
```

## What A Successful Build Confirms

A clean build means:

- docs JSON was regenerated correctly
- route metadata HTML was emitted into `dist/`
- `robots.txt`, `sitemap.xml`, and share images were refreshed
- the React app compiled
- static assets were bundled
- Pagefind assets were created
- `llms.txt` outputs were refreshed

## Next Steps

- [Basic Usage](/docs/user-guide/basic-usage)
- [Troubleshooting](/docs/user-guide/troubleshooting)