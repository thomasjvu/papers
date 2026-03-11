import type { FileItem } from '../types/documentation';

export { documentationTree } from '../../shared/documentation-config.js';

export function flattenNavigation(items: FileItem[]): Array<{ path: string; title: string }> {
  const result: Array<{ path: string; title: string }> = [];

  function flatten(items: FileItem[]) {
    for (const item of items) {
      if (item.type === 'file') {
        result.push({
          path: item.path,
          title: item.name.replace(/\.md$/, ''),
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
