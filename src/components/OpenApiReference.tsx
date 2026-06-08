import '@scalar/api-reference-react/style.css';

import { lazy, Suspense, useEffect } from 'react';

const ScalarApiReference = lazy(() =>
  import('@scalar/api-reference-react').then((module) => ({
    default: module.ApiReferenceReact,
  }))
);

type OpenApiReferenceProps = {
  specUrl?: string;
};

export default function OpenApiReference({ specUrl = '/openapi-v1.yaml' }: OpenApiReferenceProps) {
  useEffect(() => {
    document.documentElement.classList.add('papers-openapi-page');
    return () => {
      document.documentElement.classList.remove('papers-openapi-page');
    };
  }, []);

  return (
    <div className="openapi-reference-shell w-full">
      <Suspense
        fallback={
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
        }
      >
        <ScalarApiReference
          configuration={{
            spec: {
              url: specUrl,
            },
            hideDownloadButton: false,
            hideModels: false,
            darkMode: true,
            forceDarkModeState: 'dark',
            customCss: `
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
            `,
          }}
        />
      </Suspense>
    </div>
  );
}
