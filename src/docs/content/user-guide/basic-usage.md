# Basic Usage

The day-to-day workflow is simple: edit content, regenerate docs output, preview locally, then ship a static build.

## Reading The Docs UI

The docs shell has three main surfaces:

- the left rail for navigation, search, and settings
- the center column for content
- the right rail for either `On This Page` or the interactive map

On mobile, the file tree opens from the floating button and the map opens from the left-rail tools.

## Writer Workflow

1. edit a Markdown file under `src/docs/content/`
2. update `shared/documentation-config.js` if the page path, title, or section changed
3. run `npm run generate:docs` if the dev server is already open
4. run `npm run generate:seo` if the change affects page descriptions, site metadata, or social previews
5. refresh the page and confirm links, headings, and custom blocks render correctly
6. run `npm run build` and `npm run release:check` before publishing

## Internal Links

Use absolute docs links so navigation stays inside the SPA shell:

```md
[Deployment Overview](/docs/deployment/overview)
```

## Optional Frontmatter

You can set a custom page description with YAML frontmatter:

```md
---
description: Concise summary used for search, sitemap-related metadata, and social previews.
---
```

If you omit it, the generator uses the first meaningful paragraph.

## What Is Generated

The browser does not load Markdown source files directly.

The app fetches `/docs-index.json`, then loads only the requested page from `/docs-content/...`. That keeps the site static-host friendly and avoids loading the whole corpus on first paint.

## Search Behavior

The command palette always knows about docs-tree entries.

Full-text Pagefind results appear after a production build, so local dev is best for navigation checks and production builds are best for search validation.

## GitHub Footer Links

`edit`, `issue`, and `source` links appear when `VITE_GITHUB_URL` is configured.

## Next Steps

- [Command Palette](/docs/user-guide/command-palette)
- [Interactive Map](/docs/user-guide/interactive-map)
- [Troubleshooting](/docs/user-guide/troubleshooting)