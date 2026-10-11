declare module '*/shared/seo.js' {
  export const DEFAULT_OG_IMAGE_PATH: string;
  export const PAGE_SOCIAL_IMAGE_DIR: string;
  export function socialImagePathForRoute(canonicalPath: string | undefined): string;
  export const DEFAULT_TWITTER_IMAGE_PATH: string;
  export const AGENT_DISCOVERY_PATH: string;
  export const AGENT_ARTIFACTS: ReadonlyArray<{
    id: string;
    path: string;
    contentType: string;
    title: string;
  }>;

  export function getAgentArtifactLinks(siteUrl?: string): Array<{
    id: string;
    path: string;
    contentType: string;
    title: string;
    href: string;
  }>;
  export function createAgentDiscoveryManifest(options?: {
    siteName?: string;
    siteUrl?: string;
    description?: string;
  }): {
    schemaVersion: number;
    kind: string;
    name: string;
    description: string;
    artifacts: Array<{
      id: string;
      path: string;
      contentType: string;
      title: string;
      href: string;
    }>;
  };
  export function createSeoStructuredData(options?: {
    siteName?: string;
    title?: string;
    description?: string;
    url?: string;
    routePath?: string;
    type?: 'website' | 'article';
  }): Record<string, unknown>;
  export function serializeJsonLd(value: unknown): string;

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
