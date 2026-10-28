import { useContext, useMemo } from 'react';
import { UNSAFE_LocationContext } from 'react-router-dom';

import { i18nConfig, uiStringsConfig } from '@app-shared/documentation-config.js';
import { findCollectionForPath } from '../../shared/content-collections.js';
import { parseCollectionRoutePath } from '../../shared/docsRouting.js';
import { resolveUiStrings, type UiStrings, type UiStringsConfig } from '../../shared/uiStrings.js';

export { formatUiString } from '../../shared/uiStrings.js';

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

/** Locale for a route: the collection's locale segment, else the default locale. */
export function localeForPath(pathname: string): string {
  const fallback = i18nConfig.defaultLocale || 'en';
  const normalized = trimSlashes(pathname);
  const collection = findCollectionForPath(normalized);
  if (!collection) return fallback;
  return parseCollectionRoutePath(collection, normalized).activeLocale || fallback;
}

/**
 * Interface labels for the current route's locale. Safe outside a router
 * (falls back to the default locale), so shared components can call it.
 */
export function useUiStrings(): UiStrings {
  // Read the location context directly so components rendered outside a
  // <Router> (tests, embeds) get defaults instead of throwing.
  const locationContext = useContext(UNSAFE_LocationContext) as
    | { location?: { pathname?: string } }
    | null
    | undefined;
  const pathname = locationContext?.location?.pathname ?? '/';
  const locale = localeForPath(pathname);
  return useMemo(() => resolveUiStrings(locale, uiStringsConfig as UiStringsConfig), [locale]);
}

export function useUiLocale(): string {
  const locationContext = useContext(UNSAFE_LocationContext) as
    | { location?: { pathname?: string } }
    | null
    | undefined;
  return localeForPath(locationContext?.location?.pathname ?? '/');
}
