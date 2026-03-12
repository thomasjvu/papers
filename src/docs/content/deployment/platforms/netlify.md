# Netlify

## Site Settings

Use these values in Netlify:

- Build command: `npm run build`
- Publish directory: `dist`

## Included Files

The repo already includes the common Netlify helper:

- `public/_headers`

## CLI Deploy

```bash
npm run build
netlify deploy --prod --dir=dist
```

## Routing

Known docs routes and `/llms` are already emitted as static HTML, so you usually do not need a catch-all `_redirects` file.

If you add one intentionally, Netlify shadowing still lets existing generated files win.

## Environment Variables

Set your `VITE_*` variables in the Netlify dashboard under site configuration.
