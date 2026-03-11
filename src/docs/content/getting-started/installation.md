# Installation

## Requirements

- Node.js 18 or newer
- npm 9 or newer

## Install Dependencies

```bash
npm install
```

## Helpful Environment Variables

```env
VITE_SITE_NAME="Your Docs"
VITE_SITE_URL="https://docs.example.com"
VITE_GITHUB_URL="https://github.com/your-org/your-repo"
VITE_GITHUB_BRANCH="main"
VITE_DEBUG_MODE="false"
```

## First Run Checklist

1. Install dependencies.
2. Update `shared/documentation-config.js`.
3. Replace the example Markdown files.
4. Run `npm run dev`.
5. Run `npm run build` before deploying.

## Common Project Paths

```text
shared/documentation-config.js   Navigation tree and homepage metadata
src/docs/content/                Markdown source files
src/config/ui.ts                 UI feature toggles
src/constants/social.tsx         Footer social links
public/_headers                  Cache headers
public/_redirects                SPA rewrites for supported hosts
```

## Verifying The Setup

Run:

```bash
npm run lint
npm run type-check
npm run build
```

If all three pass, the template is ready for customization and deployment.

## Next Steps

- [Basic Usage](/docs/user-guide/basic-usage)
- [Troubleshooting](/docs/user-guide/troubleshooting)
