# Troubleshooting

## A Docs Route Returns 404 On Refresh

Your host is probably missing an SPA rewrite.

Direct requests to `/docs/...` and `/llms` need to serve `index.html`.

Check:

- `public/_redirects` for Netlify and Cloudflare Pages
- `vercel.json` for Vercel

## New Markdown Does Not Show Up

Make sure the page exists in both places:

- `shared/documentation-config.js`
- `src/docs/content/...`

Then rerun `npm run generate:docs` or `npm run build`.

## The Command Palette Does Not Find A Page

The command palette only knows about pages that made it into the generated docs manifest.

If a page is missing from search:

1. confirm the docs tree entry exists
2. confirm the Markdown path matches it
3. rerun `npm run build`

## Search Is Empty In Production

Pagefind is only generated during a production build.

Run `npm run build` and verify that `dist/pagefind/` is deployed with the rest of the site.

## Edit / Issue / Source Links Are Missing

Set `VITE_GITHUB_URL` and optionally `VITE_GITHUB_BRANCH` in `.env.local`.

## Theme Or Motion Settings Feel Stuck

The app follows system theme and reduced-motion settings until a user changes them manually.

If you want to reset back to system behavior, clear these local storage keys:

- `darkMode`
- `prefersReducedMotion`
- `fontFamily`

## A Wallet Copy Button Or Icon Looks Wrong

The wallet helpers rely on the Iconify web component loaded from `index.html`.

If the icons are missing, confirm that script is still present.

## Debug Checklist

```bash
npm run test
npm run lint
npm run build
```

If those pass, the remaining issue is usually host configuration, stale generated output, or a broken docs-tree path.
