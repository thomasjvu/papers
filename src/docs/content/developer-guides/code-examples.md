# Code Examples

This section shows the supported authoring patterns in the current Vite-based template.

## Add A New Docs Page

Update `shared/documentation-config.js`:

```js
{
  type: 'file',
  name: 'Architecture.md',
  path: 'developer-guides/architecture',
  tags: ['architecture', 'guide']
}
```

Then create `src/docs/content/developer-guides/architecture.md`.

## Use A Standard Code Block

````md
```ts
export function hello(name: string) {
  return `Hello, ${name}`;
}
```
````

## Use A Multi-Tab Code Block

The Markdown processor supports pipe-separated language definitions.

````md
```ts:TypeScript|js:JavaScript
export const value = 1;
---
export const value = 1;
```
````

## Embed A Live Example

HTML and CSS code fences render as live previews.

````md
```html
<button class="button-primary" type="button">Try me</button>
```
````

## Render A Color Palette

````md
```ColorPalette
{
  "colors": [
    { "name": "Primary", "value": "#111111" },
    { "name": "Accent", "value": "#52525B" }
  ]
}
```
````

## Build A Custom Markdown Component

There are two extension points in the current runtime:

1. fenced Markdown blocks handled in `src/utils/markdownCore.ts`
2. HTML patterns rendered in `src/components/MarkdownRenderer.tsx`

The built-in examples are:

- `ColorPalette` fenced blocks
- `html` and `css` live examples
- wallet copy blocks rendered from `<code class="wallet-address">...`

### Add A New Fenced Component

Use this path when you want a custom code fence like `ColorPalette`.

1. Detect the fence language in `buildMarkdownRenderState()` inside `src/utils/markdownCore.ts`.
2. Emit a placeholder element with `data-*` attributes for the payload you need.
3. Read that placeholder in `src/components/MarkdownRenderer.tsx` and return a React component.
4. Style the result with CSS variables in `src/globals.css` or a component CSS module.

## Wallet Block Example

The wallet block is a good example of a custom rendered HTML pattern rather than a fenced block:

```html
<code
  class="wallet-address"
  data-address="0x742d35Cc6634C0532925a3b844Bc9e7595f8fA6B"
  data-chain="eth"
>
  0x742d35Cc6634C0532925a3b844Bc9e7595f8fA6B
</code>
```

At render time, `MarkdownRenderer` upgrades that markup into a themed component with:

- a chain icon
- a copy button
- clipboard feedback
- theme-aware styling from CSS variables

Use this same pattern when you want to author simple semantic HTML in docs but render a richer component in the app.

## Link Between Docs Pages

Use absolute docs links so the runtime can intercept them:

```md
[Deployment Overview](/docs/deployment/overview)
```

## Tip

Because the site is generated from Markdown and shared config, the smallest possible change is usually the best one: update the tree, add the file, then regenerate.
