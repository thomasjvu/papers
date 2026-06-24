# papers framework roadmap

Static documentation framework for teams that want full visual control without a docs SaaS.

## Design goals

- **Simple authoring** — Markdown first, optional MDX, one config file for navigation
- **Easy maintenance** — Generated JSON artifacts, tree sync checks
- **Fast sites** — Static deploy, prefetch, lazy-loaded heavy viewers
- **Competitive surface** — OpenAPI explorer, llms.txt, search, version/i18n scaffolding

## Homepage toggle

Set `homepageConfig.enabled` in `shared/documentation-config.js`. When `false`, `/` redirects to the first docs page.

## Content collections

Multi-collection support lets one app serve product docs, dev docs, or other trees from separate content roots. Configure collections in `shared/content-collections.js` and wire routes in `shared/documentation-config.js`.

Generated output lands in `public/docs-content/` (and per-collection indexes). The runtime fetches JSON, not raw Markdown.

## Shipped

| Feature                                    | Status                                                             |
| ------------------------------------------ | ------------------------------------------------------------------ |
| Markdown + frontmatter                     | Yes                                                                |
| MDX (sanitized HTML at build)              | Yes                                                                |
| GitHub callouts                            | Yes                                                                |
| CharacterNote MDX shortcode                | Yes — Mercenary avatar variants for info/warning/alert/success/tip |
| Mermaid diagrams                           | Yes                                                                |
| Pagefind search + command palette          | Yes                                                                |
| Interactive doc graph                      | Yes                                                                |
| `llms.txt` generation                      | Yes                                                                |
| Hosted asset preview (`HostedFilePreview`) | Yes                                                                |
| Themed code blocks                         | Yes — per-theme `--code-bg`, clip-path, min-height tokens          |
| OpenAPI explorer (Scalar)                  | Yes                                                                |
| Edit on GitHub footer                      | Yes                                                                |
| Version / i18n scaffolding                 | Yes                                                                |
| Tree sync                                  | `npm run check:docs-tree`                                          |
| Starter CLI                                | `npm create papers`                                                |

## Enable versioned or localized docs

In `shared/documentation-config.js`:

```js
export const versionConfig = { current: '1.0', versions: ['1.0'], enabled: true };
export const i18nConfig = { enabled: true, defaultLocale: 'en', locales: ['en', 'fr'] };
```

Add variant content under `src/docs/content/variants/`.

## Lazy feature invariants

1. Lazy modules must not import `src/providers/*`.
2. `manualChunks` may split `node_modules` only — not app source modules.

Enforced by `src/framework/lazyFeatureBoundaries.ts` and architecture tests.

## Near-term improvements

1. SSR prerender for first paint
2. Plugin seam (`papers.config.js` remark/rehype hooks)
3. Publish `create-papers` to npm
4. Interactive MDX `<Tabs>` hydration
5. Content lint in CI (broken links, frontmatter)

## Positioning

papers sits between **Mintlify/GitBook** (fast SaaS, less control) and **Docusaurus/Starlight** (large ecosystems, heavier ops): own your UI, ship distinctive docs, grow into MDX and API reference without migrating later.
