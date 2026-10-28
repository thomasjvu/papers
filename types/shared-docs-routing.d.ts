declare module '*/shared/docsRouting.js' {
  import type { I18nConfig, VersionConfig } from '*/shared/documentation-config.js';

  export interface DocsRouteContext {
    originalSlug: string;
    docPath: string;
    routeVersion: string | null;
    routeLocale: string | null;
    activeVersion: string | null;
    activeLocale: string | null;
    hasExplicitPrefix: boolean;
    collectionId?: string;
  }

  export interface VersioningState {
    enabled: boolean;
    current: string | null;
    versions: string[];
    labels: Record<string, string>;
  }

  export interface I18nState {
    enabled: boolean;
    defaultLocale: string | null;
    locales: string[];
  }

  export interface DocumentationFeatureState {
    versioning: VersioningState;
    i18n: I18nState;
  }

  export function getVersioningState(config?: unknown): VersioningState;
  export function getI18nState(config?: unknown): I18nState;
  export function getDocumentationFeatureValidationIssues(options?: {
    documentationTree?: Array<{
      name: string;
      path: string;
      type: 'file' | 'directory';
      children?: unknown[];
    }>;
    versionConfig?: unknown;
    i18nConfig?: unknown;
  }): string[];
  export function assertValidDocumentationFeatureConfig(options?: {
    documentationTree?: Array<{
      name: string;
      path: string;
      type: 'file' | 'directory';
      children?: unknown[];
    }>;
    versionConfig?: unknown;
    i18nConfig?: unknown;
  }): DocumentationFeatureState;
  export const docsFeatureState: DocumentationFeatureState;
  export function parseDocsRoutePath(
    slug?: string,
    options?: {
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): DocsRouteContext;
  export function buildDocsPath(
    path?: string,
    options?: {
      version?: string | null;
      locale?: string | null;
      includeVersion?: boolean;
      includeLocale?: boolean;
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): string;
  export function buildCanonicalDocsPath(
    path?: string,
    options?: {
      version?: string | null;
      locale?: string | null;
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): string;
  export function buildDocsRouteVariants(
    path?: string,
    options?: {
      version?: string | null;
      locale?: string | null;
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): string[];
  export function buildDocsContentPath(
    path?: string,
    options?: {
      version?: string | null;
      locale?: string | null;
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): string;
  export function getDocsVariantContexts(options?: {
    versionConfig?: unknown;
    i18nConfig?: unknown;
  }): Array<{
    version: string | null;
    locale: string | null;
    key: string;
    isDefault: boolean;
  }>;
  export function buildDocsLandingPath(
    path?: string | null,
    options?: {
      version?: string | null;
      locale?: string | null;
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): string;

  export interface ContentCollectionVariants {
    versionConfig?: VersionConfig;
    i18nConfig?: I18nConfig;
  }

  export interface ContentSchemaField {
    type: string;
    integer?: boolean;
  }

  export interface ContentSchemaAdapter {
    kind: 'papers-content-schema';
    version: number;
    fields: Record<string, ContentSchemaField>;
    unknownFields: 'reject';
  }

  export interface ContentCollectionTreeItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: ContentCollectionTreeItem[];
    expanded?: boolean;
    tags?: string[];
    description?: string;
    icon?: string;
    order?: number;
    hidden?: boolean;
  }

  export interface ContentCollection {
    id: string;
    label: string;
    routePrefix: string;
    contentDir: string;
    tree: ContentCollectionTreeItem[];
    description?: string;
    schemaVersion?: number;
    schemaAdapter?: ContentSchemaAdapter;
    schema?: ContentSchemaAdapter | Record<string, ContentSchemaField>;
    frontmatterSchema?: Record<string, ContentSchemaField>;
    variants?: ContentCollectionVariants;
    artifactNamespace?: string;
    frameworkDocPaths?: string[];
    frameworkContentDir?: string;
    mdxComponents?: string[];
  }

  export function getCollectionRoutingOptions(
    collection?: ContentCollection,
    options?: {
      version?: string | null;
      locale?: string | null;
      includeVersion?: boolean;
      includeLocale?: boolean;
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): {
    version?: string | null;
    locale?: string | null;
    includeVersion?: boolean;
    includeLocale?: boolean;
    versionConfig?: unknown;
    i18nConfig?: unknown;
  };

  export function buildCollectionRoutePath(
    collection: ContentCollection,
    path?: string,
    options?: {
      version?: string | null;
      locale?: string | null;
      includeVersion?: boolean;
      includeLocale?: boolean;
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): string;

  export function buildCanonicalCollectionPath(
    collection?: ContentCollection,
    path?: string,
    options?: {
      version?: string | null;
      locale?: string | null;
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): string;

  export function buildCollectionRouteVariants(
    collection: ContentCollection,
    path?: string,
    options?: {
      version?: string | null;
      locale?: string | null;
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): string[];

  export function buildCollectionContentPath(
    collection?: ContentCollection,
    path?: string,
    options?: {
      version?: string | null;
      locale?: string | null;
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): string;

  export function getCollectionVariantContexts(
    collection?: ContentCollection,
    options?: {
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): Array<{
    version: string | null;
    locale: string | null;
    key: string;
    isDefault: boolean;
  }>;

  export function buildCollectionLandingPath(
    collection?: ContentCollection,
    path?: string | null,
    options?: {
      version?: string | null;
      locale?: string | null;
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): string;

  export function getCollectionRouteSlug(
    collection: Partial<Pick<ContentCollection, 'routePrefix'>> | undefined,
    pathname: string
  ): string | null;

  export function parseCollectionRoutePath(
    collection?: ContentCollection,
    slug?: string,
    options?: {
      versionConfig?: unknown;
      i18nConfig?: unknown;
    }
  ): DocsRouteContext;
}
