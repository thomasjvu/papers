import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { CommandPaletteProvider } from './providers/CommandPaletteProvider';
import HomePage from './pages/HomePage';
import DocsPage from './pages/DocsPage';
import LLMSPage from './pages/LLMSPage';
import NotFoundPage from './pages/NotFoundPage';
import { homepageConfig } from '../shared/documentation-config.js';
import { DEFAULT_DOCUMENT_PATH } from './lib/navigation';
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
          <Route path="/docs/*" element={<DocsPage />} />
          <Route path="/llms" element={<LLMSPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CommandPaletteProvider>
    </ThemeProvider>
  );
}

