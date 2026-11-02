# Themes

papers ships with installable themes under `themes/`. Themes override color, typography, radius, and optional icon sets without forking the docs shell.

## Built-in themes

| ID        | Name     | Notes                                         |
| --------- | -------- | --------------------------------------------- |
| `default` | Default  | Light/dark toggle enabled                     |
| `gba`     | Game Boy | 1-bit green palette, square UI, pixelarticons |

## Switch themes locally

```sh
npm run papers:theme list
npm run papers:theme use gba
npm run resolve:theme
npm run dev
```

Set `VITE_PAPERS_THEME` in `.env.local` or your host build environment.

## Create a theme

1. Add `themes/<id>/theme.json` and `themes/<id>/tokens.css`.
2. Register the theme in `themes/registry.json`.
3. Run `npm run papers:theme use <id>` and verify `npm run build`.

See [CONTRIBUTING_THEMES.md](https://github.com/thomasjvu/papers/blob/main/CONTRIBUTING_THEMES.md) for the full contract.

## Navigation typography

Use `chromeConfig.navigationFont` to select `'mono'` or `'body'` for sidebar
links and headings. The shell resolves `--navigation-font` from your theme's
`--mono-font` or `--body-font`; reader content-font preferences do not change it.
Leave the option unset to keep the original typography of each sidebar variant.
See [Navigation Font](../user-guide/configuration.md#navigation-font) for an example.

## Sidebar surfaces

Set sidebar tokens on `.docs-sidebar` to give navigation its own palette. The
panel reads `--sidebar-bg-color` in both light and dark modes. Tree and grouped
navigation read the text, hover, and active tokens below. Icons follow the item
text color. Active items keep their selection colors while hovered.

```css
.docs-sidebar {
  --sidebar-bg-color: #e8eef5;
  --sidebar-text-color: #182330;
  --sidebar-hover-bg-color: #d3deeb;
  --sidebar-hover-text-color: #182330;
  --sidebar-active-bg-color: #182330;
  --sidebar-active-text-color: #ffffff;
}

.dark .docs-sidebar {
  --sidebar-bg-color: #182330;
  --sidebar-text-color: #e8eef5;
  --sidebar-hover-bg-color: #293d52;
  --sidebar-hover-text-color: #ffffff;
  --sidebar-active-bg-color: #e8eef5;
  --sidebar-active-text-color: #182330;
}
```

These tokens are optional. Without them the panel uses `--card-color`, and
navigation keeps its built-in colors. Put the rules in your theme's `tokens.css`;
no component fork or `!important` override is needed.

Existing sites receive the fix through `npx @thomasjvu/papers@latest upgrade`
after the release is published. The upgrader preserves site-owned theme rules
and merges framework changes. Resolve any reported local component conflicts
before building the site.

## Code and table frames

Code blocks draw one outer frame. The nested syntax-highlighter `pre` has no
border, radius, or shadow, so theme code-block corners apply once. MDX fallback
code fences follow the same rule. Untitled code blocks keep the line-number and
copy controls together at the right of the toolbar.

Tables keep the theme's default `--papers-radius-md` corners. To choose square
table scroll wrappers without changing other surfaces, set this in `tokens.css`:

```css
.doc-content {
  --table-wrap-radius: 0;
}
```

The wrapper still scrolls horizontally on narrow screens. This token changes
only its corners; it adds no extra border or product-specific colors.

## Related files

- `scripts/resolve-theme.mjs` — writes `src/theme-active.css` and generated manifest
- `src/lib/papersTheme.ts` — runtime theme features (toggle visibility, default mode)
- `src/globals.css` — structural tokens; themes override palette vars in `tokens.css`
