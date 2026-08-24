import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { buildCanonicalDocsPath, parseDocsRoutePath } from '../../../shared/docsRouting.js';
import { DEFAULT_DOCUMENT_PATH } from '../../lib/navigation';
import { getLocaleLabel, i18nConfig, languageSwitcherShows } from '../../lib/chrome';

type LanguageSwitcherProps = {
  variant?: 'pills' | 'menu';
  className?: string;
  /** Current logical doc path (without locale prefix). */
  docPath?: string;
};

/**
 * Papers language switcher — only renders when i18n is multi-locale and chrome allows it.
 */
export default function LanguageSwitcher({
  variant = 'pills',
  className = '',
  docPath,
}: LanguageSwitcherProps) {
  const location = useLocation();
  const docsRouteSlug = location.pathname.startsWith('/docs')
    ? location.pathname.replace(/^\/docs\/?/, '')
    : location.pathname.replace(/^\/+|\/+$/g, '');
  const routeContext = useMemo(() => parseDocsRoutePath(docsRouteSlug), [docsRouteSlug]);
  const activeLocale = routeContext.activeLocale || i18nConfig.defaultLocale;
  const logicalPath = docPath || routeContext.docPath || DEFAULT_DOCUMENT_PATH;

  useEffect(() => {
    if (typeof document === 'undefined' || !activeLocale) return;
    document.documentElement.lang = activeLocale;
  }, [activeLocale]);

  if (!languageSwitcherShows('sidebar')) {
    return null;
  }

  const locales = i18nConfig.locales || [];

  if (variant === 'menu') {
    return (
      <label className={`flex items-center gap-2 text-xs ${className}`.trim()}>
        <span style={{ color: 'var(--muted-color)', fontFamily: 'var(--mono-font)' }}>Lang</span>
        <select
          value={activeLocale || ''}
          onChange={(event) => {
            const href = buildCanonicalDocsPath(logicalPath, {
              version: routeContext.activeVersion,
              locale: event.target.value,
            });
            window.location.assign(href);
          }}
          className="rounded-md border px-2 py-1"
          style={{
            borderColor: 'var(--border-unified)',
            backgroundColor: 'var(--card-color)',
            color: 'var(--text-color)',
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
        const href = buildCanonicalDocsPath(logicalPath, {
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
