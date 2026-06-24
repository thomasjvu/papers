import { Icon } from '@iconify/react';
import { useMemo, createElement, useState, useEffect, useRef } from 'react';

import { documentationTree } from '../../data/documentation';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagefind } from '../../hooks/usePagefind';
import { useTheme } from '../../providers/ThemeProvider';
import type { FileItem } from '../../types/documentation';
import { buildCanonicalDocsPath } from '../../../shared/docsRouting.js';
import { homepageConfig } from '../../../shared/documentation-config.js';

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
      'At the bottom of each documentation page, you will find "edit", "issue", and "source" links. Click "edit" to propose changes directly on GitHub, or "issue" to report problems.',
  },
  {
    question: 'What keyboard shortcuts are available?',
    answer:
      'Key shortcuts: Cmd/Ctrl + K (Command Palette), Cmd/Ctrl + I (Theme Toggle), Shift + Left/Right Arrow (Previous/Next doc), Escape (Close dialogs), Arrow keys (Navigate palette), Enter (Select).',
  },
  {
    question: 'How do I navigate between pages?',
    answer:
      'Use Shift + Left/Right Arrow on doc pages, the file tree on the left sidebar, the interactive mindmap on the right, or the Previous/Next buttons at the bottom of each page. You can also use this command palette to quickly jump to any page.',
  },
];

function getFaqPath(question: string): string {
  return `faq:${question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`;
}

function getFaqDescription(answer: string): string {
  const normalizedAnswer = answer.replace(/\s+/g, ' ').trim();
  return normalizedAnswer.length > 110
    ? `${normalizedAnswer.slice(0, 107).trimEnd()}...`
    : normalizedAnswer;
}

function createFaqResult(faq: (typeof FAQ_ITEMS)[number]): SearchResultType {
  return {
    title: faq.question,
    path: getFaqPath(faq.question),
    type: 'faq',
    description: getFaqDescription(faq.answer),
    answer: faq.answer,
    icon: createElement(Icon, { icon: 'mingcute:question-line', className: 'w-5 h-5' }),
  };
}

const FONT_OPTIONS = [
  { value: 'sans-serif' as const, label: 'Sans Serif', icon: 'mingcute:font-size-line' },
  { value: 'mono' as const, label: 'Monospace', icon: 'mingcute:code-line' },
  { value: 'serif' as const, label: 'Serif', icon: 'mingcute:text-line' },
];

export const useSearchLogic = (query: string) => {
  const { isDarkMode, toggleDarkMode, prefersReducedMotion, toggleReducedMotion, setFontFamily } =
    useTheme();
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
          description: `${result.excerpt.replace(/<[^>]*>/g, '').slice(0, 100)}...`,
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

  const preferenceCommands = useMemo<SearchResultType[]>(() => {
    const commands: SearchResultType[] = [
      {
        title: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        path: 'theme-toggle',
        type: 'theme',
        action: toggleDarkMode,
        icon: isDarkMode
          ? createElement(Icon, { icon: 'mingcute:sun-line', className: 'w-5 h-5' })
          : createElement(Icon, { icon: 'mingcute:moon-line', className: 'w-5 h-5' }),
        shortcut: 'I',
      },
      {
        title: prefersReducedMotion ? 'Enable Motion' : 'Reduce Motion',
        path: 'motion-toggle',
        type: 'action',
        action: toggleReducedMotion,
        icon: prefersReducedMotion
          ? createElement(Icon, { icon: 'mingcute:play-circle-line', className: 'w-5 h-5' })
          : createElement(Icon, { icon: 'mingcute:pause-circle-line', className: 'w-5 h-5' }),
      },
    ];

    FONT_OPTIONS.forEach((option) => {
      commands.push({
        title: `Font: ${option.label}`,
        path: `font-${option.value}`,
        type: 'action',
        action: () => setFontFamily(option.value),
        icon: createElement(Icon, { icon: option.icon, className: 'w-5 h-5' }),
      });
    });

    return commands;
  }, [isDarkMode, prefersReducedMotion, setFontFamily, toggleDarkMode, toggleReducedMotion]);

  const searchIndex = useMemo(() => {
    const results: SearchResultType[] = [...preferenceCommands];

    results.push({
      title: 'LLMs.txt - AI Documentation',
      path: '/llms.txt',
      type: 'page',
      icon: createElement(Icon, { icon: 'mingcute:file-line', className: 'w-5 h-5' }),
      shortcut: 'L',
    });

    const siteName = import.meta.env.VITE_SITE_NAME || 'Docs';
    results.push({
      title: `Agent Skill - ${siteName}`,
      path: '/skill.md',
      type: 'page',
      icon: createElement(Icon, { icon: 'mingcute:magic-2-line', className: 'w-5 h-5' }),
      shortcut: 'S',
    });

    FAQ_ITEMS.slice(0, 2).forEach((faq) => {
      results.push(createFaqResult(faq));
    });

    function processTree(items: FileItem[], parentPath = '') {
      items.forEach((item) => {
        if (item.type === 'file') {
          results.push({
            title: item.name.replace(/\.md$/, ''),
            path: buildCanonicalDocsPath(item.path),
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

    if (homepageConfig.enabled) {
      results.push({
        title: 'Go to Homepage',
        path: '/',
        type: 'action',
        icon: createElement(Icon, { icon: 'mingcute:home-2-line', className: 'w-5 h-5' }),
        shortcut: 'H',
      });
    }

    return results;
  }, [preferenceCommands]);

  const completeSearchIndex = useMemo(() => {
    const allResults = [...searchIndex];

    FAQ_ITEMS.slice(2).forEach((faq) => {
      allResults.push(createFaqResult(faq));
    });

    return allResults;
  }, [searchIndex]);

  const filteredResults = useMemo(() => {
    if (!debouncedQuery) {
      return searchIndex.slice(0, 10);
    }

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
