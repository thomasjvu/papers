declare module '*/shared/docsRouting.js' {
  export interface DocsRouteContext {
    originalSlug: string;
    docPath: string;
    routeVersion: string | null;
    routeLocale: string | null;
    activeVersion: string | null;
    activeLocale: string | null;
    hasExplicitPrefix: boolean;
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
  export function parseDocsRoutePath(slug?: string, options?: {
    versionConfig?: unknown;
    i18nConfig?: unknown;
  }): DocsRouteContext;
  export function buildDocsPath(path?: string, options?: {
    version?: string | null;
    locale?: string | null;
    includeVersion?: boolean;
    includeLocale?: boolean;
    versionConfig?: unknown;
    i18nConfig?: unknown;
  }): string;
  export function buildCanonicalDocsPath(path?: string, options?: {
    version?: string | null;
    locale?: string | null;
    versionConfig?: unknown;
    i18nConfig?: unknown;
  }): string;
  export function buildDocsRouteVariants(path?: string, options?: {
    version?: string | null;
    locale?: string | null;
    versionConfig?: unknown;
    i18nConfig?: unknown;
  }): string[];
  export function buildDocsContentPath(path?: string, options?: {
    version?: string | null;
    locale?: string | null;
    versionConfig?: unknown;
    i18nConfig?: unknown;
  }): string;
  export function getDocsVariantContexts(options?: {
    versionConfig?: unknown;
    i18nConfig?: unknown;
  }): Array<{
    version: string | null;
    locale: string | null;
    key: string;
    isDefault: boolean;
  }>;
  export function buildDocsLandingPath(path?: string | null, options?: {
    version?: string | null;
    locale?: string | null;
    versionConfig?: unknown;
    i18nConfig?: unknown;
  }): string;
}
