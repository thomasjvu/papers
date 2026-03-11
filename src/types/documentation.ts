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
};
