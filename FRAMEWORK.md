# papers framework roadmap

Static documentation framework for teams that want full visual control without a docs SaaS.

## Design goals

- **Simple authoring** — Markdown first, optional MDX, one config file for navigation
- **Easy maintenance** — Generated JSON artifacts, tree sync checks
- **Fast sites** — Static deploy, prefetch, lazy-loaded heavy viewers
- **Competitive surface** — OpenAPI explorer, llms.txt, search, version/i18n scaffolding

## Architecture

### Components

- **Build pipeline.** `npm run build` (see `package.json`) runs the generators in `scripts/` (`resolve-theme`, `generate-icons`, `generate-design-book`, `generate-openapi-artifacts`, `generate-llms`, `generate-docs`, `generate-seo`), the Vite build (`scripts/build-vite.mjs`), then `generate-route-html`, `generate-pagefind`, `generate-last-updated`, `generate-rss`, and `write-build-manifest`. Shared helpers live in `scripts/lib/` (for example `docsGeneration.mjs`, `docsArtifacts.mjs`, `mdxCompile.mjs`, `contentValidation.mjs`).
- **Configuration.** `shared/` holds config and logic used by both the build and the browser: `documentation-config.js`, `content-collections.js`, `docsRouting.js`, `mdxComponents.js`, and `openapiSpecUrls.js`.
- **Browser app.** `src/main.tsx` mounts the React app with `BrowserRouter`. `src/lib/content.ts` fetches the generated JSON index, references, and per-page content files.
- **Article first paint.** `scripts/generate-route-html.mjs` writes sanitized article HTML and the matching document data into each supported article route. The browser app reads that data on startup, displays the static article immediately, then takes over through React without hydration. Large pages and pages that need unsupported interactive MDX components keep the SPA shell. Social card PNGs are cached outside `dist/` so repeat builds can reuse them.
- **Starter.** `packages/create-papers/index.mjs` scaffolds a new site into a target directory from the commit recorded in its package manifest, or from a local checkout with `PAPERS_TEMPLATE_ROOT=local`.
- **Upgrader.** `scripts/papers-upgrade.mjs` and `scripts/lib/papersUpgrade.mjs` fetch an upstream Papers ref, three-way merge framework files, skip the site-owned paths in `papers.upgrade.json`, and run codemods from `scripts/migrations/`.

### Data flow

1. Authors write Markdown/MDX in `src/docs/content/` (or a configured collection root).
2. `generate-docs` validates the content and writes JSON under `public/` (`docs-index.json`, `docs-content/`, `docs-references.json`, and per-collection files). MDX is compiled to HTML at build time and sanitized with `rehype-sanitize`; MDX components must be listed in `shared/mdxComponents.js`.
3. Other generators derive LLM text (`llms*.txt`), SEO files, route HTML, Pagefind data, and RSS from the same content and metadata.
4. In the browser, the app fetches that JSON. HTML is sanitized with DOMPurify before it is inserted. Code blocks, live examples, color palettes, math, and Mermaid diagrams are hydrated from `data-*` attributes. Mermaid runs with `securityLevel: 'strict'` and its SVG output is sanitized; KaTeX runs with `trust: false` and expansion limits.
5. OpenAPI spec URLs are checked by `shared/openapiSpecUrls.js`: root-relative local paths, or HTTPS URLs whose exact origin is in `openapiConfig.allowedOrigins`. The build reads only local specs to generate reference pages. The Scalar viewer loads the configured URL in the browser.

### Trust boundaries

- **Maintainers** own executable code, config, themes, dependencies, and releases.
- **Content authors** supply Markdown/MDX, diagrams, TeX, and spec text. That input passes through the validators and sanitizers above.
- **Readers** receive static files only. There is no server-side account, session, or database. Browser storage holds UI preferences such as theme and sidebar state.
- **Site operators** use the starter and upgrader to take framework code from a chosen upstream release; paths in `papers.upgrade.json` stay site-owned.
- **Hosting and CI.** `public/_headers` (Cloudflare Pages) and `vercel.json` set the same Content-Security-Policy and security headers. Pull request validation runs without Cloudflare secrets. Deployment runs only on a push to `main` and deploys the build artifact produced by the validation job. Releases validate the tag against both package versions before npm publishing through a GitHub OIDC job in the `npm` environment.

## Homepage toggle

Set `homepageConfig.enabled` in `shared/documentation-config.js`. When `false`, `/` redirects to the first docs page.

## Content collections

Multi-collection support lets one app serve product docs, dev docs, or other trees from separate content roots. Configure collections in `shared/content-collections.js` and wire routes in `shared/documentation-config.js`.

Generated output lands in `public/docs-content/` (and per-collection indexes). The runtime fetches JSON, not raw Markdown.

## Shipped

| Feature                                            | Status                                                                |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| Markdown + frontmatter                             | Yes                                                                   |
| MDX (sanitized HTML at build)                      | Yes                                                                   |
| GitHub callouts                                    | Yes                                                                   |
| CharacterNote MDX shortcode                        | Yes — configurable avatar variants for info/warning/alert/success/tip |
| Mermaid diagrams                                   | Yes                                                                   |
| Pagefind search + command palette                  | Yes                                                                   |
| Interactive doc graph                              | Yes                                                                   |
| `llms.txt` generation                              | Yes                                                                   |
| Hosted asset preview (`HostedFilePreview`)         | Yes                                                                   |
| Themed code blocks                                 | Yes — per-theme `--code-bg`, clip-path, min-height tokens             |
| OpenAPI explorer + generated operation/model pages | Yes                                                                   |
| Edit on GitHub footer                              | Yes                                                                   |
| Version / i18n scaffolding                         | Yes                                                                   |
| Language switcher UI + palette actions             | Yes — `chromeConfig.languageSwitcher` (auto when multi-locale)        |
| Branding / attribution chrome                      | Yes — `brandingConfig` + `SiteAttribution` (no hardcoded credit)      |
| Sidebar variants                                   | Yes — `chromeConfig.sidebarVariant`: `tree` \| `groups`               |
| Tree sync                                          | `npm run check:docs-tree`                                             |
| Starter CLI                                        | `npm create papers`                                                   |
| DESIGN.md design book (`/design`)                  | Yes — `designBookConfig` + `npm run generate:design-book`             |
| Lorelei theme                                      | Yes — `themes/lorelei`                                                |

## Enable versioned or localized docs

In `shared/documentation-config.js`:

```js
export const versionConfig = { current: '1.0', versions: ['1.0'], enabled: true };
export const i18nConfig = {
  enabled: true,
  defaultLocale: 'en',
  locales: ['en', 'fr'],
  labels: { en: 'EN', fr: 'FR' },
};
export const chromeConfig = {
  languageSwitcher: { enabled: 'auto', placement: ['sidebar', 'command-palette'] },
  sidebarVariant: 'groups', // or 'tree'
};
export const brandingConfig = {
  productName: 'papers',
  logo: null, // or { src: '/images/logo.png', alt: '…' }
  copyright: { holder: 'Your Org' },
  attribution: null, // or { text: 'Built with papers', href: '…' }
  social: [{ name: 'GitHub', href: 'https://github.com/…', icon: 'mingcute:github-fill' }],
};
```

Add locale overlays under `src/docs/content/variants/locales/{locale}/…` (same paths as default). The nav tree **excludes** `variants/` — locales are selected via chrome / palette, not as a separate folder in the sidebar.

## OpenAPI

Already shipped: set `openapiConfig.enabled` and point `specs[].url` at YAML/JSON under `public/`, or at an HTTPS URL whose origin is listed in `openapiConfig.allowedOrigins`. The build generates stable operation and model reference pages plus machine-readable artifacts for local specs; remote specs are shown only in the Scalar viewer. The interactive Scalar explorer remains lazy at `/docs/{pagePath}`. When `openapiConfig.enabled` is `false`, `vite.config.ts` excludes the OpenAPI page and Scalar module graph from the build so disabled sites avoid bundling it. Richer playground behavior and broader schema/code-sample coverage remain bounded future work.

## Build performance

- **Compile-time feature exclusion:** `vite.config.ts` stubs disabled `openapiConfig` and `designBookConfig` route modules at build time so unused optional viewers are excluded from the module graph while enabled sites keep full route behavior.
- **Minification:** production builds use Vite's `esbuild` minifier while enforcing `papers-javascript-budgets` (600 kB per application chunk, 700 kB for the generated Mermaid parser).
- **Content-only bundle cache:** `scripts/build-vite.mjs` caches Vite's emitted app-shell outputs (`index.html`, `assets/*`, `bundle-budget.json`) under `node_modules/.cache/papers-vite-bundle/`, keyed by app-shell inputs (excluding Markdown content directories) and verified with per-file SHA-256 checksums before restore. `public/`, route HTML, Pagefind, RSS, and `build-manifest.json` always regenerate fresh. Set `PAPERS_VITE_CACHE=0` to force a cold Vite build.

## Lazy feature invariants

1. Lazy modules must not import `src/providers/*`.
2. `manualChunks` may split `node_modules` only — not app source modules.

Enforced by `src/framework/lazyFeatureBoundaries.ts` and architecture tests.

## Runtime state

See [runtime state transitions](docs/runtime-state.md) for component lifecycles,
request cancellation, and document cache invalidation.

## Instance vs framework

- **Framework (this repo):** routing, chrome, OpenAPI viewer, generators, sample template docs.
- **Product instances** (e.g. companion docs apps): own Markdown content + `brandingConfig` / i18n locales only. Do not land product copy in papers.

For the content-engine direction and parity scorecard, see
[docs/decisions/001-content-engine.md](docs/decisions/001-content-engine.md).

## Near-term improvements

1. Typed collection metadata and a bounded content adapter seam
2. Interactive MDX `<Tabs>` hydration
3. Content lint in CI (broken links, frontmatter)
4. Broader generated OpenAPI schema/code-sample coverage and richer playground behavior

Supported article routes already use static build-time prerendering for first
paint. This does not add a server runtime or streaming SSR. See the README for
the current list of article features that remain on the SPA path.

## Positioning

papers sits between **Mintlify/GitBook** (fast SaaS, less control) and **Docusaurus/Starlight** (large ecosystems, heavier ops): own your UI, ship distinctive docs, grow into MDX and API reference without migrating later.
