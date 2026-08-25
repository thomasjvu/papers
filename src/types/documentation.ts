/**
 * Core types for the documentation system
 */

/**
 * Represents a file or directory item in the documentation structure
 */
export type FileItem = {
  /** Display name of the item */
  name: string;
  /** URL path for the item */
  path: string;
  /** Whether this is a file or directory */
  type: 'file' | 'directory';
  /** Child items for directories */
  children?: FileItem[];
  /** Whether the directory is expanded in the UI */
  expanded?: boolean;
  /** Tags associated with this item for search/categorization */
  tags?: string[];
  /** Optional short summary surfaced by typed collection metadata */
  description?: string;
  /** Optional icon identifier for collection-aware navigation */
  icon?: string;
  /** Optional stable ordering hint for generated navigation */
  order?: number;
  /** Hide this item from generated navigation without removing its route */
  hidden?: boolean;
};

export type DocumentFrontmatter = {
  title?: string;
  description?: string;
  tags?: string[];
  keywords?: string[];
  icon?: string;
  order?: number;
  draft?: boolean;
  toc?: boolean;
  full?: boolean;
  sidebar?: boolean;
};

export type DocumentLinkType = 'internal' | 'external' | 'action';

export type DocumentLink = {
  target: string;
  line: number;
  type: DocumentLinkType;
};
