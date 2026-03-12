import type { FileItem } from '../../types/documentation.ts';

export function findPathToFile(
  items: FileItem[],
  targetPath: string,
  parentPaths: string[] = []
): string[] | null {
  for (const item of items) {
    if (item.path === targetPath) {
      return parentPaths;
    }

    if (item.type === 'directory' && item.children) {
      const result = findPathToFile(item.children, targetPath, [...parentPaths, item.path]);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

export function mergeExpandedPaths(
  previous: Record<string, boolean>,
  pathsToExpand: string[]
): Record<string, boolean> {
  let changed = false;
  const next = { ...previous };

  for (const path of pathsToExpand) {
    if (!next[path]) {
      next[path] = true;
      changed = true;
    }
  }

  return changed ? next : previous;
}
