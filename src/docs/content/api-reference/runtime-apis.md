# Runtime APIs

## `loadDocsContent()`

Fetches and caches `/docs-index.json` for the current session.

Use it when you need the generated manifest without loading a specific page.

## `getDocument(path)`

Loads one generated document from `/docs-content/...`.

```ts
import { getDocument } from '../src/lib/content';

const doc = await getDocument('deployment/overview');
```

## `resolveDocumentPath(slug)`

Maps route slugs to the actual page path.

That is why `/docs/getting-started` can resolve to `/docs/getting-started/introduction`.

## `clearContentCache()`

Clears the in-memory docs manifest and page cache.

Useful in tests or when you intentionally want a fresh fetch cycle.

## Navigation Helpers

`src/lib/navigation.ts` also exposes small helpers such as:

- `flattenNavigation()`
- `findAdjacentPages()`
- `findPageTags()`

These are useful when you want derived data from the shared docs tree.

## `usePagefind()`

Loads the Pagefind browser bundle once and returns normalized search results.

```ts
const { search, isAvailable, isLoading } = usePagefind();
```

## `useTheme()`

Exposes:

- `isDarkMode`
- `toggleTheme()`
- `prefersReducedMotion`
- `toggleReducedMotion()`
- `fontFamily`
- `setFontFamily()`

The UI uses this provider for the settings menu, keyboard shortcut, and font cycling.

## Notes

These APIs are intentionally small. The template stays mostly configuration-driven instead of wrapping everything in a large abstraction layer.
