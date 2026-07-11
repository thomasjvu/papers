import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { buildCanonicalDocsPath, parseDocsRoutePath } from '../../shared/docsRouting.js';
import { i18nConfig, versionConfig } from '@app-shared/documentation-config.js';

type DocsVariantSelectorProps = {
  docPath: string;
};

/**
 * Version selector only. Language uses the pill {@link LanguageSwitcher} below —
 * do not render a second locale dropdown here.
 */
export default function DocsVariantSelector({ docPath }: DocsVariantSelectorProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const docsRouteSlug = location.pathname.startsWith('/docs')
    ? location.pathname.replace(/^\/docs\/?/, '')
    : '';
  const routeContext = useMemo(() => parseDocsRoutePath(docsRouteSlug), [docsRouteSlug]);

  const versions = versionConfig.enabled ? versionConfig.versions : [];

  if (!versionConfig.enabled || versions.length === 0) {
    return null;
  }

  const navigateWithVersion = (nextVersion: string) => {
    navigate(
      buildCanonicalDocsPath(docPath, {
        version: nextVersion,
        locale: i18nConfig.enabled ? routeContext.activeLocale : null,
      })
    );
  };

  return (
    <div className="docs-variant-selector flex flex-wrap items-center gap-2">
      <label
        className="inline-flex items-center gap-2 text-xs"
        style={{ color: 'var(--muted-color)' }}
      >
        <span style={{ fontFamily: 'var(--mono-font)' }}>Version</span>
        <select
          value={routeContext.activeVersion || versionConfig.current}
          onChange={(event) => navigateWithVersion(event.target.value)}
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
    </div>
  );
}
