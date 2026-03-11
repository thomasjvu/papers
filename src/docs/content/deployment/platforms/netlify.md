# Netlify

## Site Settings

Use these settings in Netlify:

- Build command: `npm run build`
- Publish directory: `dist`

## Included Files

This repo already includes the files Netlify expects for the common static-host case:

- `public/_redirects`
- `public/_headers`

## CLI Deploy

```bash
npm run build
netlify deploy --prod --dir=dist
```

## Routing

The `_redirects` file handles the SPA fallback for `/docs` routes and `/llms`.

## Environment Variables

Set your `VITE_*` variables in the Netlify dashboard under Site configuration.
