# Design System

The current visual system is intentionally minimal: monochrome, high-contrast, and token-driven.

## Theme Direction

- dark mode is the default
- the palette stays black, white, and gray in both themes
- code blocks use the same restrained monochrome approach as the shell

## Core Color Tokens

### Light Theme

```ColorPalette
{
  "colors": [
    {
      "name": "Background",
      "hex": "#FFFFFF",
      "rgb": "255, 255, 255",
      "usage": "Main app background"
    },
    {
      "name": "Text",
      "hex": "#111111",
      "rgb": "17, 17, 17",
      "usage": "Primary text and emphasis"
    },
    {
      "name": "Border",
      "hex": "#D4D4D8",
      "rgb": "212, 212, 216",
      "usage": "Unified borders and separators"
    }
  ]
}
```

### Dark Theme

```ColorPalette
{
  "colors": [
    {
      "name": "Background",
      "hex": "#090909",
      "rgb": "9, 9, 9",
      "usage": "Main app background"
    },
    {
      "name": "Text",
      "hex": "#FAFAFA",
      "rgb": "250, 250, 250",
      "usage": "Primary text and emphasis"
    },
    {
      "name": "Border",
      "hex": "#27272A",
      "rgb": "39, 39, 42",
      "usage": "Unified borders and separators"
    }
  ]
}
```

## Typography Tokens

The three font roles are:

- `--title-font` for headings and UI emphasis
- `--body-font` for body copy
- `--mono-font` for code, labels, and utility text

Readers can cycle fonts in settings: sans -> mono -> serif.

## Code Tokens

Code styling is controlled by dedicated variables in `src/globals.css`, including:

- `--code-bg`
- `--code-header-bg`
- `--code-border-color`
- `--code-text-color`
- `--code-muted-color`
- `--inline-code-bg`
- `--inline-code-border-color`

Use those instead of hardcoded syntax colors.

## Shell Tokens To Prefer

For most UI work, start with:

- `--background-color`
- `--card-color`
- `--text-color`
- `--muted-color`
- `--border-unified`
- `--control-bg`
- `--control-border-color`

## Wallet Block Pattern

The wallet block is a good example of a themed custom component:

```html
<code
  class="wallet-address"
  data-address="0x742d35Cc6634C0532925a3b844Bc9e7595f8fA6B"
  data-chain="eth"
>
  0x742d35Cc6634C0532925a3b844Bc9e7595f8fA6B
</code>
```

The runtime upgrades that into a copyable inline component that uses the same code and border tokens as the rest of the theme.

## Extension Rules

- use CSS variables instead of hardcoded colors
- check both light and dark mode
- respect reduced motion
- keep title sizes, body sizes, and code sizes aligned with the shared scale in `src/globals.css`
- prefer one shared token change over many per-component overrides

## Related Files

- `src/globals.css`
- `src/components/CodeBlock.tsx`
- `src/components/CodeBlock.module.css`
- `src/components/MarkdownRenderer.tsx`
- `src/providers/ThemeProvider.tsx`
