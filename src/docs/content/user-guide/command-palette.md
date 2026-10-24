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

- Use the **All**, **Docs** and **API** buttons under the search box to choose
  what to search. **Docs** searches only guides, and **API** searches only the
  OpenAPI reference. The palette opens on **All** each time.
- Results can point to a section of a page. These show the page title under
  the section name, and opening one scrolls the page to that heading.
- You can also start a query with `docs:` to search only guides, or `api:` to
  search only the OpenAPI reference, for example `api: users`. A typed prefix
  wins over the buttons.
- On a versioned or translated page, guide results come from the same version
  and language as the page you are reading.
- Pages whose title matches your query rank first. The ranking settings live in
  `src/lib/searchRanking.ts`.

## Next Steps

- [Advanced Features](/docs/user-guide/advanced-features)
- [Basic Usage](/docs/user-guide/basic-usage)
