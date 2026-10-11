# Tailwind Integration

Papers is built with Tailwind CSS 4 (`@tailwindcss/vite`). This page explains the CSS
contract so a downstream Tailwind 4 site can embed or restyle Papers without clashes.

## Cascade Layers

`src/globals.css` declares the layer order once:

```css
@layer theme, base, components, papers-base, utilities, papers;
```

| Layer         | Contents                                                        |
| ------------- | --------------------------------------------------------------- |
| `theme`       | Tailwind theme variables                                        |
| `base`        | Tailwind preflight                                              |
| `components`  | Tailwind components, KaTeX styles                               |
| `papers-base` | Papers element defaults (`html`, `body`, `a`, `button`, `code`) |
| `utilities`   | Tailwind utilities                                              |
| `papers`      | Papers components, CSS modules and theme tokens                 |

A utility class beats Papers' element defaults, and Papers' component classes beat
utilities (the same result as Tailwind 3). To override Papers from a consumer site:

- write **unlayered** CSS, which beats every layer, or
- declare a later layer: `@layer papers, site;` and put your rules in `@layer site`, or
- use an important utility on a single element: `class="p-8!"`.

## Design Tokens

Papers' tokens never use Tailwind 4's theme namespaces. Type, radius, shadow and
line-height tokens are prefixed:

| Papers token              | Purpose                     |
| ------------------------- | --------------------------- |
| `--papers-text-sm` ...    | Type scale (`2xs` to `5xl`) |
| `--papers-text-color`     | Body text color             |
| `--papers-text-secondary` | Secondary text color        |
| `--papers-leading-*`      | Line heights                |
| `--papers-radius-*`       | Border radii                |
| `--papers-shadow-*`       | Shadows                     |

So a site's `@theme { --text-sm: ...; --radius-lg: ...; --shadow-md: ... }` does not
change Papers, and `--text-*: initial` or `--color-*: initial` resets do not remove Papers
tokens. Other tokens (`--primary-color`, `--surface-color`, `--space-*`, `--code-*`) are
already outside Tailwind's namespaces.

> [!WARNING]
> Custom themes written before this change must rename `--text-*`, `--leading-*`,
> `--radius-*` and `--shadow-*` tokens to the `--papers-` prefixed names.

## Breakpoints

Papers uses Tailwind 4's default rem breakpoints (`sm` 40rem, `md` 48rem, `lg` 64rem,
`xl` 80rem, `2xl` 96rem), and its own media queries use the same rem values with range
syntax (for example `@media (width < 48rem)`). In media queries `rem` is always the
browser default (16px), so breakpoints stay at 640, 768, 1024, 1280 and 1536px even
though Papers sets `html { font-size: 90% }`.

Do not mix units: Tailwind 4 sorts breakpoints and requires every `--breakpoint-*` to
use the same unit. If your site customizes breakpoints, keep them in `rem`.

Because property `rem` values _do_ scale with the root font size, Papers uses
`.papers-container` (px max-widths) instead of Tailwind's `container`.

## Embedding In A Tailwind 4 Site

```css
/* app.css */
@layer theme, base, components, papers-base, utilities, papers, site;
@import 'tailwindcss';
@source '../node_modules/papers/src';

@layer site {
  :root {
    --primary-color: #0a7cff;
  }
}
```

Declare the layer order before any import so both stylesheets agree on it. Point
`@source` at the Papers sources so Tailwind generates the utilities Papers uses.

## Math And KaTeX

KaTeX CSS is imported into the `components` layer, so Papers' math styles apply on top.
If your site pins KaTeX with npm `overrides`, Papers accepts `^0.16.47 || ^0.18.10`.
