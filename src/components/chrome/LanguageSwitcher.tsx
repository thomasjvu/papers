import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { buildCanonicalCollectionPath } from '../../../shared/docsRouting.js';
import type { ContentCollection } from '../../../shared/docsRouting.js';
import { getContentCollection } from '../../data/collections';
import { DEFAULT_DOCUMENT_PATH } from '../../lib/navigation';
import { getLocaleLabel, i18nConfig, languageSwitcherShows } from '../../lib/chrome';
import { useCollectionRouteContext } from '../../hooks/useCollectionRouteContext';

type LanguageSwitcherProps = {
  variant?: 'pills' | 'menu';
  className?: string;
  /** Current logical doc path (without locale prefix). */
  docPath?: string;
  collection?: ContentCollection;
};

/**
 * Papers language switcher — only renders when i18n is multi-locale and chrome allows it.
 */
export default function LanguageSwitcher({
  variant = 'pills',
  className = '',
  docPath,
  collection,
}: LanguageSwitcherProps) {
  const location = useLocation();
  const activeCollection = collection || getContentCollection('docs');
  const routeContext = useCollectionRouteContext(
    activeCollection,
    location.pathname,
    location.pathname.replace(/^\/+|\/+$/g, '')
  );
  const activeI18nConfig = activeCollection.variants?.i18nConfig || i18nConfig;
  const activeLocale = routeContext.activeLocale || activeI18nConfig.defaultLocale;
  const logicalPath = docPath || routeContext.docPath || DEFAULT_DOCUMENT_PATH;

  useEffect(() => {
    if (typeof document === 'undefined' || !activeLocale) return;
    document.documentElement.lang = activeLocale;
  }, [activeLocale]);

  if (!languageSwitcherShows('sidebar') || !activeI18nConfig.enabled) {
    return null;
  }

  const locales = activeI18nConfig.locales || [];

  if (variant === 'menu') {
    return (
      <label className={`flex items-center gap-2 text-xs ${className}`.trim()}>
        <span style={{ color: 'var(--muted-color)', fontFamily: 'var(--mono-font)' }}>Lang</span>
        <select
          value={activeLocale || ''}
          onChange={(event) => {
            const href = buildCanonicalCollectionPath(activeCollection, logicalPath, {
              version: routeContext.activeVersion,
              locale: event.target.value,
            });
            window.location.assign(href);
          }}
          className="rounded-md border px-2 py-1"
          style={{
            borderColor: 'var(--border-unified)',
            backgroundColor: 'var(--card-color)',
            color: 'var(--papers-text-color)',
            fontFamily: 'var(--mono-font)',
          }}
          aria-label="Language"
        >
          {locales.map((code) => (
            <option key={code} value={code}>
              {getLocaleLabel(code)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 rounded-lg border p-1 ${className}`.trim()}
      style={{ borderColor: 'var(--border-unified)' }}
      role="group"
      aria-label="Language"
    >
      {locales.map((code) => {
        const active = activeLocale === code;
        const href = buildCanonicalCollectionPath(activeCollection, logicalPath, {
          version: routeContext.activeVersion,
          locale: code,
        });
        return (
          <Link
            key={code}
            to={href}
            className="flex-1 rounded-md px-2 py-1.5 text-center text-xs transition-opacity"
            style={{
              fontFamily: 'var(--mono-font)',
              backgroundColor: active ? 'var(--primary-color)' : 'transparent',
              color: active ? 'var(--selection-text-color)' : 'var(--muted-color)',
              fontWeight: active ? 600 : 500,
            }}
            aria-current={active ? 'true' : undefined}
          >
            {getLocaleLabel(code)}
          </Link>
        );
      })}
    </div>
  );
}
