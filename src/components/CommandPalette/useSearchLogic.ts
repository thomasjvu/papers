import { Icon } from '@iconify/react';
import { useMemo, createElement, useState, useEffect, useRef } from 'react';

import { documentationTree } from '../../data/documentation';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagefind } from '../../hooks/usePagefind';
import { useTheme } from '../../providers/ThemeProvider';
import type { FileItem } from '../../types/documentation';

import type { SearchResultType } from './SearchResult';
import { combineSearchResults } from './searchUtils';

const FAQ_ITEMS = [
  {
    question: 'How do I change the theme?',
    answer:
      'You can change the theme using Cmd + I (Mac) or Ctrl + I (Windows/Linux). Alternatively, use the theme toggle button in the navigation bar or select "Switch to Dark/Light Mode" from this command palette.',
  },
  {
    question: 'How do I search the documentation?',
    answer:
      'Use Cmd + K (Mac) or Ctrl + K (Windows/Linux) to open this command palette, then type your search query.',
  },
  {
    question: 'How can I contribute to the documentation?',
    answer:
      'At the bottom of each documentation page, you\'ll find "edit", "issue", and "source" links. Click "edit" to propose changes directly on GitHub, or "issue" to report problems.',
  },
  {
    question: 'What keyboard shortcuts are available?',
    answer:
      'Key shortcuts: Cmd/Ctrl + K (Command Palette), Cmd/Ctrl + I (Theme Toggle), Escape (Close dialogs), Arrow keys (Navigate), Enter (Select).',
  },
  {
    question: 'How do I navigate between pages?',
    answer:
      'Use the file tree on the left sidebar, the interactive mindmap on the right, or the Previous/Next buttons at the bottom of each page. You can also use this command palette to quickly jump to any page.',
  },
];

export const useSearchLogic = (query: string) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const debouncedQuery = useDebounce(query, 150);
  const { search: pagefindSearch, isAvailable: pagefindAvailable } = usePagefind();
  const [pagefindResults, setPagefindResults] = useState<SearchResultType[]>([]);
  const latestQueryRef = useRef('');

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();
    latestQueryRef.current = trimmedQuery;

    if (!pagefindAvailable || !trimmedQuery) {
      setPagefindResults([]);
      return;
    }

    let cancelled = false;

    void pagefindSearch(trimmedQuery)
      .then((results) => {
        if (cancelled || latestQueryRef.current !== trimmedQuery) {
          return;
        }

        const formattedResults: SearchResultType[] = results.slice(0, 5).map((result) => ({
          title: result.meta.title,
          path: result.url,
          type: 'page' as const,
          description: result.excerpt.replace(/<[^>]*>/g, '').slice(0, 100) + '...',
          icon: createElement(Icon, { icon: 'mingcute:file-line', className: 'w-5 h-5' }),
        }));
        setPagefindResults(formattedResults);
      })
      .catch(() => {
        if (!cancelled && latestQueryRef.current === trimmedQuery) {
          setPagefindResults([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, pagefindAvailable, pagefindSearch]);

  const searchIndex = useMemo(() => {
    const results: SearchResultType[] = [];

    results.push({
      title: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      path: 'theme-toggle',
      type: 'theme',
      description: 'Toggle between light and dark themes',
      action: toggleDarkMode,
      icon: isDarkMode
        ? createElement(Icon, { icon: 'mingcute:sun-line', className: 'w-5 h-5' })
        : createElement(Icon, { icon: 'mingcute:moon-line', className: 'w-5 h-5' }),
      shortcut: 'I',
    });

    results.push({
      title: 'LLMs.txt - AI Documentation',
      path: '/llms',
      type: 'page',
      description: 'View and download AI-friendly documentation format',
      icon: createElement(Icon, { icon: 'mingcute:file-line', className: 'w-5 h-5' }),
      shortcut: 'L',
    });

    FAQ_ITEMS.slice(0, 2).forEach((faq, index) => {
      results.push({
        title: faq.question,
        path: `faq-${index}`,
        type: 'faq',
        description: 'Frequently Asked Question',
        answer: faq.answer,
        icon: createElement(Icon, { icon: 'mingcute:question-line', className: 'w-5 h-5' }),
      });
    });

    function processTree(items: FileItem[], parentPath = '') {
      items.forEach((item) => {
        if (item.type === 'file') {
          results.push({
            title: item.name.replace(/\.md$/, ''),
            path: `/docs/${item.path}`,
            type: 'page',
            description: parentPath,
            icon: createElement(Icon, { icon: 'mingcute:file-line', className: 'w-5 h-5' }),
          });
        } else if (item.type === 'directory' && item.children) {
          const nextParentPath = parentPath ? `${parentPath} / ${item.name}` : item.name;
          processTree(item.children, nextParentPath);
        }
      });
    }

    processTree(documentationTree);

    results.push({
      title: 'Go to Homepage',
      path: '/',
      type: 'action',
      description: 'Navigate to the main page',
      icon: createElement(Icon, { icon: 'mingcute:home-2-line', className: 'w-5 h-5' }),
      shortcut: 'H',
    });

    return results;
  }, [isDarkMode, toggleDarkMode]);

  const completeSearchIndex = useMemo(() => {
    const allResults = [...searchIndex];

    FAQ_ITEMS.slice(2).forEach((faq, index) => {
      allResults.push({
        title: faq.question,
        path: `faq-${index + 2}`,
        type: 'faq',
        description: 'Frequently Asked Question',
        answer: faq.answer,
        icon: createElement(Icon, { icon: 'mingcute:question-line', className: 'w-5 h-5' }),
      });
    });

    return allResults;
  }, [searchIndex]);

  const filteredResults = useMemo(() => {
    if (!debouncedQuery) return searchIndex.slice(0, 8);

    const lowerQuery = debouncedQuery.toLowerCase();
    const results: SearchResultType[] = [];

    const exactMatches: SearchResultType[] = [];
    const titleStartMatches: SearchResultType[] = [];
    const titleContainMatches: SearchResultType[] = [];
    const descriptionMatches: SearchResultType[] = [];

    for (const item of completeSearchIndex) {
      const titleLower = item.title.toLowerCase();
      const descLower = item.description?.toLowerCase() || '';

      if (titleLower === lowerQuery) {
        exactMatches.push(item);
      } else if (titleLower.startsWith(lowerQuery)) {
        titleStartMatches.push(item);
      } else if (titleLower.includes(lowerQuery)) {
        titleContainMatches.push(item);
      } else if (descLower.includes(lowerQuery)) {
        descriptionMatches.push(item);
      }
    }

    results.push(
      ...exactMatches,
      ...titleStartMatches,
      ...titleContainMatches,
      ...descriptionMatches
    );

    return results.slice(0, 8);
  }, [debouncedQuery, searchIndex, completeSearchIndex]);

  const combinedResults = useMemo(() => {
    return combineSearchResults(filteredResults, pagefindResults, {
      query: debouncedQuery,
      pagefindAvailable,
      limit: 10,
    });
  }, [debouncedQuery, pagefindAvailable, filteredResults, pagefindResults]);

  return {
    searchIndex,
    filteredResults: combinedResults,
    debouncedQuery,
    pagefindAvailable,
  };
};
