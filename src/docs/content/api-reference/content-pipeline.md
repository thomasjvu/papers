# Content Pipeline

The content pipeline converts Markdown source files into static artifacts the app can ship directly.

## Inputs

- `shared/documentation-config.js`
- `src/docs/content/**/*.md`

## Generators

### `scripts/generate-docs.mjs`

Creates:

- `public/docs-index.json`
- `public/docs-content/**/*.json`

### `scripts/generate-llms.mjs`

Creates:

- `public/llms.txt`
- `public/llms-full.txt`

### `scripts/generate-pagefind.mjs`

Builds the Pagefind index from the production `dist/` output.

## Output Shape

`docs-index.json` looks like this:

```json
{
  "generated": "2026-03-11T00:00:00.000Z",
  "paths": ["getting-started/introduction"],
  "count": 1,
  "titles": {
    "getting-started/introduction": "Introduction"
  }
}
```

Each page is written separately, for example `public/docs-content/getting-started/introduction.json`:

```json
{
  "path": "getting-started/introduction",
  "title": "Introduction",
  "content": "# Introduction\n..."
}
```

## When It Runs

The full build runs generators in this order:

1. `generate:llms`
2. `generate:docs`
3. `vite build`
4. `generate:pagefind`

## Why This Design Works

- works on static hosts
- loads a tiny manifest before fetching page content
- keeps deployment simple
- makes AI exports a first-class build artifact

## Related Reading

For the rest of the runtime details, keep following the docs in this app rather than relying on extra root-level markdown files.

## Next Steps

- [Runtime APIs](/docs/api-reference/runtime-apis)