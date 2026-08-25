import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { CommandPaletteProvider } from './providers/CommandPaletteProvider';
import HomePage from './pages/HomePage';
import HostedAssetRedirectPage from './pages/HostedAssetRedirectPage';
import NotFoundPage from './pages/NotFoundPage';
import { designBookConfig, homepageConfig, openapiConfig } from '../shared/documentation-config.js';
import { DEFAULT_DOCUMENT_PATH } from './lib/navigation';
import { getOpenApiRoutePrefix } from './lib/openapi';
import { buildDocsLandingPath } from '../shared/docsRouting.js';

const DocsPage = lazy(() => import('./pages/DocsPage'));
const OpenApiPage = lazy(() => import('./pages/OpenApiPage'));
const DesignBookPage = lazy(() => import('./pages/DesignBookPage'));

function RouteLoadingState() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ color: 'var(--muted-color)' }}
    >
      Loading documentation…
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CommandPaletteProvider>
        <Routes>
          {homepageConfig.enabled ? (
            <Route path="/" element={<HomePage />} />
          ) : (
            <Route
              path="/"
              element={<Navigate to={buildDocsLandingPath(DEFAULT_DOCUMENT_PATH)} replace />}
            />
          )}
          <Route
            path="/docs"
            element={<Navigate to={buildDocsLandingPath(DEFAULT_DOCUMENT_PATH)} replace />}
          />
          {openapiConfig.enabled ? (
            <Route
              path={`${getOpenApiRoutePrefix(openapiConfig)}/:specId?`}
              element={
                <Suspense fallback={<RouteLoadingState />}>
                  <OpenApiPage />
                </Suspense>
              }
            />
          ) : null}
          {designBookConfig.enabled ? (
            <Route
              path={designBookConfig.route || '/design'}
              element={
                <Suspense fallback={<RouteLoadingState />}>
                  <DesignBookPage />
                </Suspense>
              }
            />
          ) : null}
          <Route
            path="/docs/*"
            element={
              <Suspense fallback={<RouteLoadingState />}>
                <DocsPage />
              </Suspense>
            }
          />
          <Route path="/llms" element={<HostedAssetRedirectPage docPath="llms" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CommandPaletteProvider>
    </ThemeProvider>
  );
}
