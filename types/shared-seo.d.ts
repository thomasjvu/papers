declare module '*/shared/seo.js' {
  export const DEFAULT_OG_IMAGE_PATH: string;
  export const DEFAULT_TWITTER_IMAGE_PATH: string;

  export function stripFrontmatter(content: string): string;
  export function truncateText(text: string, maxLength?: number): string;
  export function extractDescriptionFromMarkdown(content: string, maxLength?: number): string;
  export function normalizeSiteUrl(siteUrl: string): string;
  export function buildAbsoluteUrl(path: string, siteUrl: string): string;
  export function getDefaultDocumentPath(
    items?: Array<{
      name: string;
      path: string;
      type: 'file' | 'directory';
      children?: unknown[];
    }>
  ): string | null;
  export function getDocumentPaths(
    items?: Array<{
      name: string;
      path: string;
      type: 'file' | 'directory';
      children?: unknown[];
    }>
  ): string[];
  export function getDirectoryAliasEntries(
    items?: Array<{
      name: string;
      path: string;
      type: 'file' | 'directory';
      children?: unknown[];
    }>
  ): Array<{ routePath: string; docPath: string }>;
  export function getHomeMetadataDefaults(): {
    siteName: string;
    siteSubtitle: string;
    siteDescription: string;
  };
}
