# papers

Static documentation framework built with React, Vite, and TypeScript. Markdown authoring, Pagefind search, `llms.txt` exports, and SEO-friendly static output.

## Quick start

```bash
git clone git@github.com:thomasjvu/papers.git
cd papers
npm install
npm run dev
```

Open `http://localhost:3333/docs/getting-started/introduction`.

## Customize

| Path | Purpose |
| ---- | ------- |
| `shared/documentation-config.js` | Sidebar, homepage, OpenAPI |
| `src/docs/content/` | Markdown pages |
| `.env.local` | Site name, URL, GitHub metadata |
| `src/globals.css` | Theme tokens |
| `themes/` | Theme packages |

## Commands

```bash
npm run dev
npm run generate:docs
npm run generate:llms
npm run check:docs-tree
npm run build
npm run release:check
```

## Docs

- [FRAMEWORK.md](FRAMEWORK.md) — features and roadmap
- [RELEASING.md](RELEASING.md) — release checklist

## License

MIT. See [LICENSE](LICENSE).