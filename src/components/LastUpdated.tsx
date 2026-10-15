import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { formatLastUpdated, loadLastUpdatedPages, normalizeRoutePath } from '../lib/lastUpdated';
import { useUiLocale, useUiStrings } from '../lib/uiStrings';

/**
 * "Last updated" line for doc pages. Dates come from dist/docs-last-updated.json,
 * written at build time from git history or a `lastUpdated` frontmatter override.
 */
export default function LastUpdated() {
  const { pathname } = useLocation();
  const ui = useUiStrings();
  const locale = useUiLocale();
  const [iso, setIso] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIso(null);
    void loadLastUpdatedPages().then((pages) => {
      if (!cancelled) setIso(pages[normalizeRoutePath(pathname)] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!iso) {
    return null;
  }

  return (
    <p className="doc-page-updated" data-last-updated={iso}>
      {ui.lastUpdated} <time dateTime={iso}>{formatLastUpdated(iso, locale)}</time>
    </p>
  );
}
