# Troubleshooting

## My Markdown Change Does Not Show Up

The app reads generated JSON, not raw Markdown directly.

If `npm run dev` is already running, rerun:

```bash
npm run generate:docs
```

If you changed AI-export content too, also run:

```bash
npm run generate:llms
```

## A Docs Route Returns 404 On Refresh

Known docs routes are emitted as static HTML during `npm run build`.

If a direct request to `/docs/...` or `/llms` returns 404, check:

- `npm run build` completed successfully
- the deployed `dist/` output still includes `docs/.../index.html` and `llms/index.html`
- no catch-all host rule is rewriting `/docs/*` or `/llms` back to the homepage
- `vercel.json` is being used only as fallback routing, not instead of the generated files

## The Command Palette Cannot Find A Page

Make sure the page exists in both places:

- `shared/documentation-config.js`
- `src/docs/content/...`

Then rerun `npm run generate:docs`.

## Search Is Empty In Production

Pagefind is only generated during `npm run build`.

Make sure `dist/pagefind/` is deployed with the rest of the site.

## Edit, Issue, Or Source Links Are Missing

Set `VITE_GITHUB_URL` and optionally `VITE_GITHUB_BRANCH` in `.env.local`, `.env.production`, or your host build environment.

## Theme, Motion, Or Font Settings Feel Stuck

Clear these local-storage keys and reload:

- `darkMode`
- `prefersReducedMotion`
- `fontFamily`

## Wallet Icons Or Copy Buttons Look Wrong

Confirm the wallet markup still uses `class="wallet-address"` plus `data-address`.

## Debug Checklist

```bash
npm test
npm run lint
npm run build
```

If those pass, the remaining problem is usually stale generated docs output, an incomplete deployment of `dist/`, or a path mismatch between the docs tree and Markdown files.
