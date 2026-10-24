declare module '*/shared/uiStrings.js' {
  export type UiStrings = {
    readonly previous: string;
    readonly next: string;
    readonly adjacentPages: string;
    readonly lastUpdated: string;
    readonly edit: string;
    readonly issue: string;
    readonly source: string;
    readonly pageSourceActions: string;
    readonly searchDocs: string;
    readonly searchPlaceholder: string;
    readonly noResults: string;
    readonly copyCode: string;
    readonly copied: string;
    readonly showLineNumbers: string;
    readonly hideLineNumbers: string;
    readonly referencedBy: string;
    readonly searchScope: string;
    readonly searchScopeAll: string;
    readonly searchScopeDocs: string;
    readonly searchScopeApi: string;
    readonly sidebarNavigation: string;
    readonly closeSidebar: string;
    readonly showDocumentationTree: string;
    readonly onThisPage: string;
    readonly interactiveMap: string;
    readonly showTableOfContents: string;
    readonly showInteractiveMap: string;
    readonly version: string;
    readonly mindmapSearchPlaceholder: string;
    readonly mindmapSearchPlaceholderExpanded: string;
    readonly mindmapZoomIn: string;
    readonly mindmapZoomOut: string;
    readonly mindmapReset: string;
    readonly mindmapResetView: string;
    readonly mindmapExpand: string;
    readonly mindmapExpandShort: string;
    readonly mindmapClose: string;
    readonly mindmapLegendPages: string;
    readonly mindmapLegendCurrent: string;
    readonly mindmapLegendFolder: string;
    readonly mindmapLegendTags: string;
    readonly mindmapLegendMatches: string;
    readonly mindmapResultOne: string;
    readonly mindmapResultMany: string;
    readonly mindmapNoMatches: string;
    readonly commandLightMode: string;
    readonly commandDarkMode: string;
    readonly commandEnableMotion: string;
    readonly commandReduceMotion: string;
    readonly commandFont: string;
    readonly fontSansSerif: string;
    readonly fontMonospace: string;
    readonly fontSerif: string;
    readonly commandSwitchLocale: string;
    readonly commandSwitchLocaleDescription: string;
    readonly commandLlms: string;
    readonly commandAgentSkill: string;
    readonly commandHomepage: string;
    readonly paletteNavigateHint: string;
    readonly paletteOpenHint: string;
    readonly paletteCloseHint: string;
    readonly faqPreview: string;
    readonly badgeAction: string;
    readonly badgeFaq: string;
  };
  export type UiStringKey = keyof UiStrings;
  export type UiStringsConfig = Record<string, Partial<Record<UiStringKey, string>>>;
  export const DEFAULT_UI_STRINGS: UiStrings;
  export const UI_STRING_KEYS: readonly UiStringKey[];
  export function resolveUiStrings(
    locale: string | null | undefined,
    overridesByLocale?: UiStringsConfig
  ): UiStrings;
  export function uiStringPlaceholders(template: string): string[];
  export function formatUiString(
    template: string,
    values?: Record<string, string | number>
  ): string;
  export function validateUiStringsConfig(config: unknown, locales?: string[]): string[];
}
