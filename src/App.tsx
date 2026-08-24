import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { CommandPaletteProvider } from './providers/CommandPaletteProvider';
import HomePage from './pages/HomePage';
import DocsPage from './pages/DocsPage';
import HostedAssetRedirectPage from './pages/HostedAssetRedirectPage';
import OpenApiPage from './pages/OpenApiPage';
import NotFoundPage from './pages/NotFoundPage';
import DesignBookPage from './pages/DesignBookPage';
import { designBookConfig, homepageConfig, openapiConfig } from '../shared/documentation-config.js';
import { DEFAULT_DOCUMENT_PATH } from './lib/navigation';
import { getOpenApiRoutePrefix } from './lib/openapi';
import { buildDocsLandingPath } from '../shared/docsRouting.js';

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
              element={<OpenApiPage />}
            />
          ) : null}
          {designBookConfig.enabled ? (
            <Route path={designBookConfig.route || '/design'} element={<DesignBookPage />} />
          ) : null}
          <Route path="/docs/*" element={<DocsPage />} />
          <Route path="/llms" element={<HostedAssetRedirectPage docPath="llms" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CommandPaletteProvider>
    </ThemeProvider>
  );
}
