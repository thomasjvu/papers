# Best Practices

## Keep The Tree And Files In Sync

Treat `shared/documentation-config.js` as the source of truth for navigation.

If a Markdown file exists without a matching tree entry, users will not reach it through generated output.

## Write For Scanning

Prefer short pages, clear headings, and purposeful section names.

That improves the table of contents, the interactive map, Pagefind excerpts, and `llms.txt` output.

## Use Real Examples

Code samples, environment variables, and deployment commands should be runnable or obviously placeholder-safe.

## Regenerate Early

Rerun `npm run generate:docs` while authoring instead of waiting until the end. That catches broken paths and stale content sooner.

## Verify Before Shipping

```bash
npm test
npm run lint
npm run build
```

## Remove Sample Surface Area You Do Not Need

Trim unused sections, placeholder pages, and dead links early. The starter is easiest to maintain when the tree only contains content you actually intend to support.
