# Best Practices

## Keep One Source Of Truth

Treat `shared/documentation-config.js` as the source of truth for navigation and page tags.

If a page exists in Markdown but not in the shared tree, it will not show up in generated outputs.

## Prefer Small, Focused Markdown Files

Shorter docs pages improve:

- navigation clarity
- Pagefind excerpts
- `llms.txt` descriptions
- maintenance over time

## Validate The Static Build Regularly

Run this before merging meaningful changes:

```bash
npm run lint
npm run type-check
npm run build
```

## Keep Internal Links Stable

Use `/docs/...` links consistently so the runtime can intercept them and hosts can rewrite them cleanly.

## Configure GitHub Metadata Early

Set `VITE_GITHUB_URL` so contributors can jump straight to edit and issue links from the page footer.

## Avoid Unused Surface Area

If you remove a docs section from the shared tree, also remove or archive the corresponding Markdown file so the repo stays easy to read.
