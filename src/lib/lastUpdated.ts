export const LAST_UPDATED_URL = '/docs-last-updated.json';

type LastUpdatedPages = Record<string, string>;

let pagesPromise: Promise<LastUpdatedPages> | null = null;

export function normalizeRoutePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed || '/';
}

export function formatLastUpdated(iso: string, locale?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Fetch the build-time manifest once. Dev servers have none, so they skip the request. */
export function loadLastUpdatedPages(): Promise<LastUpdatedPages> {
  if (!import.meta.env.PROD) {
    return Promise.resolve({});
  }
  pagesPromise ??= fetch(LAST_UPDATED_URL)
    .then((response) => (response.ok ? response.json() : { pages: {} }))
    .then((data: { pages?: LastUpdatedPages }) => data.pages ?? {})
    .catch(() => ({}));
  return pagesPromise;
}
