import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo, useCallback, useEffect } from 'react';

import { useTheme } from '../providers/ThemeProvider';
import type { FileItem } from '../types/documentation';

import styles from './FileTree.module.css';
import { findPathToFile, mergeExpandedPaths } from './FileTree/treeState';

type FileTreeProps = {
  items: FileItem[];
  onSelect: (item: FileItem) => void;
  currentPath?: string;
  defaultOpenAll?: boolean;
};

type FileTreeItemProps = {
  item: FileItem;
  onSelect: (item: FileItem) => void;
  depth: number;
  onToggle: (path: string) => void;
  currentPath?: string;
};

const NESTED_INDENT_STEP = 14;

const FileTreeItem: React.FC<FileTreeItemProps> = React.memo(
  ({ item, onSelect, depth, onToggle, currentPath }) => {
    const { prefersReducedMotion } = useTheme();
    const isActive = currentPath === item.path;
    const isDirectory = item.type === 'directory';
    const hasChildren = isDirectory && item.children && item.children.length > 0;
    const indent = depth * NESTED_INDENT_STEP;

    const handleClick = useCallback(() => {
      if (isDirectory && hasChildren) {
        onToggle(item.path);
      } else {
        onSelect(item);
      }
    }, [hasChildren, isDirectory, item, onSelect, onToggle]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          handleClick();
          event.preventDefault();
        }
      },
      [handleClick]
    );

    return (
      <div>
        <div
          className={`${styles.fileTreeItem} flex items-center py-0.5 ${isActive ? 'active' : ''}`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role={isDirectory ? 'button' : 'link'}
          aria-expanded={isDirectory ? item.expanded : undefined}
          style={{
            cursor: 'pointer',
            fontFamily: 'var(--mono-font)',
            letterSpacing: '-0.5px',
            fontSize: 'calc(var(--text-sm) + 1px)',
            paddingLeft: `${indent}px`,
          }}
        >
          <span className="mr-2 flex items-center">
            {isDirectory ? (
              <Icon
                icon={item.expanded ? 'mingcute:folder-open-line' : 'mingcute:folder-line'}
                className="h-4 w-4"
              />
            ) : (
              <Icon icon="mingcute:file-line" className="h-4 w-4" />
            )}
          </span>

          <span className="truncate">
            {item.type === 'file' ? item.name.replace(/ /g, '-').toLowerCase() : item.name}
          </span>
        </div>

        <AnimatePresence>
          {isDirectory && item.expanded && item.children && (
            <motion.div
              className="file-tree-children"
              initial={{
                height: 0,
                opacity: prefersReducedMotion ? 1 : 0,
              }}
              animate={{
                height: 'auto',
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: prefersReducedMotion ? 1 : 0,
              }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : 0.2,
                ease: 'easeInOut',
              }}
              style={{ overflow: 'hidden' }}
            >
              {item.children.map((child) => (
                <FileTreeItem
                  key={child.path}
                  item={child}
                  onSelect={onSelect}
                  depth={depth + 1}
                  onToggle={onToggle}
                  currentPath={currentPath}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FileTreeItem.displayName = 'FileTreeItem';

const FileTree: React.FC<FileTreeProps> = ({
  items,
  onSelect,
  currentPath,
  defaultOpenAll = false,
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
    if (!defaultOpenAll || !currentPath) {
      return {};
    }

    const pathsToExpand = findPathToFile(items, currentPath);
    return pathsToExpand ? mergeExpandedPaths({}, pathsToExpand) : {};
  });

  useEffect(() => {
    if (!defaultOpenAll || !currentPath) {
      return;
    }

    const pathsToExpand = findPathToFile(items, currentPath);
    if (!pathsToExpand) {
      return;
    }

    setExpandedItems((prev) => mergeExpandedPaths(prev, pathsToExpand));
  }, [items, currentPath, defaultOpenAll]);

  const toggleItem = useCallback((path: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  }, []);

  const itemsWithState = useMemo(() => {
    const addStateToItems = (entries: FileItem[]): FileItem[] => {
      return entries.map((item) => ({
        ...item,
        expanded: expandedItems[item.path] ?? false,
        children: item.children ? addStateToItems(item.children) : undefined,
      }));
    };

    return addStateToItems(items);
  }, [items, expandedItems]);

  return (
    <div className={styles.fileTree}>
      {itemsWithState.map((item) => (
        <FileTreeItem
          key={item.path}
          item={item}
          onSelect={onSelect}
          depth={0}
          onToggle={toggleItem}
          currentPath={currentPath}
        />
      ))}
    </div>
  );
};

export default React.memo(FileTree);
