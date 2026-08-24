import { Icon } from '@iconify/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import type { FileItem } from '../../types/documentation';
import { buildCanonicalDocsPath, parseDocsRoutePath } from '../../../shared/docsRouting.js';
import safeLocalStorage from '../../utils/storage';

import styles from './GroupsSidebar.module.css';

type GroupsSidebarProps = {
  items: FileItem[];
  onSelect: (item: FileItem) => void;
  onPrefetch?: (path: string) => void;
  currentPath?: string;
  defaultOpenAll?: boolean;
};

const STORAGE_KEY = 'papers_groups_sidebar_expanded';

function pageLabel(item: FileItem): string {
  return item.name.replace(/\.(md|mdx)$/i, '');
}

function collectExpandedDefaults(items: FileItem[], openAll: boolean): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const item of items) {
    if (item.type === 'directory') {
      map[item.path] = openAll || item.expanded !== false;
      if (item.children) {
        Object.assign(map, collectExpandedDefaults(item.children, openAll));
      }
    }
  }
  return map;
}

function readStoredExpanded(): Record<string, boolean> {
  try {
    const raw = safeLocalStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export default function GroupsSidebar({
  items,
  onSelect,
  onPrefetch,
  currentPath,
  defaultOpenAll = true,
}: GroupsSidebarProps) {
  const location = useLocation();
  const docsRouteSlug = location.pathname.startsWith('/docs')
    ? location.pathname.replace(/^\/docs\/?/, '')
    : location.pathname.replace(/^\/+|\/+$/g, '');
  const routeContext = useMemo(() => parseDocsRoutePath(docsRouteSlug), [docsRouteSlug]);

  const rootFiles = useMemo(() => items.filter((item) => item.type === 'file'), [items]);
  const groups = useMemo(() => items.filter((item) => item.type === 'directory'), [items]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({
    ...collectExpandedDefaults(items, defaultOpenAll),
    ...readStoredExpanded(),
  }));

  useEffect(() => {
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
  }, [expanded]);

  const toggleGroup = useCallback((path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  }, []);

  const hrefFor = useCallback(
    (docPath: string) =>
      buildCanonicalDocsPath(docPath, {
        version: routeContext.activeVersion,
        locale: routeContext.activeLocale,
      }),
    [routeContext.activeLocale, routeContext.activeVersion]
  );

  const renderFileLink = (item: FileItem) => {
    const active = currentPath === item.path;
    return (
      <Link
        key={item.path}
        to={hrefFor(item.path)}
        className={`${styles.link}${active ? ` ${styles.linkActive}` : ''}`}
        onClick={() => onSelect(item)}
        onMouseEnter={() => onPrefetch?.(item.path)}
        onFocus={() => onPrefetch?.(item.path)}
        aria-current={active ? 'page' : undefined}
      >
        {pageLabel(item)}
      </Link>
    );
  };

  const renderGroupBody = (item: FileItem, depth = 0) => {
    if (!item.children?.length) return null;
    const files = item.children.filter((child) => child.type === 'file');
    const dirs = item.children.filter((child) => child.type === 'directory');

    return (
      <div className={styles.pages}>
        {files.map((file) => renderFileLink(file))}
        {dirs.map((dir) => (
          <div key={dir.path} className={depth === 0 ? styles.subgroup : undefined}>
            <p className={styles.subgroupTitle}>{pageLabel(dir)}</p>
            {renderGroupBody(dir, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <nav className={styles.nav} aria-label="Documentation">
      {rootFiles.length > 0 && (
        <div className={styles.rootLinks}>{rootFiles.map((file) => renderFileLink(file))}</div>
      )}

      {groups.map((group) => {
        const isOpen = expanded[group.path] !== false;
        return (
          <div key={group.path} className={styles.group}>
            <button
              type="button"
              className={styles.groupHeader}
              onClick={() => toggleGroup(group.path)}
              aria-expanded={isOpen}
            >
              <span className={styles.groupTitle}>{pageLabel(group)}</span>
              <Icon
                icon={isOpen ? 'mingcute:down-line' : 'mingcute:right-line'}
                className={`h-3.5 w-3.5 ${styles.chevron}`}
              />
            </button>
            {isOpen ? renderGroupBody(group) : null}
          </div>
        );
      })}
    </nav>
  );
}
