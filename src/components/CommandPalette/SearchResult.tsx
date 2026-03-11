import { motion } from 'framer-motion';
import React from 'react';

export interface SearchResultType {
  title: string;
  path: string;
  type: 'page' | 'action' | 'theme' | 'ai' | 'faq';
  description?: string;
  action?: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
  answer?: string;
}

interface SearchResultProps {
  result: SearchResultType;
  index: number;
  isSelected: boolean;
  onSelect: (result: SearchResultType) => void;
  onMouseEnter: (index: number) => void;
}

function getShortcutLabel(shortcut: string): string {
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
  const modifier = isMac ? 'Cmd' : 'Ctrl';
  const keys = shortcut.split('+').filter(Boolean);

  return [modifier, ...keys].join(' + ');
}

const SearchResult: React.FC<SearchResultProps> = React.memo(
  ({ result, index, isSelected, onSelect, onMouseEnter }) => {
    return (
      <motion.button
        key={result.path}
        onClick={() => onSelect(result)}
        onMouseEnter={() => onMouseEnter(index)}
        className="w-full px-4 py-3 flex items-center gap-3 transition-all text-left relative"
        style={{
          backgroundColor: isSelected ? 'rgba(var(--primary-color-rgb), 0.1)' : 'transparent',
          color: 'var(--text-color)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
      >
        <span className="text-xl">{result.icon}</span>
        <div className="flex-1">
          <div className="font-medium">{result.title}</div>
          {result.description && (
            <div
              className="text-xs opacity-70"
              style={{
                color: 'var(--muted-color)',
                fontFamily: 'var(--mono-font)',
              }}
            >
              {result.description}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {result.shortcut && (
            <kbd
              className="px-2 py-1 text-xs rounded border font-mono"
              style={{
                borderColor: isSelected ? 'var(--primary-color)' : 'var(--border-color)',
                backgroundColor: isSelected ? 'var(--primary-color)' : 'var(--hover-color)',
                color: isSelected ? 'var(--selection-text-color)' : 'var(--text-color)',
              }}
            >
              {getShortcutLabel(result.shortcut)}
            </kbd>
          )}
          {result.type === 'action' && (
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'var(--selection-text-color)',
                fontFamily: 'var(--mono-font)',
              }}
            >
              action
            </span>
          )}
          {result.type === 'faq' && (
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--secondary-color)',
                color: 'var(--selection-text-color)',
                fontFamily: 'var(--mono-font)',
              }}
            >
              faq
            </span>
          )}
        </div>
      </motion.button>
    );
  }
);

SearchResult.displayName = 'SearchResult';

export default SearchResult;
