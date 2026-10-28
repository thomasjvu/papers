declare module '*/shared/docsBasePath.js' {
  export const DEFAULT_DOCS_BASE_PATH: '/docs';
  export const docsBasePath: string;
  export function normalizeDocsBasePath(value: string | null | undefined): string;
  export function getDocsBaseSegments(basePath?: string): string[];
  export function withDocsBasePath(path?: string, basePath?: string): string;
  export function stripDocsBasePath(pathname: string, basePath?: string): string | null;
}
