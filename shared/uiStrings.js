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
  searchScope: 'Search scope',
  searchScopeAll: 'All',
  searchScopeDocs: 'Docs',
  searchScopeApi: 'API',
  // Sidebar and right rail
  sidebarNavigation: 'Documentation',
  closeSidebar: 'Close sidebar',
  showDocumentationTree: 'Show documentation tree',
  onThisPage: 'On This Page',
  interactiveMap: 'Interactive Map',
  showTableOfContents: 'Show table of contents',
  showInteractiveMap: 'Show interactive map',
  version: 'Version',
  // Mindmap
  mindmapSearchPlaceholder: 'Search docs...',
  mindmapSearchPlaceholderExpanded: 'Search documents...',
  mindmapZoomIn: 'Zoom in',
  mindmapZoomOut: 'Zoom out',
  mindmapReset: 'Reset',
  mindmapResetView: 'Reset view (Ctrl/Cmd + 0)',
  mindmapExpand: 'Expand interactive map',
  mindmapExpandShort: 'Expand map',
  mindmapClose: 'Close expanded mindmap',
  mindmapLegendPages: 'Pages',
  mindmapLegendCurrent: 'Current',
  mindmapLegendFolder: 'Folder',
  mindmapLegendTags: 'Tags',
  mindmapLegendMatches: 'Matches',
  mindmapResultOne: '{count} result',
  mindmapResultMany: '{count} results',
  mindmapNoMatches: 'No matches found',
  // Command palette commands and hints
  commandLightMode: 'Switch to Light Mode',
  commandDarkMode: 'Switch to Dark Mode',
  commandEnableMotion: 'Enable Motion',
  commandReduceMotion: 'Reduce Motion',
  commandFont: 'Font: {font}',
  fontSansSerif: 'Sans Serif',
  fontMonospace: 'Monospace',
  fontSerif: 'Serif',
  commandSwitchLocale: 'Switch to {language}',
  commandSwitchLocaleDescription: 'Change documentation language to {language}',
  commandLlms: 'LLMs.txt - AI Documentation',
  commandAgentSkill: 'Agent Skill - {site}',
  commandHomepage: 'Go to Homepage',
  paletteNavigateHint: 'to navigate',
  paletteOpenHint: 'to open or preview',
  paletteCloseHint: 'to close',
  faqPreview: 'FAQ Preview',
  badgeAction: 'action',
  badgeFaq: 'faq',
});

export const UI_STRING_KEYS = Object.freeze(Object.keys(DEFAULT_UI_STRINGS));

const PLACEHOLDER_PATTERN = /\{([a-z]+)\}/g;

/** Placeholder names used by a label template, e.g. `{count} results` -> ['count']. */
export function uiStringPlaceholders(template) {
  return [...String(template).matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1]).sort();
}

/**
 * Fill `{name}` placeholders. Unknown placeholders stay as written so a
 * translation mistake is visible rather than silently blank.
 */
export function formatUiString(template, values = {}) {
  return String(template).replace(PLACEHOLDER_PATTERN, (whole, name) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : whole
  );
}

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
      } else {
        const expected = uiStringPlaceholders(DEFAULT_UI_STRINGS[key]).join(',');
        const actual = uiStringPlaceholders(value).join(',');
        if (expected !== actual) {
          const wanted = expected ? `{${expected.replace(/,/g, '}, {')}}` : 'no placeholders';
          problems.push(`uiStringsConfig.${locale}.${key}: must use ${wanted}`);
        }
      }
    }
  }
  return problems;
}
