import FileTree from '../FileTree';
import type { FileItem } from '../../types/documentation';
import { getSidebarVariant } from '../../lib/chrome';

import GroupsSidebar from './GroupsSidebar';

type SidebarNavProps = {
  items: FileItem[];
  onSelect: (item: FileItem) => void;
  onPrefetch?: (path: string) => void;
  currentPath?: string;
  defaultOpenAll?: boolean;
};

/**
 * Papers sidebar router — chromeConfig.sidebarVariant:
 * - tree: classic file-tree
 * - groups: section headers + flat page list
 */
export default function SidebarNav(props: SidebarNavProps) {
  if (getSidebarVariant() === 'groups') {
    return <GroupsSidebar {...props} />;
  }
  return <FileTree {...props} />;
}
