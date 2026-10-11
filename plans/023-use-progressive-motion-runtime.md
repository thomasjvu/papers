# Plan 023: Use a progressive motion runtime for the docs shell

> **Executor instructions**: This is an experiment, not permission to remove
> interaction behavior. Measure the current and candidate graphs first. Keep
> the existing animation, exit, reduced-motion, focus, and mobile semantics.
> If the maintained `LazyMotion`/`m` entry does not materially reduce the
> initial graph or cannot support the current feature set, revert and report
> the exact limitation.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: plans/022-defer-docs-motion-runtime.md
- **Category**: perf | ui | maintainability
- **Status**: TODO
- **Planned at**: commit `a3d207c`, 2026-08-25

## Why this matters

Plan 022 confirmed that the docs shell has eight eager `framer-motion`
imports and that a partial CSS swap cannot preserve the current exit timing
within its bounded scope. The installed maintained package exposes a
progressive `LazyMotion`/`m` surface and a `domAnimation` feature set. That is
the next credible way to reduce the roughly 38.8 kB initial `vendor-motion`
chunk while retaining declarative transitions, but it must be proven against
the actual shell and graph components rather than assumed from package docs.

## Scope

Modify only the minimum files needed from:

- `src/App.tsx`
- `src/providers/CommandPaletteProvider.tsx`
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
- `src/components/DocumentationGraph/` motion components if the shared
  provider requires the same element type
- `src/pages/DesignBookPage.tsx` and `src/components/FontSelector.tsx` only if
  their route-lazy motion behavior must use the shared provider
- `vite.config.ts`
- `test/architecture.test.ts`
- `test/browser/docs.spec.mjs`
- `package.json` and `package-lock.json` only if the maintained package entry
  or a direct, already-owned dependency must be adjusted

Do not change routes, generated HTML/artifacts, CSP, fonts, content semantics,
Scalar/Mermaid/syntax/Pagefind boundaries, or add another animation library or
remote dependency. Do not weaken Lighthouse assertions.

## Steps

### Step 1: Baseline all motion features

Inventory `motion` props actually used: animation/exit, `AnimatePresence`,
hover/tap, SVG graph motion, layout/projection, drag, and any custom feature.
Capture initial and interaction-triggered network requests, `vendor-motion`
bytes, and browser behavior for sidebar close/escape, theme/settings controls,
command palette, graph expansion, reduced motion, and keyboard focus.

### Step 2: Prove the smallest package entry

Build a disposable candidate using the installed package's supported
`LazyMotion`, `m`, and `domAnimation` exports. Load the feature definition at
the application boundary only if that preserves the first paint and does not
turn an optional graph/control into an initial request. Use `domMax` only when
the inventory proves layout/drag/projection is required, and measure its cost.
Do not mix in unrelated CSS redesign or component rewrites.

### Step 3: Migrate and preserve boundaries

Convert only the components that can use the shared progressive runtime.
Ensure route-lazy graph/design-book modules do not become eager through the
provider. Preserve `AnimatePresence` exit completion, DOM roles, focus order,
mobile overlay dismissal, theme switching, and reduced-motion behavior.

### Step 4: Add regression coverage

Add architecture assertions that the full root `framer-motion` entry is not
pulled into initial routes when the progressive entry is intended. Extend
browser tests for mobile/sidebar exit, reduced motion, theme/settings,
keyboard focus, command palette, and graph/design-book lazy loading as needed.

### Step 5: Run the complete ladder

Run npm ci, tests, lint, type-check, format, clean production build with
explicit build identity, release checks, browser tests without retries, and
the four-route Lighthouse run. Compare initial requests, transfer bytes,
FCP/LCP/TBT/CLS, and all interaction behavior. Stop on any regression or if
the candidate does not materially shrink the initial graph.

## Done criteria

- [ ] Initial docs `vendor-motion`/main-thread cost is materially lower in a
      repeatable clean-copy measurement.
- [ ] Current animation/exit, reduced-motion, keyboard, mobile, theme,
      command-palette, and graph behavior remains covered and passes.
- [ ] Optional route/feature boundaries remain optional and initial route
      requests do not grow.
- [ ] Full release/browser/Lighthouse gates pass without lowered assertions.
- [ ] Only scoped files changed and package ownership remains clear.

## STOP conditions

- `domAnimation` lacks a feature currently used by the product, and `domMax`
  does not produce a meaningful initial saving.
- The feature definition becomes an eager network request that worsens LCP,
  causes layout shift, or breaks direct reload behavior.
- Any animation, accessibility, reduced-motion, or keyboard regression appears.
- The candidate needs a new remote origin, an unmaintained dependency, or a
  threshold change to look successful.
