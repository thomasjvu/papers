import { Icon } from '@iconify/react';
import { useMemo, createElement, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useDebounce } from '../../hooks/useDebounce';
import { usePagefind } from '../../hooks/usePagefind';
import { useTheme } from '../../providers/useTheme';
import type { FileItem } from '../../types/documentation';
import { contentCollections, getCollectionVariants } from '../../../shared/content-collections.js';
import {
  buildCanonicalCollectionPath,
  parseCollectionRoutePath,
} from '../../../shared/docsRouting.js';
import { homepageConfig } from '../../../shared/documentation-config.js';
import { getLocaleLabel, i18nConfig, languageSwitcherShows } from '../../lib/chrome';

import type { SearchResultType } from './SearchResult';
import { combineSearchResults } from './searchUtils';
import {
  buildSearchFilters,
  parseSearchScope,
  resolveSearchSection,
  type SearchScopeFilter,
} from '../../lib/searchRanking.ts';

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
    question: 'How do I change the language?',
    answer:
      'When multiple locales are enabled in i18nConfig, use the language control in the sidebar or open this command palette and type "language" or a locale label to switch while staying on the same page.',
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
      'Use Shift + Left/Right Arrow on doc pages, the sidebar navigation, the interactive mindmap on the right, or the Previous/Next buttons at the bottom of each page. You can also use this command palette to quickly jump to any page.',
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

function normalizeRoutePath(pathname: string): string {
  return pathname.replace(/^\/+|\/+$/g, '');
}

function getCollectionRouteContext(pathname: string) {
  const normalizedPath = normalizeRoutePath(pathname);
  const collection =
    contentCollections.find((entry) => {
      const prefix = normalizeRoutePath(entry.routePrefix || 'docs');
      return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
    }) || contentCollections[0];

  if (!collection) {
    return {
      collection: null,
      activeLocale: null,
      activeVersion: null,
      docPath: '',
      i18nConfig,
    };
  }

  const parsed = parseCollectionRoutePath(collection, normalizedPath);
  const variants = getCollectionVariants(collection);

  return {
    collection,
    activeLocale: parsed.activeLocale,
    activeVersion: parsed.activeVersion,
    docPath: parsed.docPath,
    i18nConfig: variants.i18nConfig,
  };
}

const FONT_OPTIONS = [
  { value: 'sans-serif' as const, label: 'Sans Serif', icon: 'mingcute:font-size-line' },
  { value: 'mono' as const, label: 'Monospace', icon: 'mingcute:code-line' },
  { value: 'serif' as const, label: 'Serif', icon: 'mingcute:text-line' },
];

export const useSearchLogic = (query: string, scopeFilter: SearchScopeFilter = 'all') => {
  const { isDarkMode, toggleDarkMode, prefersReducedMotion, toggleReducedMotion, setFontFamily } =
    useTheme();
  const debouncedQuery = useDebounce(query, 150);
  const { search: pagefindSearch, isAvailable: pagefindAvailable } = usePagefind();
  const [pagefindResults, setPagefindResults] = useState<SearchResultType[]>([]);
  const latestQueryRef = useRef('');
  const { pathname } = useLocation();
  const searchVariant = useMemo(() => getCollectionRouteContext(pathname), [pathname]);

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();
    latestQueryRef.current = trimmedQuery;
    const scope = parseSearchScope(trimmedQuery);
    const section = resolveSearchSection(scope.section, scopeFilter);

    if (!pagefindAvailable || !scope.query) {
      setPagefindResults([]);
      return;
    }

    let cancelled = false;
    const filters = buildSearchFilters({
      section,
      version: searchVariant.activeVersion,
      locale: searchVariant.activeLocale,
    });

    void pagefindSearch(scope.query, filters)
      .then((results) => {
        if (cancelled || latestQueryRef.current !== trimmedQuery) {
          return;
        }

        const limit = section ? 10 : 5;
        const formattedResults: SearchResultType[] = results.slice(0, limit).map((result) => {
          const excerpt = `${result.excerpt.replace(/<[^>]*>/g, '').slice(0, 100)}...`;
          const isSection = Boolean(result.meta.page) && result.url.includes('#');
          return {
            title: result.meta.title,
            path: result.url,
            type: 'page' as const,
            // Heading-level results name their page so "Install" under two
            // guides stays distinguishable.
            description: isSection ? `${result.meta.page} › ${excerpt}` : excerpt,
            section: isSection ? result.meta.page : undefined,
            icon: createElement(Icon, {
              icon: isSection ? 'mingcute:hashtag-line' : 'mingcute:file-line',
              className: 'w-5 h-5',
            }),
          };
        });
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
  }, [debouncedQuery, pagefindAvailable, pagefindSearch, searchVariant, scopeFilter]);

  const navigate = useNavigate();
  const location = useLocation();
  const routeContext = useMemo(
    () => getCollectionRouteContext(location.pathname),
    [location.pathname]
  );

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

    if (languageSwitcherShows('command-palette')) {
      const activeLocale = routeContext.activeLocale || routeContext.i18nConfig.defaultLocale;
      const docPath = routeContext.docPath || 'index';
      for (const locale of routeContext.i18nConfig.locales || []) {
        if (locale === activeLocale) continue;
        const label = getLocaleLabel(locale);
        commands.push({
          title: `Switch to ${label}`,
          path: `locale:${locale}`,
          type: 'action',
          description: `Change documentation language to ${label}`,
          action: () => {
            if (!routeContext.collection) return;
            navigate(
              buildCanonicalCollectionPath(routeContext.collection, docPath, {
                version: routeContext.activeVersion,
                locale,
              })
            );
          },
          icon: createElement(Icon, {
            icon: 'mingcute:translate-2-line',
            className: 'w-5 h-5',
          }),
        });
      }
    }

    return commands;
  }, [
    isDarkMode,
    prefersReducedMotion,
    setFontFamily,
    toggleDarkMode,
    toggleReducedMotion,
    navigate,
    routeContext.activeLocale,
    routeContext.activeVersion,
    routeContext.docPath,
    routeContext.collection,
    routeContext.i18nConfig,
  ]);

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

    function processTree(
      items: FileItem[],
      collection: (typeof contentCollections)[number],
      parentPath = ''
    ) {
      items.forEach((item) => {
        if (item.type === 'file') {
          const routeOptions =
            routeContext.collection?.id === collection.id
              ? {
                  version: routeContext.activeVersion,
                  locale: routeContext.activeLocale,
                }
              : {};
          const collectionDescription =
            contentCollections.length > 1
              ? [collection.label, parentPath].filter(Boolean).join(' / ')
              : parentPath;
          results.push({
            title: item.name.replace(/\.(?:md|mdx)$/, ''),
            path: buildCanonicalCollectionPath(collection, item.path, routeOptions),
            type: 'page',
            description: collectionDescription,
            icon: createElement(Icon, { icon: 'mingcute:file-line', className: 'w-5 h-5' }),
          });
        } else if (item.type === 'directory' && item.children) {
          const nextParentPath = parentPath ? `${parentPath} / ${item.name}` : item.name;
          processTree(item.children, collection, nextParentPath);
        }
      });
    }

    for (const collection of contentCollections) {
      processTree(collection.tree, collection);
    }

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
  }, [
    preferenceCommands,
    routeContext.activeLocale,
    routeContext.activeVersion,
    routeContext.collection,
  ]);

  const completeSearchIndex = useMemo(() => {
    const allResults = [...searchIndex];

    FAQ_ITEMS.slice(2).forEach((faq) => {
      allResults.push(createFaqResult(faq));
    });

    return allResults;
  }, [searchIndex]);

  const filteredResults = useMemo(() => {
    // Scope buttons narrow the palette to Pagefind sections; commands, FAQ and
    // agent artifacts only show under "All". Docs keeps the local page list so
    // dev servers (no Pagefind index) still list guides.
    const scopedIndex =
      scopeFilter === 'all'
        ? null
        : scopeFilter === 'docs'
          ? completeSearchIndex.filter(
              (item) =>
                item.type === 'page' &&
                item.path.startsWith('/') &&
                !/\.(?:txt|md)$/.test(item.path)
            )
          : [];

    if (!debouncedQuery) {
      return (scopedIndex ?? searchIndex).slice(0, 10);
    }

    const lowerQuery = debouncedQuery.toLowerCase();
    const results: SearchResultType[] = [];

    const exactMatches: SearchResultType[] = [];
    const titleStartMatches: SearchResultType[] = [];
    const titleContainMatches: SearchResultType[] = [];
    const descriptionMatches: SearchResultType[] = [];

    for (const item of scopedIndex ?? completeSearchIndex) {
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
  }, [debouncedQuery, searchIndex, completeSearchIndex, scopeFilter]);

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
