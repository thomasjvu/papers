# Vercel

## Project Settings

Use these values when importing the repo:

- Build command: `npm run build`
- Output directory: `dist`

## Rewrites

The repo includes `vercel.json` so direct requests to docs routes and `/llms` resolve to the SPA entry.

## Deploy From CLI

```bash
npm run build
npx vercel --prod
```

## Notes

Because this project is static, Vercel is mostly acting as a CDN and routing layer. There are no server functions required for the default template.
