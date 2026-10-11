import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { formatLastUpdated, loadLastUpdatedPages, normalizeRoutePath } from '../lib/lastUpdated';

/**
 * "Last updated" line for doc pages. Dates come from dist/docs-last-updated.json,
 * written at build time from git history or a `lastUpdated` frontmatter override.
 */
export default function LastUpdated() {
  const { pathname } = useLocation();
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
      Last updated <time dateTime={iso}>{formatLastUpdated(iso)}</time>
    </p>
  );
}
