# Plan 022: Reduce initial docs JavaScript without losing interaction polish

> **Executor instructions**: Measure the current route graph first. Preserve
> the current motion behavior, reduced-motion behavior, keyboard/focus states,
> and mobile sidebar behavior. Do not replace a real interaction with a static
> screenshot or lower a Lighthouse assertion. If a progressive-loading design
> causes visible layout shift or loses an accessibility state, revert it and
> report the measured limitation.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/020-optimize-optional-bundles-and-lcp.md
- **Category**: perf | accessibility | ui
- **Status**: BLOCKED — preserving shell exit timing requires a broader motion/provider refactor
- **Planned at**: commit `a3d207c`, 2026-08-25

## Why this matters

The clean-copy deep-doc Lighthouse trace attributes about 38.8 kB of initial
JavaScript to `vendor-motion`, with additional main-thread work from the docs
shell and Markdown renderer. The runtime is pulled into the first docs route
by static imports in `DocumentationPage`, `ContentRenderer`, and
`MarkdownRenderer`, plus shell controls such as `FileTree` and `SettingsMenu`.
The optional graph and command-palette boundaries already exist, so this slice
should make only the first-route motion runtime progressive or replace simple
entrance/hover effects with CSS/DOM behavior.

## Measured outcome — 2026-08-25

An isolated executor confirmed that `framer-motion` is still pulled into the
initial shell by `DocumentationPage`, `Navigation`, `FileTree`, `SettingsMenu`,
`ThemeSwitcher`, `MotionToggle`, `ContentRenderer`, and `MarkdownRenderer`.
The command palette is already route-lazy. A partial CSS swap could remove a
few imports, but preserving current open/close exit timing and the shell mount
lifecycle would require a broader provider/runtime change than this bounded
plan permits. The executor made no source changes and stopped rather than
shipping a partial reduction that would either leave the dependency in place
or regress interaction polish. The next safe experiment is a maintained
`LazyMotion`/platform-runtime replacement with an explicitly expanded scope.

## Current state

- `ContentRenderer.tsx` uses motion for tag and footer fades.
- `DocumentationPage.tsx` uses `AnimatePresence` for the mobile sidebar and
  `motion.*` for shell transitions and controls.
- `MarkdownRenderer.tsx` uses motion for rendered content effects and already
  lazy-loads Mermaid separately.
- `FileTree.tsx` and `SettingsMenu.tsx` are part of the initial docs shell and
  import `framer-motion` directly.
- The reduced-motion preference is already exposed by the theme layer and
  browser coverage includes reduced-motion behavior; preserve both.
- `DocumentationGraph`, Scalar, Mermaid, syntax highlighting, and Pagefind
  must remain interaction/route lazy.

## Scope

Modify only the minimum files needed from:

- `src/components/ContentRenderer.tsx`
- `src/components/docs/DocumentationPage.tsx`
- `src/components/MarkdownRenderer.tsx`
- `src/components/FileTree.tsx`
- `src/components/SettingsMenu.tsx`
- `src/components/Navigation.tsx`
- `src/components/ThemeSwitcher.tsx`
- `src/components/MotionToggle.tsx`
- `src/components/CommandPalette/OptimizedCommandPalette.tsx`
- `src/components/CommandPalette/SearchResult.tsx`
- matching CSS modules/global styles
- `vite.config.ts`
- `test/architecture.test.ts`
- `test/browser/docs.spec.mjs`

Do not change route paths, HTML artifacts, CSP, font assets, optional-feature
boundaries, content rendering semantics, or supported interactions. Do not
add another animation dependency or move motion code to a CDN.

## Steps

### Step 1: Reproduce the initial graph and behavior baseline

Capture the exact `vendor-motion` size, the route chunks that import it, initial
requests for homepage/deep docs/OpenAPI, and the current browser behavior for
mobile sidebar, theme/settings controls, content entry, focus, and reduced
motion. Use the existing clean-copy/Lighthouse harness; do not benchmark a
dirty or stale `dist` directory.

### Step 2: Choose the smallest safe reduction

Prefer CSS transitions/keyframes and native button states for simple opacity,
transform, hover, and focus effects. For stateful `AnimatePresence` behavior,
consider a small route-lazy motion island or a maintained lightweight entry
only if it preserves exit timing and does not add a second runtime. Keep the
visible shell stable while async code loads. Do not blindly replace every
`motion.*` element; prove the behavior at the browser boundary.

### Step 3: Preserve accessibility and reduced motion

Verify keyboard focus, Escape/close behavior, mobile overlay semantics,
screen-reader labels, and `prefers-reduced-motion`. Ensure CSS fallbacks do not
leave hidden controls focusable or remove the dialog/aside relationships.

### Step 4: Add graph regression coverage

Extend architecture or browser checks only enough to prevent `framer-motion`
from becoming an eager dependency of routes that do not use animation and to
prove the docs shell remains usable. Keep asset classification based on actual
route requests, not filename tricks.

### Step 5: Verify real improvement

Run the full ladder: tests, lint, type-check, format, clean production build,
release checks, browser tests without retries, and the four-route Lighthouse
run. Compare `vendor-motion` bytes, initial transfer, FCP/LCP/TBT/CLS, and the
mobile/reduced-motion browser results. Stop if the graph is not smaller or
behavior regresses.

## Done criteria

- [ ] Initial docs JavaScript and/or main-thread cost decreases in a repeatable
      clean-copy measurement.
- [ ] Motion behavior, reduced motion, focus, mobile shell, and theme/settings
      interactions remain covered and pass.
- [ ] Optional Scalar, Mermaid, syntax, graph, and Pagefind boundaries remain
      lazy.
- [ ] SEO, accessibility, best-practices, release, browser, and security gates
      remain green without weakened assertions.
- [ ] No files outside Scope are modified.

## STOP conditions

- The only reduction removes visible interaction polish, accessibility state,
  reduced-motion support, or requires a new remote/runtime dependency.
- The initial graph does not improve after a controlled experiment.
- Browser, release, or Lighthouse results regress twice.
