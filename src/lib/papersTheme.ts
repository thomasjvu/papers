import themeManifest from './generated/papers-theme.json';

export type PapersThemeFontLink = {
  family?: string;
  href?: string;
  preload?: string;
  type?: string;
  crossOrigin?: boolean;
};

export type PapersThemeManifest = {
  id: string;
  name: string;
  description: string;
  author: string;
  css: string;
  fontCss?: string;
  iconSet?: string;
  defaultColorMode?: 'dark' | 'light';
  features?: {
    lightDarkToggle?: boolean;
  };
  fonts?: PapersThemeFontLink[];
};

export const papersTheme = themeManifest as PapersThemeManifest;

export function papersThemeAllowsLightDarkToggle(): boolean {
  return papersTheme.features?.lightDarkToggle !== false;
}

export function papersThemeDefaultDarkMode(): boolean {
  return papersTheme.defaultColorMode !== 'light';
}
