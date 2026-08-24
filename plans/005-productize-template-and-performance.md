# Plan 005: Productize the template and enforce performance budgets

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c0f4e52..HEAD -- src shared themes public scripts packages .github package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L (multi-day; includes a browser test layer and asset work)
- **Risk**: MED — generic branding and font cleanup touch the visible product
  surface, while browser tests and budgets add CI cost.
- **Depends on**: Plans 001–004
- **Category**: direction | dx | perf | tests | docs
- **Planned at**: commit `c0f4e52`, 2026-08-23

## Why this matters

The framework documentation says product instances should own branding and
that there is “no hardcoded credit,” but runtime code still selects a
`/boss-raid-pfp.png` logo, special-cases the title `phantasy`, and renders the
literal word `papers` in the homepage footer. The published `create-papers`
package also decides it found a local template merely because the consumer
directory has a `package.json`, which can copy the consumer project instead of
fetching the template. Finally, the repository carries about 65 MB of font
files, including large apparently unused Maple Mono files, and the Lighthouse
job has no configured server or URL. These issues make forks, releases, and
performance claims unreliable even after core correctness is fixed.

## Current state

- `FRAMEWORK.md:85-89` defines the framework/product boundary and says product
  copy must not land in papers. `FRAMEWORK.md:40` claims branding uses
  `brandingConfig` with no hardcoded credit.
- `shared/documentation-config.js:81-95` defines `brandingConfig`, including
  `productName` and optional `logo`.
- `src/components/DocsLogoMark.tsx:7-15` ignores `brandingConfig.logo` and
  uses `import.meta.env.VITE_DOCS_LOGO_URL || '/boss-raid-pfp.png'`.
- `src/components/homepage/HeroSection.tsx:24-55` special-cases the title
  string `phantasy` to select a font.
- `src/components/homepage/Footer.tsx:19-28` renders literal `papers` and
  `Open Source Documentation Framework` instead of reading the branding
  configuration.
- `themes/lorelei/theme.json:5,14` identifies the author as `Phantasy /
Lorelei` and loads remote Google Fonts; `themes/gba/theme.json:4-5`
  describes the palette as “Oblivion.” These may be intentional showcase
  themes, but they conflict with the generic-template boundary unless clearly
  marked as examples.
- `scripts/generate-doc-tree.mjs:9-14,35,87` contains an older hard-coded
  product vocabulary and is not wired by `package.json`; Plan 001 repairs a
  different tree-sync path. Confirm whether this file is dead before deleting
  or quarantining it.
- `packages/create-papers/index.mjs:8-10` derives `docsRoot` two directories
  above the package, and lines 142-146 treat any ancestor with a
  `package.json` as the local template. The published package contains only
  `index.mjs` according to `packages/create-papers/package.json:10-12`, so a
  consumer project can be misidentified as the template.
- `public/fonts` is approximately 65 MB. It contains three ~17–18 MB Maple
  Mono TTFs, a ~12 MB Noto Serif JP TTF, and smaller Mona/Hubot/DM Serif files.
  `src/globals.css:5-38` references Mona, Hubot, DM Serif, and Noto Serif,
  while no source CSS reference to Maple Mono was found.
- `scripts/resolve-theme.mjs:30-38` copies active-theme fonts into
  `public/fonts` but never removes stale copied assets or produces an asset
  ownership manifest.
- `.github/workflows/ci.yml:60-85` invokes Lighthouse CI after a build but
  provides no `url`, `startServerCommand`, or committed Lighthouse
  configuration.
- The audit browser check of `https://papers-docs.pages.dev/` found a live
  title and homepage identifying “Phantasy,” while the checked-in default
  `shared/documentation-config.js:129-145` identifies “papers.” The workflow
  deploys using `secrets.CLOUDFLARE_PROJECT_NAME`, so the live target is not
  proven to be the artifact produced by this checkout.

## Commands you will need

| Purpose     | Command                                              | Expected on success                                                           |
| ----------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| CLI package | `npm pack --dry-run --prefix packages/create-papers` | package contents and metadata are intentional                                 |
| Tests       | `npm test`                                           | all unit/architecture tests pass                                              |
| Types       | `npm run type-check`                                 | exit 0                                                                        |
| Build       | `npm run build`                                      | exit 0 for default and selected theme fixtures                                |
| Assets      | `npm run check:assets`                               | active assets are owned, within budget, and no stale fonts ship               |
| Browser     | `npx playwright test`                                | homepage/deep route/search/MDX/OpenAPI/theme tests pass                       |
| Lighthouse  | `npx lhci autorun` or the committed CI command       | configured URL starts and meets budgets                                       |
| Post-deploy | `DOCS_BASE_URL=... npm run postdeploy:check`         | live identity and canonical metadata match the build configuration            |
| Scope       | `git status --short`                                 | only Scope paths plus intentional generated/binary asset changes are modified |

## Scope

**In scope — the executor may modify or add only these paths:**

- `src/components/DocsLogoMark.tsx`,
  `src/components/homepage/HeroSection.tsx`,
  `src/components/homepage/Footer.tsx`, and the relevant shared branding type
  or config files.
- `packages/create-papers/index.mjs`,
  `packages/create-papers/package.json`, and focused CLI tests/fixtures.
- `scripts/generate-doc-tree.mjs` only if the dead/product-specific status is
  confirmed; otherwise add a deprecation note without rewriting it.
- `themes/lorelei/theme.json`, `themes/gba/theme.json`, and product-only public
  assets only after an explicit inventory proves they are not generic defaults.
- `scripts/resolve-theme.mjs`, `src/globals.css`, `public/fonts/**`, and a new
  `scripts/check-assets.mjs` or equivalent manifest/budget file.
- `.github/workflows/ci.yml`, a committed Lighthouse config, and a new
  Playwright config/spec set if the browser test layer is added.
- A new `scripts/postdeploy-smoke.mjs` plus `package.json` script for
  live-identity checks; it must accept the base URL through an environment
  variable and must not contain a product-specific expected name.
- `test/architecture.test.ts` and focused tests under `test/`.

**Out of scope:**

- Do not redesign the homepage, theme tokens, or docs layout. Make the
  existing config-driven surface generic and testable.
- Do not delete an asset merely because it is large. First prove ownership,
  references, theme activation, and replacement behavior; if an asset is
  product-owned, move it to an explicit example boundary or stop for approval.
- Do not make the generic framework assert the string `papers` or `Phantasy`
  as its only valid identity.
- Do not add SSR or a new hosting platform. Browser tests should exercise the
  static artifact already produced by the project.

## Git workflow

- Branch: `advisor/005-productize-and-performance` (or the operator's
  established convention).
- Match the repository's conventional commit style.
- Do not commit, push, or open a PR unless explicitly asked.

## Steps

### Step 1: Make branding configuration authoritative

Replace hardcoded runtime product behavior with the existing config contract:

- `DocsLogoMark` should use an explicit `VITE_DOCS_LOGO_URL` override when
  present, then `brandingConfig.logo` when configured, then a neutral local
  mark/text fallback that does not reference a product asset.
- `HeroSection` should derive any brand-font treatment from a config boolean
  or branding value, not a title comparison to `phantasy`.
- `Footer` should render `brandingConfig.productName`, configurable attribution,
  and copyright/notice data rather than literal `papers` copy.

Add a config fixture with a non-papers product name and logo and assert that
the rendered component props/markup use it. Keep the default visual result
close to the current papers theme unless the config says otherwise.

**Verify**: `npm test` → branding regression cases pass; `npm run type-check`
→ exit 0; `rg -n -i "phantasy|boss-raid-pfp|>papers<" src shared` → no
hardcoded runtime identity remains outside intentional docs/examples.

### Step 2: Make the starter CLI safe in both monorepo and published modes

Replace the `package.json` ancestor heuristic in
`packages/create-papers/index.mjs` with a marker-based local-template check.
The check must require multiple papers-template markers, such as
`shared/documentation-config.js`, `src/docs/content`, and `vite.config.ts`,
not merely `package.json`. A published `create-papers` installation should
fall back to the configured/default GitHub template; a checkout invoked from
the papers repository may use the local copy. Preserve the nonempty-target
guard and `--repo` override.

Factor the detection function so tests can cover a temporary ordinary Node
project, a real papers checkout, a custom `PAPERS_TEMPLATE_ROOT=local`, and a
published-package-like directory. Do not run a network download in unit tests.

**Verify**: CLI tests → ordinary consumer project is never copied as a local
template; `npm pack --dry-run --prefix packages/create-papers` → only intended
package files are listed; `node packages/create-papers/index.mjs --help` → exit
0 without network access.

### Step 3: Separate generic framework assets from showcase/product assets

Inventory every public image/font/theme asset and its references. For each
Phantasy/Oblivion/Lorelei-specific item, choose one explicit outcome:

- genericize the metadata/content;
- move it under an example/showcase namespace excluded from the default build;
- make it a documented optional theme asset; or
- remove it only after reference and package checks prove it is unused.

Review the unused `scripts/generate-doc-tree.mjs` before touching it. If no
package script or source import references it, remove it or mark it as a
deprecated legacy tool so it cannot be mistaken for the authoritative tree
generator. Do not merge its hard-coded product vocabulary into the active
tree.

Add a generic-fork smoke fixture that changes `brandingConfig.productName`,
homepage hero title, GitHub URL, and theme and then checks generated SEO/LLM
outputs for the fixture identity rather than repository product names.

**Verify**: `rg -n -i "phantasy|oblivion|boss raid|mercenary" src shared themes public scripts packages` → only documented showcase/sample locations remain; `npm run generate:seo -- --mode production && npm run generate:llms` → outputs reflect the configured fixture identity; `npm run build` → exit 0.

### Step 4: Ship only active, budgeted font assets

Define ownership for fonts in the theme manifest and base CSS. Update
`scripts/resolve-theme.mjs` so generated theme assets are copied into a
predictable owned location and stale generated files are removed by manifest,
without deleting user-owned files. Replace full TTFs with WOFF2/subset assets
where the selected typography permits it; keep CJK coverage as a deliberate
optional asset instead of forcing every default visitor to download it.

Remove known unused Maple Mono files only after the reference inventory and
generated-artifact check prove they are not needed by CSS, SVG, or a theme.
Update preload/font CSS declarations to point at the actual active files.

Add `scripts/check-assets.mjs` and `npm run check:assets` with budgets for:

- total default-theme font bytes;
- total per-theme font bytes;
- largest individual font/image;
- stale files not listed by the active-theme manifest.

Set an initial CI ceiling from the measured clean build, then lower it in the
same change by removing the known unused 52+ MB Maple Mono payload. The
default path should target a small, web-native font set (roughly low single
digit megabytes, not tens of megabytes); if CJK or showcase assets exceed the
budget, load them only when their feature/theme is enabled.

**Verify**: `npm run resolve:theme && npm run check:assets` → exit 0 for the
default theme; repeat for every registered theme in isolated temporary output;
`find public/fonts -type f -exec du -k {} + | sort -n` → no inactive generated
font remains; `npm run build` → exit 0.

### Step 5: Make Lighthouse and browser smoke real release signals

Add a committed Lighthouse configuration with an explicit local server
command and URLs for `/`, `/docs`, one deep docs route, and `/docs/llms` or the
OpenAPI route. Configure the CI job to build once, start the static preview,
wait for readiness, and run Lighthouse against that server. Set budgets for
performance, accessibility, best practices, SEO, and transfer size based on
the measured baseline, then tighten them after the font cleanup.

Add a browser smoke suite using the smallest maintained browser test tool the
repository can support. It should run against the built static preview and
cover:

- homepage and direct deep-doc reload;
- sidebar/command-palette navigation and Pagefind search;
- a Markdown/MDX page with callout/Tabs/CharacterNote and a Mermaid page;
- OpenAPI page and alternate spec selection;
- theme switch and mobile-width shell behavior;
- canonical/404 behavior and no uncaught page errors.

Keep network-dependent external fonts/specs mocked or use local fixtures in
the browser suite; production-origin checks belong to Plan 004/post-deploy.

**Verify**: `npx playwright test` → all browser cases pass against the local
static preview; the configured Lighthouse command → exit 0 and reports the
expected URLs; CI job logs show a started server rather than an empty default
Lighthouse run.

### Step 6: Prove deployed identity after every trusted deploy

Add `scripts/postdeploy-smoke.mjs` that accepts `DOCS_BASE_URL` and optionally
build metadata. It must request the homepage, a deep docs route, `/robots.txt`,
`/sitemap.xml`, `/llms.txt`, and one OpenAPI route, then assert:

- HTTP success and expected content type;
- the configured site name/canonical base URL is present;
- the configured GitHub URL is present where the footer/source link is
  expected;
- the served docs index contains a known path from the build;
- no known other-product identity is present in the generated metadata.

Wire this check only into a trusted deployment context after the actual deploy
URL/project is known. Align `wrangler.toml`, the workflow project setting, and
the documented production URL; do not silently accept
`papers-docs.pages.dev` if it serves a different product.

**Verify**: `DOCS_BASE_URL=<trusted-preview> npm run postdeploy:check` → exit 0
for the matching artifact; a fixture/live target with a mismatched site name
or docs index → exit 1 naming the failed identity check without exposing
secrets.

## Test plan

- Add config-driven branding tests for a non-default product name/logo and
  empty-logo fallback.
- Add CLI marker-detection tests with temporary directories; do not test by
  copying the entire repository.
- Add asset-manifest/budget tests for active and stale font files.
- Add Playwright cases for direct reload, search, Mermaid/MDX, OpenAPI, theme,
  404, and browser-console errors.
- Add post-deploy HTTP tests using a local fixture server so CI does not depend
  on an external production URL for unit coverage.

## Done criteria

- [ ] A fork that changes `brandingConfig` and `VITE_SITE_*` does not render
      papers/Phantasy-specific runtime copy or assets.
- [ ] `create-papers` detects a local template by markers and never copies an
      arbitrary consumer project merely because it has `package.json`.
- [ ] Showcase/product assets are explicitly bounded and no dead product
      generator is mistaken for the active docs-tree source.
- [ ] Default and per-theme font assets are manifest-owned, stale assets are
      rejected, and the default build no longer ships the known unused Maple Mono
      payload.
- [ ] `npm run check:assets`, `npm test`, `npm run type-check`, `npm run build`,
      browser smoke, and Lighthouse pass with committed budgets.
- [ ] Trusted deploys run an identity/content smoke check and the configured
      Cloudflare project/URL matches the artifact's site identity.
- [ ] `plans/README.md` status row is updated to `DONE` or `BLOCKED` with a
      reason.

## STOP conditions

Stop and report instead of improvising if:

- The branding change requires a new product/content API rather than using the
  existing `brandingConfig`; write a small design decision first.
- An asset is referenced by an external consumer or cannot be classified as
  framework-owned, showcase-owned, or product-owned.
- Font subsetting removes required language coverage or changes the visual
  identity; preserve the asset and report the measured budget conflict.
- The published CLI cannot fetch its default repository in the supported
  release environment; do not silently package a partial template.
- Browser/Lighthouse failures are caused by a missing host/credential or an
  unavailable external origin; use local fixtures and report the external
  dependency rather than weakening the test.
- The live URL still serves a different product after a trusted deployment;
  stop the release and escalate project/secret ownership.

## Maintenance notes

- Treat `brandingConfig`, `.env.example`, generated SEO/LLM output, and the
  post-deploy identity check as one contract; update them together.
- Review every new theme for font bytes, remote origins, and asset ownership.
- Keep browser smoke focused on user-visible critical paths; use unit tests for
  parser/route logic so CI time does not grow without bound.
- Reassess Fumadocs after this plan and Plan 003. If type-safe MDX collections,
  page-tree conventions, link validation, and OpenAPI generation still cost
  more to maintain than adopting them, run a separate migration spike instead
  of incrementally recreating the entire ecosystem.
