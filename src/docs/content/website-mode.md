# Website Modes

Phantasy keeps content, themes, and public APIs in one system, but lets you choose how much of the built-in website is exposed at runtime.

## Modes

| Mode       | Embedded HTML site | Public content API | Intended use                                   |
| ---------- | ------------------ | ------------------ | ---------------------------------------------- |
| `public`   | Yes                | Yes                | Default CMS + website experience               |
| `private`  | Admin preview only | No                 | Drafting or client review before launch        |
| `api-only` | No                 | Yes                | Headless/Jamstack setups or external consumers |

Legacy config values still work:

- `website_mode` takes priority when set.
- `website_visibility: "private"` maps to `private`.
- `website_enabled: false` maps to `api-only`.

## Why this model

This keeps the default experience WordPress-like without forcing everyone into a monolith:

- The admin UI still edits the same content and theme data.
- The public REST API remains the canonical interface for headless consumers.
- The embedded themed site is just one delivery mode on top of the same data.

## Static export

Use the built-in exporter when you want Jamstack-style deployment without splitting the product into a second CMS/frontend pair.

```bash
bun run site:export
phantasy site export --base-url https://example.com
```

The exporter writes to `dist/site` by default and can emit:

- themed HTML pages
- theme assets
- feed files
- content API snapshots for headless consumers

`api-only` mode still supports static export. It disables runtime HTML routes, not your ability to generate a static site from the same content and theme data.
