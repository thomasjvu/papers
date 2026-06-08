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

## Related files

- `scripts/resolve-theme.mjs` — writes `src/theme-active.css` and generated manifest
- `src/lib/papersTheme.ts` — runtime theme features (toggle visibility, default mode)
- `src/globals.css` — structural tokens; themes override palette vars in `tokens.css`
