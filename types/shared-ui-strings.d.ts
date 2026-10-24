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
  };
  export type UiStringKey = keyof UiStrings;
  export type UiStringsConfig = Record<string, Partial<Record<UiStringKey, string>>>;
  export const DEFAULT_UI_STRINGS: UiStrings;
  export const UI_STRING_KEYS: readonly UiStringKey[];
  export function resolveUiStrings(
    locale: string | null | undefined,
    overridesByLocale?: UiStringsConfig
  ): UiStrings;
  export function validateUiStringsConfig(config: unknown, locales?: string[]): string[];
}
