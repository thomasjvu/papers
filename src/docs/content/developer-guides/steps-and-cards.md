---
description: Numbered steps and link cards for guides and landing pages.
---

# Steps And Cards

Use steps for procedures that readers follow in order, and cards to point
readers to other pages.

## Steps

Wrap an ordered list in `:::steps`. Each list item becomes a numbered step.

```md
:::steps

1. Install the dependencies.
2. Start the dev server.
3. Open the local URL.
   :::
```

:::steps

1. Install the dependencies.

   ```bash
   npm install
   ```

2. Start the dev server.

   ```bash
   npm run dev
   ```

3. Open the URL that the dev server prints.

:::

## Cards

Put cards in `:::cards`. Start each card with a `::card Title` line. To link
the card, write the title as a Markdown link. Links must be site paths that
start with `/` or `https://` URLs. Other links are dropped and the title shows
as plain text.

```md
:::cards
::card [Callouts and code](/docs/developer-guides/callouts-and-code)
Admonitions, code titles, and diffs.
::card [MDX authoring](/docs/developer-guides/callouts-in-mdx)
The same features in `.mdx` pages.
:::
```

:::cards
::card [Callouts and code](/docs/developer-guides/callouts-and-code)
Admonitions, code titles, and diffs.
::card [MDX authoring](/docs/developer-guides/callouts-in-mdx)
The same features in `.mdx` pages.
:::

## In MDX

MDX pages use `<Steps>`, `<CardGrid>`, and `<Card title href>`:

```mdx
<Steps>

1. Install the dependencies.
2. Start the dev server.

</Steps>

<CardGrid>
  <Card title="Callouts and code" href="/docs/developer-guides/callouts-and-code">
    Admonitions, code titles, and diffs.
  </Card>
</CardGrid>
```
