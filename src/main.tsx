import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './globals.css';
import './theme-active.css';
import './lib/iconify';
import type { InitialDocsData } from './lib/content';

// Keep in sync with INITIAL_DOCS_SCRIPT_ID in scripts/lib/prerenderHtml.mjs.
// The id is inlined here (rather than imported) so the app bundle never
// depends on the build scripts.
const INITIAL_DOCS_SCRIPT_ID = 'papers-initial-docs';

/**
 * Read the document JSON the route HTML generator embeds in article pages
 * (see scripts/generate-route-html.mjs). When present, DocsPage renders it
 * synchronously instead of fetching the same JSON — the embedded copy is
 * only ever used for the route it was generated for.
 */
function readInitialDocs(): InitialDocsData | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const element = document.getElementById(INITIAL_DOCS_SCRIPT_ID);
  if (!element?.textContent) {
    return undefined;
  }

  try {
    return JSON.parse(element.textContent) as InitialDocsData;
  } catch {
    return undefined;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App initialDocs={readInitialDocs()} />
    </BrowserRouter>
  </StrictMode>
);
