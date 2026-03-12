# Vercel

## Project Settings

When importing the repo, use:

- Build command: `npm run build`
- Output directory: `dist`

If Vercel asks for a framework preset, `Other` is fine.

## Rewrites

The repo includes `vercel.json` as a fallback for unmatched client-side navigation, but Vercel still serves generated route files from `dist/` first.

That means known docs routes and `/llms` continue to resolve to their own HTML snapshots with page-level metadata.

## CLI Deploy

```bash
npm run build
npx vercel --prod
```

## Notes

This project is static by default. Vercel is acting as a CDN and routing layer rather than running server code.
