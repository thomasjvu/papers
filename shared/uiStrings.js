/**
 * Interface labels for the docs chrome (pager, footer, search, code blocks).
 * English defaults live here; translate or rename them per locale with
 * `uiStringsConfig` in shared/documentation-config.js.
 */
export const DEFAULT_UI_STRINGS = Object.freeze({
  previous: 'Previous',
  next: 'Next',
  adjacentPages: 'Adjacent documentation pages',
  lastUpdated: 'Last updated',
  edit: 'edit',
  issue: 'issue',
  source: 'source',
  pageSourceActions: 'Page source actions',
  searchDocs: 'Search docs',
  searchPlaceholder: 'Search documentation or type a command...',
  noResults: 'No results found for',
  copyCode: 'Copy to clipboard',
  copied: 'Copied',
  showLineNumbers: 'Show line numbers',
  hideLineNumbers: 'Hide line numbers',
  referencedBy: 'Referenced by',
});

export const UI_STRING_KEYS = Object.freeze(Object.keys(DEFAULT_UI_STRINGS));

/**
 * Merge the overrides for `locale` over the defaults. Unknown keys and
 * non-string or empty values are ignored, so a typo never blanks a label.
 */
export function resolveUiStrings(locale, overridesByLocale = {}) {
  const overrides = (locale && overridesByLocale?.[locale]) || {};
  const resolved = { ...DEFAULT_UI_STRINGS };
  for (const key of UI_STRING_KEYS) {
    const value = overrides[key];
    if (typeof value === 'string' && value.trim()) resolved[key] = value;
  }
  return Object.freeze(resolved);
}

/** Return config problems as messages (unknown locales, keys, or bad values). */
export function validateUiStringsConfig(config, locales = []) {
  const problems = [];
  for (const [locale, overrides] of Object.entries(config || {})) {
    if (locales.length > 0 && !locales.includes(locale)) {
      problems.push(`uiStringsConfig.${locale}: locale is not in i18nConfig.locales`);
    }
    for (const [key, value] of Object.entries(overrides || {})) {
      if (!UI_STRING_KEYS.includes(key)) {
        problems.push(`uiStringsConfig.${locale}.${key}: unknown label`);
      } else if (typeof value !== 'string' || !value.trim()) {
        problems.push(`uiStringsConfig.${locale}.${key}: must be a non-empty string`);
      }
    }
  }
  return problems;
}
