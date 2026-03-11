# Installation

## Requirements

- Node.js 18 or newer
- npm 9 or newer

## Install Dependencies

```bash
npm install
```

## Optional Environment Variables

Use `.env.local` when you want custom metadata or GitHub integration.

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
3. Replace the example Markdown files.
4. Run `npm run dev`.
5. Run `npm run lint` and `npm run build` before deploying.

## Common Project Paths

```text
shared/documentation-config.js   Navigation tree and homepage metadata
src/docs/content/                Markdown source files
src/config/ui.ts                 UI feature toggles
src/constants/social.tsx         Footer social links
public/_headers                  Cache headers
public/_redirects                SPA rewrites for supported hosts
```

## How To Verify The Setup

Run:

```bash
npm run test
npm run lint
npm run build
```

If all three pass, the template is in good shape for customization and deployment.

## What A Successful Build Means

A successful production build confirms that:

- docs content was generated correctly
- the TypeScript app compiled
- the static assets were bundled
- Pagefind search assets were generated
- `llms.txt` outputs were refreshed

## Next Steps

- [Basic Usage](/docs/user-guide/basic-usage)
- [Troubleshooting](/docs/user-guide/troubleshooting)
