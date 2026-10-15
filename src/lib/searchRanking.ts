/**
 * Search tuning for the Pagefind index (records come from
 * scripts/lib/pagefindArtifacts.mjs).
 *
 * - Ranking: Pagefind's defaults favour long pages less than Papers wants for
 *   short reference pages, so length is penalised less and exact terms more.
 * - Filters: results stay in the reader's version and locale, and a `docs:` or
 *   `api:` prefix limits results to guides or the OpenAPI reference.
 * - Title boost: pages whose title matches the query move up.
 */
export const PAGEFIND_RANKING = Object.freeze({
  termFrequency: 1.0,
  pageLength: 0.5,
  termSaturation: 1.4,
  termSimilarity: 1.0,
});

export type SearchSection = 'docs' | 'api';

export type PagefindFilters = Record<string, string | string[]>;

const SECTION_PREFIX = /^(docs|api):\s*/i;

/** Split an optional `docs:` / `api:` scope prefix off the query. */
export function parseSearchScope(query: string): { query: string; section: SearchSection | null } {
  const trimmed = query.trim();
  const match = SECTION_PREFIX.exec(trimmed);
  if (!match) return { query: trimmed, section: null };
  return {
    query: trimmed.slice(match[0].length).trim(),
    section: match[1].toLowerCase() as SearchSection,
  };
}

/** Filters for the current route. API records have no version or locale, so
 * those only apply when the search is scoped to docs or the route has them. */
export function buildSearchFilters({
  section,
  version,
  locale,
}: {
  section: SearchSection | null;
  version?: string | null;
  locale?: string | null;
}): PagefindFilters {
  const filters: PagefindFilters = {};
  if (section) filters.section = section;
  if (section !== 'api') {
    // Pagefind treats a filter as "must match", so version/locale filters would
    // hide API records; scope them to docs with an `any` of the two shapes.
    const docsScope: PagefindFilters = { section: 'docs' };
    if (version) docsScope.version = version;
    if (locale) docsScope.locale = locale;
    if (version || locale) {
      if (section === 'docs') return { ...filters, ...docsScope };
      return { any: [docsScope, { section: 'api' }] } as unknown as PagefindFilters;
    }
  }
  return filters;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Multiplier for a result title against the query: exact > all terms > some terms. */
export function titleBoost(title: string, query: string): number {
  const normalizedTitle = normalizeText(title);
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 1;
  if (normalizedTitle === normalizedQuery) return 3;
  const terms = normalizedQuery.split(' ').filter((term) => term.length > 1);
  if (terms.length === 0) return 1;
  const hits = terms.filter((term) => normalizedTitle.includes(term)).length;
  if (hits === terms.length) return normalizedTitle.startsWith(normalizedQuery) ? 2.5 : 2;
  return hits > 0 ? 1 + hits / terms.length / 2 : 1;
}

/** Stable re-rank of Pagefind results by score × title boost. */
export function rankSearchResults<T extends { score: number; meta: { title: string } }>(
  results: T[],
  query: string
): T[] {
  return results
    .map((result, index) => ({
      result,
      index,
      rank: result.score * titleBoost(result.meta.title, query),
    }))
    .sort((left, right) => right.rank - left.rank || left.index - right.index)
    .map(({ result }) => result);
}
