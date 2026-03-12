# Code Examples

This page shows the main authoring patterns supported by the current runtime.

## Add A New Docs Page

Add the page to `shared/documentation-config.js`:

```js
{
  type: 'file',
  name: 'Architecture.md',
  path: 'developer-guides/architecture',
  tags: ['architecture', 'guide']
}
```

Then create `src/docs/content/developer-guides/architecture.md` and rerun `npm run generate:docs`.

## Standard Code Block

````md
```ts
export function hello(name: string) {
  return `Hello, ${name}`;
}
```
````

## Multi-Tab Code Block

Use pipe-separated language definitions. `---` splits snippet bodies when needed.

````md
```ts:TypeScript|js:JavaScript
export const value = 1;
---
export const value = 1;
```
````

## Optional Frontmatter

Use frontmatter when you want to control the generated page description:

````md
---
description: Short summary used for metadata, previews, and generated artifacts.
---

# Architecture
```
````

## Live HTML Example

````md
```html
<button class="button-primary" type="button">Try me</button>
```
````

## Live CSS Example

````md
```css
.button-primary {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-unified);
  background: var(--card-color);
  color: var(--text-color);
}
```
````

## `ColorPalette` Block

The current component expects `hex`, `rgb`, and `usage` keys.

````md
```ColorPalette
{
  "colors": [
    {
      "name": "Primary",
      "hex": "#111111",
      "rgb": "17, 17, 17",
      "usage": "Primary actions and emphasis"
    }
  ]
}
```
````

## Wallet Block

The wallet block is authored as HTML and upgraded at render time.

```html
<code
  class="wallet-address"
  data-address="0x742d35Cc6634C0532925a3b844Bc9e7595f8fA6B"
  data-chain="eth"
>
  0x742d35Cc6634C0532925a3b844Bc9e7595f8fA6B
</code>
```

That becomes a theme-aware component with a chain icon and copy button.

## Add Your Own Custom Component

For most cases, the path is:

1. detect the block in `src/utils/markdownCore.ts`
2. emit a placeholder with the data your component needs
3. render that placeholder in `src/components/MarkdownRenderer.tsx`
4. style it with tokens from `src/globals.css`

If the feature is only needed inside live previews, `src/utils/contentProcessor.ts` is the helper that upgrades HTML snippets like wallet blocks.

## Internal Docs Links

Use absolute docs links so routing stays inside the SPA shell.

```md
[Deployment Overview](/docs/deployment/overview)
```

## Reminder

After adding or renaming docs pages, rerun `npm run generate:docs`. If you also changed descriptions or canonical metadata, rerun `npm run generate:seo` before checking the result.
