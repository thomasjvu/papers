declare module '*/shared/content-collections.js' {
  import type {
    ContentCollection,
    ContentCollectionVariants,
    ContentSchemaAdapter,
    ContentSchemaField,
  } from '*/shared/docsRouting.js';

  export const CONTENT_COLLECTION_CONTRACT_VERSION: number;

  export function getCollectionSchemaAdapter(
    collection?: ContentCollection
  ): ContentSchemaAdapter | Record<string, ContentSchemaField>;

  export function getCollectionFrontmatterSchema(
    collection?: ContentCollection
  ): Record<string, ContentSchemaField>;

  export function getCollectionVariants(collection?: ContentCollection): {
    versionConfig: NonNullable<ContentCollectionVariants['versionConfig']>;
    i18nConfig: NonNullable<ContentCollectionVariants['i18nConfig']>;
  };

  export function getCollectionArtifactPaths(collection?: ContentCollection): {
    index: string;
    content: string;
    manifest: string;
    references: string;
  };

  export function getCollectionRoutePrefix(collection?: ContentCollection): string;
  export function findCollectionForPath(
    pathname: string,
    collections?: ContentCollection[]
  ): ContentCollection | null;

  export function validateContentCollection(
    collection: ContentCollection,
    options?: { rootDir?: string }
  ): string[];

  export function validateContentCollections(
    collections?: ContentCollection[],
    options?: { rootDir?: string }
  ): ContentCollection[];

  export const contentCollections: ContentCollection[];

  export function getContentCollection(id: string): ContentCollection;
}
