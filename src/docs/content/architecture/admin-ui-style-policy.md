# Admin UI Style Policy

This is the style contract for Phantasy's admin UI.

Reference docs:

- [Repository Standards](./repo-standards.md)
- [Admin UI Style Policy](./admin-ui-style-policy.md)
- [Admin UI Design System](./admin-ui-design-system.md)

## Goal

Make the UI easier to change, easier to reason about, and less dependent on one-off styling decisions hidden inside TSX.

The desired shape is:

- shared tokens in `src/admin-ui/styles/theme.css`
- shared primitives in `src/admin-ui/components/common/`
- feature-local CSS modules next to the feature they style
- inline styles only when the value is genuinely runtime-driven

## Rules

1. Use CSS modules for component styling.

2. Use theme tokens instead of raw presentation values whenever possible.

- Prefer `var(--bg-*)`, `var(--text-*)`, `var(--border-*)`, `var(--accent-*)`
- Prefer `var(--font-primary)` and `var(--font-mono)`

3. Shared patterns belong in shared modules.

- Good: `src/admin-ui/components/common/Buttons.module.css`
- Good: `src/admin-ui/components/common/MarketplaceSurface.module.css`
- Good: `src/admin-ui/components/common/SurfacePrimitives.module.css`
- Bad: importing `PluginsTab.module.css` into an unrelated page because it already has a convenient button class

When the shell already supports the pattern, prefer that over cloning CSS.
Example: use `PageTemplate` sub-tabs for simple installed/library switching
instead of borrowing another tab's switcher styles.

4. Inline styles are allowed only for dynamic values that cannot be expressed statically.

Allowed examples:

- runtime positioning like `top`, `left`, `bottom`
- CSS custom property injection on the `style` prop for values such as `"--duration"`
- canvas/SVG sizing
- image aspect-ratio or measured dimensions

Not allowed as a default:

- static spacing
- static colors
- static borders
- static typography
- reusable card, grid, toolbar, or badge styling

5. Fonts are centralized.

- Page-level titles rendered by shared headers use `var(--font-display)` for the BBH Bartle voice.
- Sans UI copy, buttons, labels, and workspace-launcher controls use `var(--font-primary)`.
- Code, ids, hashes, counters, and diagnostics use `var(--font-mono)`.
- Do not hardcode ad hoc font stacks inside product surfaces. Use the shared tokens instead, even on buttons and custom controls.

6. Keep ownership local.

- Feature components should use their own CSS module or a shared common module
- If two features need the same class, promote it into `components/common/`

## Naming

- React components: `PascalCase.tsx`
- CSS modules: `PascalCase.module.css`
- CSS module classes: `camelCase`

## Enforcement

`bun run validate:standards` enforces this policy in several ways:

- repo-wide non-regression checks for legacy inline-style debt
- clean-room checks on shared shell primitives and core dashboard components
- file-size budget freezes for the largest admin UI surfaces
- font-token enforcement for component CSS

The broader standards contract is documented in [Repository Standards](./repo-standards.md).

The enforcement bar will keep tightening. New code should not add to the exception count.
