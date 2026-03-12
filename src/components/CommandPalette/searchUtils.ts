export interface SearchResultLike {
  path: string;
}

interface CombineSearchResultsOptions {
  query: string;
  pagefindAvailable: boolean;
  limit?: number;
}

export function combineSearchResults<T extends SearchResultLike>(
  filteredResults: T[],
  pagefindResults: T[],
  options: CombineSearchResultsOptions
): T[] {
  const { query, pagefindAvailable, limit = 10 } = options;

  if (!query.trim() || !pagefindAvailable) {
    return filteredResults;
  }

  const existingPaths = new Set(filteredResults.map((result) => result.path));
  const uniquePagefind = pagefindResults.filter((result) => !existingPaths.has(result.path));

  return [...filteredResults, ...uniquePagefind].slice(0, limit);
}
