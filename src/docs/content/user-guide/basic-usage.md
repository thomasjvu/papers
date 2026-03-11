# Basic Usage

Once the site is running, the normal workflow is simple: edit Markdown, preview locally, and ship a static build.

## Reading The Docs UI

The docs experience has three primary surfaces:

- the file tree on the left for moving between pages
- the page content in the center for reading and editing docs
- the table of contents or interactive map on the right for in-page navigation and structure

On mobile, the sidebar reopens from the floating toggle and the map opens from the sidebar tools.

## Search And Shortcuts

- `Cmd/Ctrl + K` opens the command palette
- `Cmd/Ctrl + I` toggles theme
- arrow keys move through palette results
- `Enter` opens the selected result

## Editing Content

A typical content change looks like this:

1. update the Markdown file under `src/docs/content/`
2. keep the matching path in `shared/documentation-config.js`
3. preview the result with `npm run dev`
4. run `npm run build` before shipping

## Generated Content Behavior

The browser does not read Markdown files directly.

Instead, the app loads a generated docs manifest from `/docs-index.json` and then fetches the requested page from `/docs-content/`, which keeps deployments static-host friendly and avoids loading the whole corpus up front.

## Production Search

Production search is powered by Pagefind.

The index is generated during `npm run build` and must be published with the rest of `dist/`.

## GitHub Editing Links

Each docs page can show these actions at the bottom:

- `edit`
- `issue`
- `source`

Those links appear when `VITE_GITHUB_URL` is configured.

## Next Steps

- [Command Palette](/docs/user-guide/command-palette)
- [Interactive Map](/docs/user-guide/interactive-map)
- [Troubleshooting](/docs/user-guide/troubleshooting)
