declare module '*/shared/contentSchema.js' {
  export type FrontmatterFieldType = 'string' | 'string[]' | 'boolean' | 'number';

  export interface FrontmatterField {
    type: FrontmatterFieldType;
    integer?: boolean;
  }

  export const documentFrontmatterSchema: Record<string, FrontmatterField>;
  export const DOCUMENT_FRONTMATTER_SCHEMA_VERSION: number;
  export function getFrontmatterSchemaKeys(schema?: Record<string, FrontmatterField>): string[];
}
