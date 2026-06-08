# Contributing Themes

papers supports installable visual themes under `themes/`. Each theme is a folder with a manifest and token stylesheet.

## Theme layout

```
themes/
  registry.json
  your-theme/
    theme.json
    tokens.css
```

## `theme.json`

| Field                      | Required | Description                                           |
| -------------------------- | -------- | ----------------------------------------------------- |
| `id`                       | yes      | Stable slug used by `VITE_PAPERS_THEME`               |
| `name`                     | yes      | Display name                                          |
| `description`              | yes      | Short summary                                         |
| `author`                   | yes      | Person or project                                     |
| `css`                      | yes      | Token file name (usually `tokens.css`)                |
| `iconSet`                  | no       | Iconify collection prefix for `generate:icons`        |
| `defaultColorMode`         | no       | `dark` or `light`                                     |
| `features.lightDarkToggle` | no       | Hide theme toggle when `false`                        |
| `fonts`                    | no       | Google or local font links injected into `index.html` |

## Install a theme locally

```sh
npm run papers:theme list
npm run papers:theme use gba
npm run resolve:theme
npm run dev
```

Set `VITE_PAPERS_THEME=your-theme` in `.env.local` or your host build environment.

## Token guidelines

- Override papers CSS variables in `tokens.css` (`--background-color`, `--text-color`, `--radius-*`, fonts, etc.).
- Keep structural spacing and typography scale in `src/globals.css` unless your theme needs different rhythm.
- Register the theme in `themes/registry.json`.
- If you introduce a new icon set, add the `@iconify-json/<set>` dependency and set `iconSet` in `theme.json`.

## Upstreaming

1. Fork [thomasjvu/papers](https://github.com/thomasjvu/papers).
2. Add your theme under `themes/<id>/`.
3. Register it in `themes/registry.json`.
4. Run `npm test`, `npm run build`, and `npm run release:check`.
5. Open a PR with screenshots of the homepage and a docs page.
