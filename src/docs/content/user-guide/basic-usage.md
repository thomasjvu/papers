# Basic Usage

Once the site is running, most of the day-to-day workflow is simple: update Markdown, preview locally, and ship a static build.

## Reading The Documentation UI

The docs experience has three main navigation surfaces:

- the file tree on the left
- the page content in the center
- the table of contents or interactive map on the right

On mobile, the map opens from the navigation menu.

## Search And Shortcuts

- `Cmd/Ctrl + K` opens the command palette
- `Cmd/Ctrl + I` toggles theme
- arrow keys move through palette results
- `Enter` opens the selected result

## Editing Content

Each docs page can expose these links at the bottom:

- `edit`
- `issue`
- `source`

Those links appear when `VITE_GITHUB_URL` is configured.

## Generated Content Behavior

The site does not read Markdown files directly in the browser. It reads a generated docs manifest from `/docs-index.json` and then loads only the requested page from `/docs-content/`, so local builds and deployments stay static-host friendly without shipping the whole corpus up front.

## Production Search

Production search is powered by Pagefind. The index is generated during `npm run build` and published with the rest of `dist/`.

## Next Steps

- [Advanced Features](/docs/user-guide/advanced-features)
- [Command Palette](/docs/user-guide/command-palette)
- [Interactive Map](/docs/user-guide/interactive-map)
