import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { buildCanonicalDocsPath, parseDocsRoutePath } from '../../shared/docsRouting.js';
import { i18nConfig, versionConfig } from '@app-shared/documentation-config.js';

type DocsVariantSelectorProps = {
  docPath: string;
};

export default function DocsVariantSelector({ docPath }: DocsVariantSelectorProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const docsRouteSlug = location.pathname.startsWith('/docs')
    ? location.pathname.replace(/^\/docs\/?/, '')
    : '';
  const routeContext = useMemo(() => parseDocsRoutePath(docsRouteSlug), [docsRouteSlug]);

  if (!versionConfig.enabled && !i18nConfig.enabled) {
    return null;
  }

  const versions = versionConfig.enabled ? versionConfig.versions : [];
  const locales = i18nConfig.enabled ? i18nConfig.locales : [];

  const navigateWithVariant = (nextVersion: string | null, nextLocale: string | null) => {
    navigate(
      buildCanonicalDocsPath(docPath, {
        version: versionConfig.enabled ? nextVersion : null,
        locale: i18nConfig.enabled ? nextLocale : null,
      })
    );
  };

  return (
    <div className="docs-variant-selector flex flex-wrap items-center gap-2">
      {versionConfig.enabled && versions.length > 0 && (
        <label
          className="inline-flex items-center gap-2 text-xs"
          style={{ color: 'var(--muted-color)' }}
        >
          <span style={{ fontFamily: 'var(--mono-font)' }}>Version</span>
          <select
            value={routeContext.activeVersion || versionConfig.current}
            onChange={(event) => navigateWithVariant(event.target.value, routeContext.activeLocale)}
            className="rounded-md border px-2 py-1 text-xs"
            style={{
              backgroundColor: 'var(--card-color)',
              borderColor: 'var(--border-unified)',
              color: 'var(--text-color)',
              fontFamily: 'var(--mono-font)',
            }}
          >
            {versions.map((version) => (
              <option key={version} value={version}>
                {versionConfig.labels?.[version] || version}
              </option>
            ))}
          </select>
        </label>
      )}

      {i18nConfig.enabled && locales.length > 0 && (
        <label
          className="inline-flex items-center gap-2 text-xs"
          style={{ color: 'var(--muted-color)' }}
        >
          <span style={{ fontFamily: 'var(--mono-font)' }}>Language</span>
          <select
            value={routeContext.activeLocale || i18nConfig.defaultLocale}
            onChange={(event) =>
              navigateWithVariant(routeContext.activeVersion, event.target.value)
            }
            className="rounded-md border px-2 py-1 text-xs"
            style={{
              backgroundColor: 'var(--card-color)',
              borderColor: 'var(--border-unified)',
              color: 'var(--text-color)',
              fontFamily: 'var(--mono-font)',
            }}
          >
            {locales.map((locale) => (
              <option key={locale} value={locale}>
                {locale.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
