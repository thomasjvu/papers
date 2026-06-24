# papers framework roadmap

Static documentation framework for teams that want full visual control without a docs SaaS.

## Design goals

- **Simple authoring** — Markdown first, optional MDX, one config file for navigation
- **Easy maintenance** — Generated JSON artifacts, tree sync checks
- **Fast sites** — Static deploy, prefetch, lazy-loaded heavy viewers
- **Competitive surface** — OpenAPI explorer, llms.txt, search, version/i18n scaffolding

## Homepage toggle

Set `homepageConfig.enabled` in `shared/documentation-config.js`. When `false`, `/` redirects to the first docs page.

## Shipped

| Feature | Status |
| ------- | ------ |
| Markdown + frontmatter | Yes |
| MDX (sanitized HTML at build) | Yes |
| GitHub callouts | Yes |
| Mermaid diagrams | Yes |
| Pagefind search + command palette | Yes |
| Interactive doc graph | Yes |
| `llms.txt` generation | Yes |
| Hosted asset preview | Yes |
| Themed code blocks | Yes |
| OpenAPI explorer (Scalar) | Yes |
| Edit on GitHub footer | Yes |
| Version / i18n scaffolding | Yes |
| Tree sync | `npm run check:docs-tree` |
| Starter CLI | `npm create papers` |

## Lazy feature invariants

1. Lazy modules must not import `src/providers/*`.
2. `manualChunks` may split `node_modules` only — not app source modules.

## Near-term improvements

1. SSR prerender
2. Plugin seam (`papers.config.js`)
3. Publish `create-papers` to npm
4. Interactive MDX `<Tabs>`
5. Content lint in CI

## Positioning

papers sits between hosted doc SaaS (less control) and large doc frameworks (heavier ops): own your UI, ship distinctive docs, grow into MDX and API reference without migrating later.