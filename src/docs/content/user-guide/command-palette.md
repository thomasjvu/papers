# Command Palette

The command palette is the fastest way to move through the site.

## Open It

- Mac: `Cmd + K`
- Windows / Linux: `Ctrl + K`

## What It Can Show

- docs pages from the shared navigation tree
- built-in actions such as theme changes
- FAQ answers inline inside the palette
- quick links like the homepage and `llms.txt`
- Pagefind full-text results after a production build

## Keyboard Controls

- `Up` and `Down` move through results
- `Enter` opens a result or previews an FAQ answer
- `Esc` closes the palette

## Related Shortcut

`Cmd/Ctrl + I` toggles the theme.

## Search Notes

Local navigation results are always available.

Pagefind results depend on the production search index, so validate those with `npm run build` rather than only local dev.

### Scoping And Ranking

- Start a query with `docs:` to search only guides, or `api:` to search only
  the OpenAPI reference. For example, `api: users`.
- On a versioned or translated page, guide results come from the same version
  and language as the page you are reading.
- Pages whose title matches your query rank first. The ranking settings live in
  `src/lib/searchRanking.ts`.

## Next Steps

- [Advanced Features](/docs/user-guide/advanced-features)
- [Basic Usage](/docs/user-guide/basic-usage)
