declare module '*/shared/content-collections.js' {
  import type { ContentCollection } from '*/shared/docsRouting.js';

  export const contentCollections: ContentCollection[];

  export function getContentCollection(id: string): ContentCollection;
}
