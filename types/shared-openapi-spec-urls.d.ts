declare module '*/shared/openapiSpecUrls.js' {
  export type OpenApiSpecUrlKind = 'local' | 'remote';

  export interface ValidatedOpenApiSpecUrl {
    kind: OpenApiSpecUrlKind;
    value: string;
    origin?: string;
  }

  export function normalizeOpenApiAllowedOrigins(origins?: string[]): string[];
  export function normalizeLocalOpenApiPath(value: string): string;
  export function validateOpenApiSpecUrl(
    value: string,
    config?: { allowedOrigins?: string[] }
  ): ValidatedOpenApiSpecUrl;
  export function getOpenApiSpecUrl(
    spec: { url: string },
    config?: { allowedOrigins?: string[] }
  ): string;
  export function assertValidOpenApiConfig(config?: unknown): unknown;
}
