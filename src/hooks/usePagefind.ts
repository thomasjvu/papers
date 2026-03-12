import { useCallback, useEffect, useState } from 'react';

import { buildCanonicalDocsPath } from '../../shared/docsRouting.js';

interface PagefindResult {
  url: string;
  meta: {
    title: string;
  };
  excerpt: string;
  score: number;
}

interface PagefindResultData {
  url: string;
  meta?: {
    title?: string;
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
  search: (query: string) => Promise<PagefindSearchResult>;
  init: () => Promise<void>;
}

function normalizePagefindUrl(url: string): string {
  if (url.startsWith('/search-pages/')) {
    const docPath = url
      .replace(/^\/search-pages\//, '')
      .replace(/\.html$/, '')
      .replace(/_/g, '/');
    return docPath === 'llms' ? '/llms' : buildCanonicalDocsPath(docPath);
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
  search: (query: string) => Promise<PagefindResult[]>;
  isLoading: boolean;
  isAvailable: boolean;
}

const PAGEFIND_SCRIPT_SELECTOR = 'script[data-pagefind-loader="true"]';

let pagefindScriptPromise: Promise<void> | null = null;
let pagefindInstancePromise: Promise<PagefindInstance | null> | null = null;

function loadPagefindScript(): Promise<void> {
  if (typeof window === 'undefined' || window.pagefind) {
    return Promise.resolve();
  }

  if (pagefindScriptPromise) {
    return pagefindScriptPromise;
  }

  pagefindScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      PAGEFIND_SCRIPT_SELECTOR
    ) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement('script');

    const cleanup = () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };

    const handleLoad = () => {
      script.dataset.loaded = 'true';
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      pagefindScriptPromise = null;
      reject(new Error('Pagefind script failed to load'));
    };

    if (window.pagefind || script.dataset.loaded === 'true') {
      resolve();
      return;
    }

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    if (!existingScript) {
      script.src = '/pagefind/pagefind.js';
      script.async = true;
      script.dataset.pagefindLoader = 'true';
      document.head.appendChild(script);
    }
  });

  return pagefindScriptPromise;
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
      await loadPagefindScript();

      if (!window.pagefind) {
        return null;
      }

      await window.pagefind.init();
      return window.pagefind as unknown as PagefindInstance;
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
    async (query: string): Promise<PagefindResult[]> => {
      if (!pagefindInstance || !query.trim()) {
        return [];
      }

      try {
        const results = await pagefindInstance.search(query);

        return Promise.all(
          results.results.map(async (result) => {
            const data = await result.data();
            const url = normalizePagefindUrl(data.url);

            return {
              url,
              meta: {
                title: data.meta?.title || url,
              },
              excerpt: data.excerpt || '',
              score: result.score,
            };
          })
        );
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
