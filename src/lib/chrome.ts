import {
  brandingConfig,
  chromeConfig,
  i18nConfig,
} from '@app-shared/documentation-config.js';

export function isLanguageSwitcherEnabled(): boolean {
  const flag = chromeConfig.languageSwitcher?.enabled ?? 'auto';
  if (flag === true) return true;
  if (flag === false) return false;
  return Boolean(i18nConfig.enabled && (i18nConfig.locales?.length ?? 0) > 1);
}

export function languageSwitcherPlacement(): Array<'sidebar' | 'command-palette'> {
  return chromeConfig.languageSwitcher?.placement ?? ['sidebar', 'command-palette'];
}

export function languageSwitcherShows(placement: 'sidebar' | 'command-palette'): boolean {
  return isLanguageSwitcherEnabled() && languageSwitcherPlacement().includes(placement);
}

export function getLocaleLabel(locale: string): string {
  return i18nConfig.labels?.[locale] || locale.toUpperCase();
}

export function getSidebarVariant(): 'tree' | 'groups' {
  return chromeConfig.sidebarVariant === 'groups' ? 'groups' : 'tree';
}

export function getCopyrightLine(): string {
  const year = brandingConfig.copyright?.year ?? new Date().getFullYear();
  const holder = brandingConfig.copyright?.holder || brandingConfig.productName || 'Docs';
  const notice = brandingConfig.copyright?.notice;
  return notice ? `© ${year} ${holder}. ${notice}` : `© ${year} ${holder}`;
}

export { brandingConfig, chromeConfig, i18nConfig };
