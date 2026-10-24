import { useCallback, useEffect, useState } from 'react';

import { contentCollections } from '../../shared/content-collections.js';
import {
  buildCanonicalCollectionPath,
  buildCanonicalDocsPath,
  parseCollectionRoutePath,
} from '../../shared/docsRouting.js';
import { PAGEFIND_RANKING, rankSearchResults, type PagefindFilters } from '../lib/searchRanking.ts';

interface PagefindResult {
  url: string;
  meta: {
    title: string;
    /** Parent page title for heading-level (section) results. */
    page?: string;
  };
  excerpt: string;
  score: number;
}

interface PagefindResultData {
  url: string;
  meta?: {
    title?: string;
    page?: string;
  };
  excerpt?: string;
}

interface PagefindSearchMatch {
  score: number;
  data: () => Promise<PagefindResultData>;
}

interface PagefindSearchResult {
  results: PagefindSearchMatch[];
}

interface PagefindInstance {
  search: (query: string, options?: { filters?: PagefindFilters }) => Promise<PagefindSearchResult>;
  init: () => Promise<void>;
  options?: (options: { ranking?: typeof PAGEFIND_RANKING }) => Promise<void>;
}

/** Results to load per query; Pagefind returns every match, but data() is per page. */
const MAX_LOADED_RESULTS = 20;

function normalizeCollectionPrefix(routePrefix: string): string {
  return routePrefix.replace(/^\/+|\/+$/g, '');
}

export function normalizePagefindUrl(url: string, collections = contentCollections): string {
  if (url.startsWith('/search-pages/')) {
    const docPath = url
      .replace(/^\/search-pages\//, '')
      .replace(/\.html$/, '')
      .replace(/_/g, '/');
    if (docPath === 'llms') {
      return '/llms.txt';
    }

    if (docPath === 'skill') {
      return '/skill.md';
    }

    const collection = collections.find((entry) => {
      const prefix = normalizeCollectionPrefix(entry.routePrefix || '/docs');
      return docPath === prefix || docPath.startsWith(`${prefix}/`);
    });

    if (collection) {
      const routeContext = parseCollectionRoutePath(collection, docPath);
      return buildCanonicalCollectionPath(collection, routeContext.docPath, {
        version: routeContext.activeVersion,
        locale: routeContext.activeLocale,
      });
    }

    return buildCanonicalDocsPath(docPath);
  }

  return url.replace(/\/index\.html$/, '/');
}

declare global {
  interface Window {
    pagefind?: {
      init: () => Promise<void>;
      search: (query: string) => Promise<PagefindSearchResult>;
    };
  }
}

export interface UsePagefindResult {
  search: (query: string, filters?: PagefindFilters) => Promise<PagefindResult[]>;
  isLoading: boolean;
  isAvailable: boolean;
}

const PAGEFIND_MODULE_URL = '/pagefind/pagefind.js';

let pagefindInstancePromise: Promise<PagefindInstance | null> | null = null;

/**
 * pagefind.js is an ES module that exports its API; it never sets
 * `window.pagefind`, so a classic script tag left search on the fallback path.
 * Import it directly (it only exists in production builds).
 */
async function importPagefind(): Promise<PagefindInstance | null> {
  if (window.pagefind) {
    return window.pagefind as unknown as PagefindInstance;
  }
  const moduleUrl = PAGEFIND_MODULE_URL;
  const pagefindModule = (await import(/* @vite-ignore */ moduleUrl)) as PagefindInstance;
  window.pagefind = pagefindModule as unknown as Window['pagefind'];
  return pagefindModule;
}

async function getInitializedPagefind(): Promise<PagefindInstance | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (pagefindInstancePromise) {
    return pagefindInstancePromise;
  }

  pagefindInstancePromise = (async () => {
    try {
      const instance = await importPagefind();
      if (!instance) {
        return null;
      }

      await instance.options?.({ ranking: PAGEFIND_RANKING });
      await instance.init();
      return instance;
    } catch (error) {
      console.warn('Failed to load Pagefind:', error);
      pagefindInstancePromise = null;
      return null;
    }
  })();

  return pagefindInstancePromise;
}

export function usePagefind(): UsePagefindResult {
  const [pagefindInstance, setPagefindInstance] = useState<PagefindInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getInitializedPagefind().then((instance) => {
      if (!isMounted) {
        return;
      }

      if (instance) {
        setPagefindInstance(instance);
        setIsAvailable(true);
      } else {
        console.warn('Pagefind not available - search will use fallback');
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const search = useCallback(
    async (query: string, filters?: PagefindFilters): Promise<PagefindResult[]> => {
      if (!pagefindInstance || !query.trim()) {
        return [];
      }

      try {
        const results = await pagefindInstance.search(
          query,
          filters && Object.keys(filters).length > 0 ? { filters } : undefined
        );

        const loaded = await Promise.all(
          results.results.slice(0, MAX_LOADED_RESULTS).map(async (result) => {
            const data = await result.data();
            const [rawPath, anchor] = data.url.split('#');
            const url = `${normalizePagefindUrl(rawPath)}${anchor ? `#${anchor}` : ''}`;

            return {
              url,
              meta: {
                title: data.meta?.title || url,
                ...(data.meta?.page ? { page: data.meta.page } : {}),
              },
              excerpt: data.excerpt || '',
              score: result.score,
            };
          })
        );
        return rankSearchResults(loaded, query);
      } catch (error) {
        console.error('Pagefind search error:', error);
        return [];
      }
    },
    [pagefindInstance]
  );

  return {
    search,
    isLoading,
    isAvailable,
  };
}
