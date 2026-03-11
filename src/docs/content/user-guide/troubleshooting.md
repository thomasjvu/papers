# Troubleshooting

## A Docs Route Returns 404 On Refresh

The host is probably missing an SPA rewrite.

For this repo, direct requests to `/docs/...` and `/llms` must serve `index.html`.

Check:

- `public/_redirects` for Netlify and Cloudflare Pages
- `vercel.json` for Vercel

## New Markdown Does Not Show Up

Make sure the file path exists in both places:

- `shared/documentation-config.js`
- `src/docs/content/...`

Then rerun `npm run generate:docs` or `npm run build`.

## Search Is Empty In Production

Pagefind only exists after a production build.

Run `npm run build` and verify the generated `dist/pagefind/` directory is published.

## Edit / Issue / Source Links Are Missing

Set `VITE_GITHUB_URL` and optionally `VITE_GITHUB_BRANCH` in `.env.local`.

## Theme Does Not Match The OS

The app follows system theme and reduced-motion settings until a user changes them manually.

If you want to reset back to system behavior, clear these local storage keys:

- `darkMode`
- `prefersReducedMotion`

## A Wallet Copy Button Or Icon Looks Wrong

The wallet helpers rely on the Iconify web component loaded from `index.html`. If the icons are missing, make sure that script is still present.

## Debug Checklist

```bash
npm run lint
npm run type-check
npm run build
```

If those pass, the remaining issue is usually host configuration or stale generated output.
