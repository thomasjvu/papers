import { documentationTree } from '../../shared/documentation-config.js';
import type { FileItem } from '../types/documentation';

export { documentationTree };

export function flattenNavigation(items: FileItem[]): Array<{ path: string; title: string }> {
  const result: Array<{ path: string; title: string }> = [];

  function flatten(items: FileItem[]) {
    for (const item of items) {
      if (item.type === 'file') {
        result.push({
          path: item.path,
          title: item.name.replace(/\.(md|mdx)$/, ''),
        });
      }
      if (item.children) {
        flatten(item.children);
      }
    }
  }

  flatten(items);
  return result;
}

export function findFirstDocumentPath(items: FileItem[]): string | null {
  for (const item of items) {
    if (item.type === 'file') {
      return item.path;
    }

    if (item.type === 'directory' && item.children) {
      const childPath = findFirstDocumentPath(item.children);
      if (childPath) {
        return childPath;
      }
    }
  }

  return null;
}

export const DEFAULT_DOCUMENT_PATH =
  findFirstDocumentPath(documentationTree) || 'getting-started/introduction';

export function findDirectoryDefaultPath(slug: string, items: FileItem[]): string | null {
  for (const item of items) {
    if (item.type === 'directory' && item.path === slug && item.children) {
      return findFirstDocumentPath(item.children);
    }

    if (item.type === 'directory' && item.children) {
      const childMatch = findDirectoryDefaultPath(slug, item.children);
      if (childMatch) {
        return childMatch;
      }
    }
  }

  return null;
}

export function findAdjacentPages(
  currentPath: string,
  items: FileItem[]
): { prev?: { path: string; title: string }; next?: { path: string; title: string } } {
  const flattened = flattenNavigation(items);
  const currentIndex = flattened.findIndex((item) => item.path === currentPath);

  if (currentIndex === -1) {
    return {};
  }

  return {
    prev: currentIndex > 0 ? flattened[currentIndex - 1] : undefined,
    next: currentIndex < flattened.length - 1 ? flattened[currentIndex + 1] : undefined,
  };
}

export function findPageTags(currentPath: string, items: FileItem[]): string[] {
  function findItem(items: FileItem[], path: string): FileItem | undefined {
    for (const item of items) {
      if (item.path === path) return item;
      if (item.children) {
        const found = findItem(item.children, path);
        if (found) return found;
      }
    }
    return undefined;
  }

  const item = findItem(items, currentPath);
  return item?.tags || [];
}
