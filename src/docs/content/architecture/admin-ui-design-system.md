# Admin UI Design System

This is the shared token and primitive contract for Phantasy's admin UI.

Use this with [Admin UI Style Policy](./admin-ui-style-policy.md). The style policy says how code should be written; this document says which visual decisions are shared and themeable.

## Typography

- `--font-display`: page titles and major workspace headings. This stays `BBH Bartle`.
- `--font-primary`: controls, body copy, labels, tabs, and workspace launchers. This stays `Zed Sans`.
- `--font-mono`: counters, ids, diagnostics, logs, code, and schedules. This stays `Zed Mono`.

Recommended sizes:

- `--font-size-xs`: helper text, pills, timestamps
- `--font-size-sm`: labels, compact buttons, secondary nav
- `--font-size-base`: normal form inputs and body copy
- `--font-size-lg` to `--font-size-3xl`: cards, page sections, dashboards

## Color Tokens

Core palette:

- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--accent-primary`, `--accent-hover`
- `--border-color`, `--border-light`
- `--success`, `--warning`, `--danger`, `--info`

Surface aliases for feature code:

- `--surface-canvas`: main app canvas
- `--surface-muted`: subdued panel backgrounds
- `--surface-raised`: elevated cards and controls
- `--surface-overlay`: translucent overlays and dashboard shells
- `--surface-hover`: shared hover fill
- `--surface-outline`: default surface border

Interactive aliases:

- `--interactive-primary-bg`, `--interactive-primary-fg`, `--interactive-primary-border`
- `--interactive-primary-bg-hover`
- `--interactive-secondary-bg`, `--interactive-secondary-fg`, `--interactive-secondary-border`
- `--interactive-secondary-bg-hover`, `--interactive-secondary-border-hover`

These aliases should be used by shared buttons and workspace actions so themes can restyle the app without chasing every module.

## Layout Tokens

- `--spacing-xs` through `--spacing-xxl`
- `--radius-sm` through `--radius-xl`
- `--panel-padding`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`

Rules:

- Use spacing tokens instead of literal `px` for gaps and padding unless a measurement is tightly tied to media or canvas geometry.
- Use radius tokens for cards and controls so flat/minimal and more expressive themes can swap shape globally.

## Motion

Shared motion tokens:

- `--motion-duration-enter`
- `--motion-duration-exit`
- `--motion-stagger-step`
- `--motion-stagger-step-slow`
- `--motion-ease-standard`
- `--motion-ease-emphasis`

Rules:

- Prefer short reveal animations with staggered delays for dashboards and status surfaces.
- Prefer CSS custom property injection for runtime stagger values instead of hardcoded inline animation strings.
- Avoid glassy pulse spam and simultaneous dashboard animations unless the product surface explicitly calls for it.

## Shared Primitives

Core primitives already in use:

- `PageTemplate` and `PageHeader` for page framing
- `Button` and `Buttons.module.css` for shared action treatments
- `CornerBracketCard` and `ThemedCard` for elevated surfaces
- `CyberInput`, `CyberSelect`, `CyberpunkInput`, `CyberpunkTextarea`, `CyberpunkCheckbox` for forms
- `SectionHeader`, `ListDetailTemplate`, `TileList`, `SurfacePrimitives.module.css` for repeated shell patterns

Rules:

- If a visual pattern appears in more than one workspace, promote it into `src/admin-ui/components/common/`.
- If a feature needs custom styling, start from tokens and primitives before inventing a one-off surface.

## Themeability

Users should be able to mod the app by overriding shared CSS custom properties, not by editing dozens of components.

Preferred override order:

1. Override tokens in `src/admin-ui/styles/theme.css`
2. Keep feature modules consuming alias tokens, not literal colors
3. Add new tokens before adding repeated raw values

Practical guidance:

- New top-level surfaces should use alias tokens such as `--surface-*` and `--interactive-*`.
- Workspace-specific accents should still map back to shared tokens.
- Theme packages should target tokens first and component CSS second.
