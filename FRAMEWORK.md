# papers framework roadmap

papers is a static documentation framework for teams that want full visual control without a docs SaaS. This file tracks what ships today and what comes next.

## Design goals

- **Simple authoring:** Markdown first, optional MDX, one config file for navigation
- **Easy maintenance:** Generated JSON artifacts, tree sync checks, content-voice tests
- **Fast sites:** Static deploy, prefetch, lazy-loaded heavy viewers
- **Competitive surface:** OpenAPI explorer, llms.txt, search, version/i18n scaffolding

## Shipped

| Feature                                    | Status                                             |
| ------------------------------------------ | -------------------------------------------------- |
| Markdown + frontmatter                     | Yes                                                |
| MDX (`.mdx` → sanitized HTML at build)     | Yes                                                |
| GitHub callouts (`> [!NOTE]`)              | Yes                                                |
| Mermaid diagrams                           | Yes                                                |
| Pagefind search + command palette          | Yes                                                |
| Interactive doc graph                      | Yes                                                |
| `llms.txt` generation                      | Yes                                                |
| OpenAPI explorer (Scalar)                  | Yes                                                |
| Edit on GitHub footer                      | Yes                                                |
| Version / i18n route scaffolding           | Yes (enable in `documentation-config.js`)          |
| Doc JSON prefetch on hover                 | Yes                                                |
| Tree sync script                           | `npm run check:docs-tree`                          |
| Tree auto-append                           | `npm run sync:docs-tree -- --write`                |
| MDX shortcodes (`Callout`, `Tabs`, `Card`) | Yes                                                |
| Mermaid lazy load                          | Yes (`MermaidDiagram` async chunk + `vendor-mermaid`) |
| Lazy feature boundary checks               | Yes (`npm test` guards provider imports in lazy modules) |
| OpenAPI multi-spec                         | Yes (`openapiConfig` in `documentation-config.js`) |
| Starter CLI                                | `npm create papers` via `packages/create-papers`   |

## Enable versioned or localized docs

In [`shared/documentation-config.js`](shared/documentation-config.js):

```js
export const versionConfig = {
  current: '1.0',
  versions: ['1.0', '2.0'],
  labels: { '1.0': 'v1', '2.0': 'v2' },
  enabled: true,
};

export const i18nConfig = {
  enabled: true,
  defaultLocale: 'en',
  locales: ['en', 'fr'],
};
```

Add variant content under:

- `src/docs/content/variants/versions/2.0/...`
- `src/docs/content/variants/locales/fr/...`

The sidebar selector appears automatically when enabled.

## Lazy feature invariants

Framework sites lazy-load heavy viewers to keep first paint fast. Two rules prevent production crashes:

1. **Lazy modules are leaves** — files imported via `React.lazy()` must not import `src/providers/*`. Use CSS, DOM APIs, or props from the parent shell instead of `useTheme()` and similar context hooks.
2. **Vendor-only chunk splits** — `vite.config.ts` `manualChunks` may bucket `node_modules` (for example `vendor-mermaid`), but must not isolate `src/` app modules into named chunks. That pattern created circular `vendor-react` dependencies and `createContext` runtime failures.

Enforced by `src/framework/lazyFeatureBoundaries.ts` and the architecture test `lazy feature modules avoid provider imports and unsafe app chunk splits`.

## Near-term improvements

1. **SSR prerender** — optional Vite SSR pass for first paint (SPA → hybrid)
2. **Plugin seam** — `papers.config.js` hooks for remark/rehype transforms
3. **Publish `create-papers`** — npm package for `npm create papers@latest`
4. **Interactive tabs** — optional client hydration for MDX `<Tabs>` (today uses `<details>`)
5. **Content lint** — broken links, missing frontmatter, voice tests in CI

## Comparison positioning

papers targets the gap between **Mintlify/GitBook** (fast SaaS, less control) and **Docusaurus/Starlight** (large ecosystems, heavier ops):

- Own your UI and hosting
- Ship distinctive product docs (not another Material theme)
- Grow into MDX, i18n, and API reference without migrating later

See the Oblivion docs comparison notes in the parent repo planning history for a full matrix.
