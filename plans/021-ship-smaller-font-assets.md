# Plan 021: Ship smaller font assets without changing the visual system

> **Executor instructions**: Follow this plan step by step and record the
> measured before/after transfer sizes and Lighthouse results. Do not replace
> the selected typefaces, subset away required glyphs, or fetch fonts from a
> runtime CDN. If a reproducible WOFF2 source or conversion path cannot be
> established, stop with evidence rather than checking in an opaque binary.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/020-optimize-optional-bundles-and-lcp.md
- **Category**: perf | assets | release
- **Status**: BLOCKED — no reproducible licensed WOFF2 source or conversion path is present
- **Planned at**: commit `a3d207c`, 2026-08-25

## Why this matters

The clean-copy Lighthouse run shows that the initial route transfer is
dominated by two local WOFF files: Mona Sans and Hubot Sans are each roughly
207 kB. They are requested on the homepage and docs routes before optional
Scalar, Mermaid, or syntax-highlighting code. This is a real LCP/first-load
cost, not a Vite warning to hide. The repository also retains TTF fallbacks,
so any optimization must keep the current visual system and browser fallback
contract intact.

## Measured outcome — 2026-08-25

An isolated executor inspected the repository and stopped before changing
assets. `public/fonts/` contains only `.ttf` and `.woff` files, with no
checked-in WOFF2. The WOFF and TTF files have matching family/style/charset
metadata, but the repository has no pinned conversion tool, upstream asset
provenance record, or license metadata that would justify generating and
shipping a new binary. The current `src/globals.css` WOFF-first/TTF-fallback
contract remains unchanged. This plan is blocked on a provenance-safe asset
source or build-time conversion decision; no opaque binary or runtime CDN was
introduced.

## Current state

- `src/globals.css` declares WOFF first and TTF fallback for Mona Sans, Hubot
  Sans, and DM Serif Display.
- `public/fonts/` contains the checked-in WOFF and TTF assets; there is no
  checked-in WOFF2 asset today.
- `scripts/resolve-theme.mjs`, `scripts/check-assets.mjs`, and
  `public/papers-theme-assets.json` participate in theme asset resolution and
  validation. Generated theme metadata must be regenerated, not hand-edited.
- The current asset policy allows WOFF/WOFF2/TTF/OTF and enforces local asset
  ownership. Preserve those checks and the existing no-remote-font CSP.

## Scope

Modify only the minimum files needed from:

- `src/globals.css`
- `public/fonts/` font assets and their license/attribution metadata, if the
  repository already owns or can reproducibly derive them
- `scripts/resolve-theme.mjs`
- `scripts/check-assets.mjs`
- `public/papers-theme-assets.json` only through its generator
- `test/architecture.test.ts`
- `package.json` and `package-lock.json` only if a documented, reproducible
  build-time font conversion/check is required
- the relevant source/theme documentation if the supported asset contract
  changes

Do not change font families, weights, routes, HTML artifact names, CSP, theme
semantics, or runtime remote origins. Do not remove TTF fallback until browser
coverage proves the intended support policy. Do not add a runtime CDN.

## Steps

### Step 1: Establish the exact baseline

Record each font's format, byte size, family/weight/style metadata, glyph
coverage, and license/attribution. Confirm which fonts are requested on `/`, a
deep docs route, and OpenAPI. Capture the current Lighthouse transfer and LCP
metrics from a clean production build.

### Step 2: Evaluate a reproducible smaller format

Prefer an official WOFF2 asset from the font's existing upstream/license or a
reproducible, pinned conversion step that can run in CI without downloading
unreviewed input. Compare glyph coverage and rendered screenshots at normal,
bold, italic, code, and non-Latin sample text used by the project. Preserve
the current WOFF/TTF fallback if compatibility requires it, but make the
smaller format the first source when it is verified.

If conversion requires a tool or dependency that cannot be pinned and run by
contributors, stop and report the limitation. Do not commit a binary with no
provenance.

### Step 3: Wire and validate the asset contract

Update the font-face source order and the resolver/asset checks only as needed.
Ensure theme resolution, release artifact checks, and package smoke tests
include the new files and do not emit stale references. Keep font-display and
preload behavior intentional; do not preload every font merely to improve a
single Lighthouse run.

### Step 4: Verify the real improvement

Run the full verification ladder, including clean-copy build, release smoke,
browser tests, and Lighthouse. Compare route transfer, font request bytes,
FCP/LCP, CLS, accessibility, SEO, and best-practices. The change is useful
only if the initial route graph is smaller without a visual/accessibility
regression.

## Done criteria

- [ ] All optimized font assets have checked-in provenance/license coverage.
- [ ] Glyph coverage and visual rendering are preserved for supported text.
- [ ] Initial homepage/docs/OpenAPI transfer and font bytes decrease in a
      repeatable clean-copy measurement.
- [ ] Asset/theme/release checks and browser/Lighthouse gates pass without
      lowered assertions or new remote origins.
- [ ] No unrelated source or generated files are modified.

## STOP conditions

- The only viable path requires unpinned tooling, an unlicensed asset, a
  runtime CDN, or dropping required glyphs/fallbacks.
- Any route, theme, accessibility, SEO, or CSP regression appears.
- The measured byte/LCP improvement is not repeatable.
