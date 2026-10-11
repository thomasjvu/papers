---
description: Callouts (admonitions), GitHub-style alerts, code block titles, line highlighting, and diffs.
---

# Callouts And Code Blocks

Papers Markdown supports callouts for asides and warnings, plus code fence
metadata for filenames, highlighted lines, and diffs. These features work in
`.md` pages.

## Callouts

Wrap content in `:::type` and close it with `:::`. The five types are `note`,
`tip`, `info`, `warning`, and `danger`. Text after the type becomes the title.

```md
:::note
Callouts can contain **Markdown**, lists, and code.
:::

:::warning Breaking change
`generate:docs` now validates frontmatter.
:::
```

:::note
Callouts can contain **Markdown**, lists, and code.
:::

:::tip Faster previews
Run `npm run dev` to regenerate artifacts and start Vite in one step.
:::

:::info
Search results come from the Pagefind index built with `npm run build`.
:::

:::warning Breaking change
`generate:docs` now validates frontmatter.
:::

:::danger
Never commit deployment credentials to `wrangler.toml`.
:::

### Nesting

Give the outer fence more colons than the inner one:

```md
::::info Outer
Outer text.

:::tip Inner
Inner text.
:::
::::
```

::::info Outer
Outer text.

:::tip Inner
Inner text.
:::
::::

## GitHub-Style Alerts

The GitHub alert syntax renders the same way, so READMEs and docs can share
content. `IMPORTANT` uses the info style and `CAUTION` uses the danger style.

```md
> [!TIP]
> Alerts written for GitHub render as callouts here too.
```

> [!TIP]
> Alerts written for GitHub render as callouts here too.

> [!CAUTION]
> Deleting `dist/` removes the last build output.

## Code Block Titles

Add `title="..."` after the language to show a filename in the code block header.

````md
```ts title="src/greet.ts"
export const greet = (name: string) => `Hello, ${name}`;
```
````

```ts title="src/greet.ts"
export const greet = (name: string) => `Hello, ${name}`;
```

## Line Highlighting

List line numbers or ranges in braces. You can combine them with a title.

````md
```ts title="vite.config.ts" {2,4-5}
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```
````

```ts title="vite.config.ts" {2,4-5}
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

## Diffs

A `diff` fence marks lines that start with `+` as added and lines that start
with `-` as removed. The `+` and `-` markers stay visible, so the change does
not depend on color alone.

````md
```diff title="package.json"
   "scripts": {
-    "build": "vite build"
+    "build": "npm run generate:docs && vite build"
   }
```
````

```diff title="package.json"
   "scripts": {
-    "build": "vite build"
+    "build": "npm run generate:docs && vite build"
   }
```

Every code block keeps its copy button. The copy button copies the code
exactly as written, including diff markers.
