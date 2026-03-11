# Quick Start

Use this path if you want to get a fork running with minimal setup.

## 1. Clone And Install

```bash
git clone https://github.com/thomasjvu/papers.git
cd papers
npm install
```

## 2. Optional Environment Setup

Create `.env.local` if you want custom titles or GitHub edit links.

```env
VITE_SITE_NAME="Your Docs"
VITE_SITE_URL="https://docs.example.com"
VITE_GITHUB_URL="https://github.com/your-org/your-repo"
VITE_GITHUB_BRANCH="main"
```

## 3. Update The Navigation Tree

Edit `shared/documentation-config.js` and add or rename sections to match your project.

## 4. Replace The Markdown Content

Write your docs in `src/docs/content/`.

Each entry in the shared docs tree should map to a Markdown file with the same path.

## 5. Start The App

```bash
npm run dev
```

Open `http://localhost:3333`.

## 6. Build The Production Site

```bash
npm run build
```

That command regenerates docs content, `llms.txt`, and the Pagefind index before producing `dist/`.

## Recommended First Edits

- set your site name and GitHub repo URL
- replace the homepage hero copy
- trim unused docs sections from the shared tree
- replace the sample docs in `src/docs/content/`

## Next Steps

- [Configuration](/docs/user-guide/configuration)
- [Deployment Overview](/docs/deployment/overview)
- [Code Examples](/docs/developer-guides/code-examples)
