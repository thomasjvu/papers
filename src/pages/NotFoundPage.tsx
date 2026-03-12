import { Icon } from '@iconify/react';
import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { DEFAULT_DOCUMENT_PATH } from '../lib/navigation';
import { buildCanonicalDocsPath, buildDocsLandingPath } from '../../shared/docsRouting.js';
import { useCommandPalette } from '../providers/CommandPaletteProvider';
import { applySeoMetadata } from '../utils/seo';

const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'papers';

export default function NotFoundPage() {
  const location = useLocation();
  const { openCommandPalette } = useCommandPalette();

  const shortcutLabel = useMemo(() => {
    const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
    return isMac ? 'Cmd + K' : 'Ctrl + K';
  }, []);

  useEffect(() => {
    const missingPath = `${location.pathname}${location.search}${location.hash}`;

    applySeoMetadata({
      title: `Not Found | ${SITE_NAME}`,
      description: 'The requested page could not be found.',
      path: missingPath || '/404.html',
      canonicalPath: '/404.html',
      type: 'website',
      noIndex: true,
    });
  }, [location.hash, location.pathname, location.search]);

  const missingPath = `${location.pathname}${location.search}${location.hash}`;
  const showRefreshHint = location.pathname.startsWith('/docs/');

  return (
    <div className="min-h-screen px-4 py-20" style={{ backgroundColor: 'var(--background-color)' }}>
      <div className="max-w-3xl mx-auto">
        <div
          className="rounded-3xl border p-8 md:p-10 shadow-lg"
          style={{
            backgroundColor: 'var(--card-color)',
            borderColor: 'var(--border-unified)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            className="inline-flex items-center rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] mb-6"
            style={{
              backgroundColor: 'rgba(var(--primary-color-rgb), 0.08)',
              color: 'var(--primary-color)',
              fontFamily: 'var(--mono-font)',
            }}
          >
            404
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--text-color)', fontFamily: 'var(--title-font)' }}
          >
            That page does not exist.
          </h1>

          <p
            className="text-base md:text-lg mb-6 max-w-2xl"
            style={{ color: 'var(--muted-color)' }}
          >
            The link may be stale, the route may have moved, or you may have landed on a placeholder
            path. The quickest fix is usually search.
          </p>

          <div
            className="rounded-xl px-4 py-3 mb-6 border"
            style={{
              borderColor: 'var(--border-unified)',
              backgroundColor: 'var(--hover-color)',
              fontFamily: 'var(--mono-font)',
              color: 'var(--text-secondary)',
            }}
          >
            {missingPath}
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              type="button"
              onClick={openCommandPalette}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'var(--selection-text-color)',
                fontFamily: 'var(--mono-font)',
              }}
            >
              <Icon icon="mingcute:search-line" className="w-4 h-4" />
              Open Search ({shortcutLabel})
            </button>

            <Link
              to="/docs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
              style={{
                borderColor: 'var(--border-unified)',
                color: 'var(--text-color)',
                fontFamily: 'var(--mono-font)',
              }}
            >
              <Icon icon="mingcute:book-2-line" className="w-4 h-4" />
              Documentation
            </Link>

            <Link
              to={buildDocsLandingPath(DEFAULT_DOCUMENT_PATH)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
              style={{
                borderColor: 'var(--border-unified)',
                color: 'var(--text-color)',
                fontFamily: 'var(--mono-font)',
              }}
            >
              <Icon icon="mingcute:compass-3-line" className="w-4 h-4" />
              First Page
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
              style={{
                borderColor: 'var(--border-unified)',
                color: 'var(--text-color)',
                fontFamily: 'var(--mono-font)',
              }}
            >
              <Icon icon="mingcute:home-2-line" className="w-4 h-4" />
              Homepage
            </Link>
          </div>

          {showRefreshHint && (
            <div
              className="rounded-xl px-4 py-4 border"
              style={{
                borderColor: 'var(--border-unified)',
                backgroundColor: 'rgba(var(--primary-color-rgb), 0.05)',
              }}
            >
              <div className="font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                If this happened on a direct page load in production
              </div>
              <p className="mb-3" style={{ color: 'var(--muted-color)' }}>
                This build generates real HTML files for known docs routes. Verify the deployed
                `dist/` output still includes your `docs/.../index.html` files and that no catch-all
                host rule is rewriting `/docs/*` or `/llms` back to the homepage.
              </p>
              <Link
                to={buildCanonicalDocsPath('user-guide/troubleshooting')}
                className="inline-flex items-center gap-2"
                style={{ color: 'var(--primary-color)', fontFamily: 'var(--mono-font)' }}
              >
                <Icon icon="mingcute:warning-line" className="w-4 h-4" />
                Open troubleshooting
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
