# Quick Start

Use this path if you want to fork the template, replace the sample content, and get your own docs site running as quickly as possible.

## 1. Clone, Install, And Start The App

```bash
git clone https://github.com/thomasjvu/papers.git
cd papers
npm install
npm run dev
```

Open `http://localhost:3333`.

## 2. Set The Basic Site Metadata

Create `.env.local` if you want your own site name, canonical URL, or GitHub edit links.

```env
VITE_SITE_NAME="Your Docs"
VITE_SITE_URL="https://docs.example.com"
VITE_GITHUB_URL="https://github.com/your-org/your-repo"
VITE_GITHUB_BRANCH="main"
```

## 3. Replace The Docs Tree

Edit `shared/documentation-config.js` so the sections, page titles, homepage content, and navigation structure match your project.

## 4. Replace The Sample Markdown

Write your own content under `src/docs/content/`.

Every entry in the docs tree should map to a Markdown file with the same path.

## 5. Check The Main User Flows

Before you ship, make sure these work with your real content:

- homepage links
- left sidebar navigation
- `Cmd/Ctrl + K` search
- right-side table of contents and docs map
- edit/issue/source links if you enabled GitHub URLs

## 6. Build The Production Site

```bash
npm run build
```

That command regenerates docs content, `llms.txt`, and the Pagefind index before producing `dist/`.

## Recommended First Edits

- set your site name and GitHub repo URL
- replace the homepage hero copy
- trim unused sections from the shared docs tree
- replace the sample docs in `src/docs/content/`
- remove any placeholder links you do not want in production

## Next Steps

- [Installation](/docs/getting-started/installation)
- [Configuration](/docs/user-guide/configuration)
- [Deployment Overview](/docs/deployment/overview)
