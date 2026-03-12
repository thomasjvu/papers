# Quick Start

Use this path if you want your own docs site running quickly with the least amount of ceremony.

## 1. Clone And Start The App

```bash
git clone https://github.com/thomasjvu/papers.git
cd papers
npm install
npm run dev
```

Open `http://localhost:3333`.

## 2. Set Basic Metadata

Create `.env.local` if you want your own site name, canonical URL, social metadata, or GitHub links.

```env
VITE_SITE_NAME="Your Docs"
VITE_SITE_URL="https://docs.example.com"
VITE_GITHUB_URL="https://github.com/your-org/your-repo"
VITE_GITHUB_BRANCH="main"
```

`VITE_SITE_URL` is what powers canonical URLs, sitemap entries, and social preview metadata.

## 3. Replace The Docs Tree

Edit `shared/documentation-config.js` so the sections, page names, tags, homepage hero, and footer links match your project.

## 4. Replace The Markdown

Write your real content in `src/docs/content/`.

Each `path` in the shared docs tree should map to one Markdown file with the same relative path.

## 5. Regenerate Docs While You Work

The app reads generated JSON from `public/docs-content/`, not raw Markdown directly.

If the dev server is already running, rerun this after changing Markdown or the docs tree:

```bash
npm run generate:docs
```

If you changed metadata that affects sitemap, canonical tags, or share previews, also run:

```bash
npm run generate:seo
```

If you want fresh AI exports too, run:

```bash
npm run generate:llms
```

## 6. Validate Before Shipping

```bash
npm test
npm run lint
npm run build
npm run release:check
```

## Recommended First Edits

- set your site metadata in `.env.local`
- trim unused sections from the shared docs tree
- replace the sample docs content
- update social links and homepage copy
- run a full build before the first deploy

## Next Steps

- [Installation](/docs/getting-started/installation)
- [Configuration](/docs/user-guide/configuration)
- [Deployment Overview](/docs/deployment/overview)