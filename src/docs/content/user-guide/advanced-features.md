# Advanced Features

`papers` ships with more than plain Markdown rendering.

## Command Palette

The command palette merges:

- docs pages from the shared navigation tree
- built-in actions like theme changes
- inline FAQ answers
- Pagefind full-text results after a production build

## Interactive Map

The right rail can switch from `On This Page` to a graph view of the docs tree.

That gives readers a second navigation surface without leaving the page they are reading.

## Rich Markdown Blocks

The renderer supports:

- syntax-highlighted code blocks
- multi-tab code fences
- live HTML and CSS previews
- `ColorPalette` blocks
- wallet copy blocks rendered from semantic HTML

## Reader Preferences

The settings menu lets readers change:

- theme
- motion preference
- font family

The font control cycles through sans, mono, and serif on click.

## AI Exports

Builds can generate:

- `/llms.txt`
- `/llms-full.txt`

These give AI tools a cleaner entry point than crawling the full UI.

## Next Steps

- [Configuration](/docs/user-guide/configuration)
- [LLMs.txt](/llms)
