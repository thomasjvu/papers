# Runtime APIs

## `getDocument(path)`

Loads a single document from the generated docs content store.

```ts
import { getDocument } from '../src/lib/content';

const doc = await getDocument('deployment/overview');
```

## `loadDocsContent()`

Fetches and caches `/docs-index.json` for the current session.

## `resolveDocumentPath(slug)`

Maps route slugs such as empty directory paths to a default page.

That is why `/docs/getting-started` can resolve to `/docs/getting-started/introduction`.

## `usePagefind()`

Loads the Pagefind browser bundle and returns normalized search results.

```ts
const { search, isAvailable } = usePagefind();
```

## `useTheme()`

Exposes:

- `isDarkMode`
- `toggleTheme()`
- `prefersReducedMotion`
- `toggleReducedMotion()`
- `fontFamily`
- `setFontFamily()`

## Notes

These APIs are intentionally small. Most of the template stays configuration-driven rather than introducing a large abstraction layer.
