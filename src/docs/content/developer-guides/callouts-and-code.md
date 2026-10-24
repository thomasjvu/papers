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

### Collapsible Callouts

`:::details Title` renders a callout that starts closed. Readers open it by
clicking the title or pressing Enter or Space on it.

```md
:::details Show the full config
The full configuration lives in `shared/documentation-config.js`.
:::
```

:::details Show the full config
The full configuration lives in `shared/documentation-config.js`.
:::

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

Diff colors come from the theme. Each bundled theme sets
`--code-inserted-color`, `--code-deleted-color`, `--code-inserted-bg` and
`--code-deleted-bg` to match its palette. Set them in your theme's
`tokens.css` to change them.

To colour the code as well, add the language after `diff-`, for example
`diff-ts` or `diff-json`:

```diff-ts title="greet.ts"
 export function greet(name: string) {
-  return 'Hello ' + name;
+  return `Hello, ${name}!`;
 }
```

## Word Highlighting

Put a term in quotes after the language to highlight every place it appears.
You can list up to 10 terms.

````md
```ts "apiKey" "fetchDocs"
const apiKey = process.env.DOCS_API_KEY;
await fetchDocs({ apiKey });
```
````

```ts "apiKey" "fetchDocs"
const apiKey = process.env.DOCS_API_KEY;
await fetchDocs({ apiKey });
```

## Line Numbers

Code blocks show line numbers by default. Add `noLineNumbers` (or
`showLineNumbers=false`) to hide them for one block. Readers can also show
or hide line numbers with the button in any code block's header.

````md
```bash noLineNumbers
npm run build
```
````

```bash noLineNumbers
npm run build
```

Every code block keeps its copy button. The copy button copies the code
exactly as written, including diff markers.

## Content Tabs

Wrap tabs in `:::tabs` and start each tab with a `::tab Label` line. Tabs can
hold any Markdown, including code blocks.

Add a group key after `tabs` to keep tab sets in sync. Choosing a tab in one
set switches every set with the same key on the page. The choice is saved in
the browser, so other pages open on the same tab.

````md
:::tabs pkg
::tab npm

```bash
npm install papers
```

::tab pnpm

```bash
pnpm add papers
```

:::
````

:::tabs pkg
::tab npm

```bash
npm install papers
```

::tab pnpm

```bash
pnpm add papers
```

:::

This second set uses the same `pkg` key, so it follows the first one:

:::tabs pkg
::tab npm
Run `npm run dev` to start the dev server.
::tab pnpm
Run `pnpm dev` to start the dev server.
:::

Tabs without a group key switch on their own. If a panel contains a callout,
give the tabs fence more colons than the callout, for example `::::tabs`.

### Nested Tabs

Tabs can hold another tab set. Give the outer set more colons than the inner
one, so `::::tabs` closes with `::::` and the inner `:::tabs` closes with
`:::`. Each set keeps its own `::tab` markers and group key.

```md
::::tabs os
::tab macOS
:::tabs pkg
::tab npm
Run `brew install node`, then `npm install papers`.
::tab pnpm
Run `brew install pnpm`, then `pnpm add papers`.
:::
::tab Linux
Install Node.js from your distribution, then run `npm install papers`.
::::
```

::::tabs os
::tab macOS
:::tabs pkg
::tab npm
Run `brew install node`, then `npm install papers`.
::tab pnpm
Run `brew install pnpm`, then `pnpm add papers`.
:::
::tab Linux
Install Node.js from your distribution, then run `npm install papers`.
::::

The inner set uses the `pkg` key, so it follows the package manager tabs above.
