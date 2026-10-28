import { useMemo } from 'react';

import { getCollectionRouteSlug, parseCollectionRoutePath } from '../../shared/docsRouting.js';
import type { ContentCollection } from '../../shared/docsRouting.js';

/** Parsed version/locale/doc path for `pathname` within `collection`'s routes. */
export function useCollectionRouteContext(
  collection: ContentCollection,
  pathname: string,
  slugOutsideCollection = ''
) {
  const docsRouteSlug = getCollectionRouteSlug(collection, pathname) ?? slugOutsideCollection;
  return useMemo(
    () => parseCollectionRoutePath(collection, docsRouteSlug),
    [collection, docsRouteSlug]
  );
}
