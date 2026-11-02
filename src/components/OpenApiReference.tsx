import { useEffect, useMemo, useRef, useState } from 'react';

import { useTheme } from '../providers/useTheme';
import { openapiConfig } from '../../shared/documentation-config.js';
import { getOpenApiSpecUrl } from '../../shared/openapiSpecUrls.js';

type OpenApiReferenceProps = {
  specUrl?: string;
};

const scalarCustomCss = `
  .scalar-api-reference {
    --scalar-background-1: var(--background-color, #0f380f);
    --scalar-background-2: var(--card-color, #1a4d1a);
    --scalar-background-3: var(--surface-color, #1a4d1a);
    --scalar-color-1: var(--papers-text-color, #9bbc0f);
    --scalar-color-2: var(--muted-color, #8bac0f);
    --scalar-color-accent: var(--primary-color, #9bbc0f);
    --scalar-border-color: var(--border-unified, #8bac0f);
    --scalar-font: var(--mono-font, 'IBM Plex Mono', monospace);
    --scalar-font-code: var(--mono-font, 'IBM Plex Mono', monospace);
  }
`;

export default function OpenApiReference({ specUrl = '/openapi-v1.yaml' }: OpenApiReferenceProps) {
  const { isDarkMode } = useTheme();
  const safeSpecUrl = getOpenApiSpecUrl({ url: specUrl }, openapiConfig);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<
    { status: 'loading' | 'mounted' } | { status: 'failed'; error: string }
  >({ status: 'loading' });
  const isLoading = state.status === 'loading';
  const error = state.status === 'failed' ? state.error : null;
  const configuration = useMemo(
    () => ({
      spec: {
        url: safeSpecUrl,
      },
      hideDownloadButton: false,
      hideModels: false,
      darkMode: isDarkMode,
      forceDarkModeState: isDarkMode ? ('dark' as const) : ('light' as const),
      customCss: scalarCustomCss,
    }),
    [isDarkMode, safeSpecUrl]
  );

  useEffect(() => {
    document.documentElement.classList.add('papers-openapi-page');
    return () => {
      document.documentElement.classList.remove('papers-openapi-page');
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let scalarInstance: { destroy: () => void } | undefined;
    let scalarStyles: HTMLStyleElement | undefined;

    setState({ status: 'loading' });

    const container = containerRef.current;
    if (!container) {
      setState({ status: 'failed', error: 'API reference mount point is unavailable.' });
      return () => {
        cancelled = true;
      };
    }

    void Promise.all([
      import('@scalar/api-reference'),
      import('@scalar/api-reference/style.css?inline'),
    ])
      .then(([{ createApiReference }, { default: css }]) => {
        if (cancelled) {
          return;
        }

        scalarStyles = document.createElement('style');
        scalarStyles.dataset.papersScalarStyles = '';
        scalarStyles.textContent = css;
        document.head.append(scalarStyles);
        scalarInstance = createApiReference(container, configuration);
        setState({ status: 'mounted' });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        scalarInstance?.destroy();
        scalarStyles?.remove();
        setState({ status: 'failed', error: 'Unable to load the API reference.' });
      });

    return () => {
      cancelled = true;
      scalarInstance?.destroy();
      scalarStyles?.remove();
    };
  }, [configuration]);

  return (
    <div className="openapi-reference-shell w-full">
      {isLoading ? (
        <div
          className="rounded-lg border px-4 py-6 text-sm"
          style={{
            borderColor: 'var(--border-unified)',
            color: 'var(--muted-color)',
            fontFamily: 'var(--mono-font)',
          }}
        >
          Loading API reference...
        </div>
      ) : null}
      {error ? (
        <div
          className="rounded-lg border px-4 py-6 text-sm"
          role="alert"
          style={{
            borderColor: 'var(--border-unified)',
            color: 'var(--muted-color)',
            fontFamily: 'var(--mono-font)',
          }}
        >
          {error}
        </div>
      ) : null}
      <div ref={containerRef} className={isLoading || error ? 'hidden' : 'w-full'} />
    </div>
  );
}
