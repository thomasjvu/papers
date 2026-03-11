# Code Examples

This section shows accurate examples for the current Vite-based template.

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

## Link Between Docs Pages

Use absolute docs links so the runtime can intercept them:

```md
[Deployment Overview](/docs/deployment/overview)
```

## Tip

Because the site is generated from Markdown and shared config, the smallest possible change is usually the best one: update the tree, add the file, then regenerate.
