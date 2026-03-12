# Configuration

Most customization happens in a small set of files.

## Primary Configuration Files

- `shared/documentation-config.js`: docs tree, homepage hero, quick-start steps, footer links, page tags
- `src/docs/content/`: page source content
- `.env.local`: site metadata, canonical URL, GitHub URLs
- `src/globals.css`: theme tokens, typography, code styling
- `src/config/ui.ts`: mobile docs-shell behavior
- `src/constants/social.tsx`: footer links

## Recommended Order

1. define the docs structure in `shared/documentation-config.js`
2. write or replace the Markdown pages in `src/docs/content/`
3. set `VITE_*` metadata in `.env.local`
4. adjust theme and typography tokens in `src/globals.css`
5. run `npm run generate:docs`, `npm run generate:seo`, then `npm run build`

## What Requires Regeneration

Rerun `npm run generate:docs` when you change:

- docs-tree paths or titles
- Markdown page content
- page descriptions that feed generated output

Rerun `npm run generate:seo` when you change:

- `VITE_SITE_URL`
- `VITE_SITE_NAME`
- homepage messaging that should appear in preview cards
- route descriptions or canonical behavior

Rerun `npm run generate:llms` when you want fresh AI exports without a full build.

## What Does Not Need Content Regeneration

UI-only changes in React, CSS, or providers can usually be checked with the dev server alone.

## Notes On Descriptions

Use Markdown frontmatter when a page needs a custom SEO or social summary:

```md
---
description: One clear sentence about what this page covers.
---
```

If you omit it, the first meaningful paragraph becomes the fallback description.

## Next Steps

- [UI Configuration](/docs/developer-guides/ui-configuration)
- [Design System](/docs/developer-guides/design-system)
