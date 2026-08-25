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
    --scalar-color-1: var(--text-color, #9bbc0f);
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

    setIsLoading(true);
    setError(null);

    const container = containerRef.current;
    if (!container) {
      setIsLoading(false);
      setError('API reference mount point is unavailable.');
      return () => {
        cancelled = true;
      };
    }

    void import('@scalar/api-reference')
      .then(({ createApiReference }) => {
        if (cancelled) {
          return;
        }

        scalarInstance = createApiReference(container, configuration);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        scalarInstance?.destroy();
        setIsLoading(false);
        setError('Unable to load the API reference.');
      });

    return () => {
      cancelled = true;
      scalarInstance?.destroy();
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
