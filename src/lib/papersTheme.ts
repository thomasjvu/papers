import themeManifest from './generated/papers-theme.json';

export type PapersThemeManifest = {
  id: string;
  name: string;
  description: string;
  author: string;
  css: string;
  iconSet?: string;
  defaultColorMode?: 'dark' | 'light';
  features?: {
    lightDarkToggle?: boolean;
  };
  fonts?: Array<{
    family: string;
    href: string;
  }>;
};

export const papersTheme = themeManifest as PapersThemeManifest;

export function papersThemeAllowsLightDarkToggle(): boolean {
  return papersTheme.features?.lightDarkToggle !== false;
}

export function papersThemeDefaultDarkMode(): boolean {
  return papersTheme.defaultColorMode !== 'light';
}
