import { useLocation, useNavigate } from 'react-router-dom';

import { buildCanonicalCollectionPath } from '../../shared/docsRouting.js';
import type { ContentCollection } from '../../shared/docsRouting.js';
import { getContentCollection } from '../data/collections';
import { i18nConfig, versionConfig } from '@app-shared/documentation-config.js';
import { useUiStrings } from '../lib/uiStrings';
import { useCollectionRouteContext } from '../hooks/useCollectionRouteContext';

type DocsVariantSelectorProps = {
  docPath: string;
  collection?: ContentCollection;
};

/**
 * Version selector only. Language uses the pill {@link LanguageSwitcher} below —
 * do not render a second locale dropdown here.
 */
export default function DocsVariantSelector({ docPath, collection }: DocsVariantSelectorProps) {
  const ui = useUiStrings();
  const navigate = useNavigate();
  const location = useLocation();
  const activeCollection = collection || getContentCollection('docs');
  const routeContext = useCollectionRouteContext(activeCollection, location.pathname);

  const activeVersionConfig = activeCollection.variants?.versionConfig || versionConfig;
  const activeI18nConfig = activeCollection.variants?.i18nConfig || i18nConfig;
  const versions = activeVersionConfig.enabled ? activeVersionConfig.versions : [];

  if (!activeVersionConfig.enabled || versions.length === 0) {
    return null;
  }

  const navigateWithVersion = (nextVersion: string) => {
    navigate(
      buildCanonicalCollectionPath(activeCollection, docPath, {
        version: nextVersion,
        locale: activeI18nConfig.enabled ? routeContext.activeLocale : null,
      })
    );
  };

  return (
    <div className="docs-variant-selector flex flex-wrap items-center gap-2">
      <label
        className="inline-flex items-center gap-2 text-xs"
        style={{ color: 'var(--muted-color)' }}
      >
        <span style={{ fontFamily: 'var(--mono-font)' }}>{ui.version}</span>
        <select
          value={routeContext.activeVersion || activeVersionConfig.current}
          onChange={(event) => navigateWithVersion(event.target.value)}
          className="rounded-md border px-2 py-1 text-xs"
          style={{
            backgroundColor: 'var(--card-color)',
            borderColor: 'var(--border-unified)',
            color: 'var(--papers-text-color)',
            fontFamily: 'var(--mono-font)',
          }}
        >
          {versions.map((version) => (
            <option key={version} value={version}>
              {activeVersionConfig.labels?.[version] || version}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
