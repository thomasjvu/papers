import { createContext } from 'react';

export type FontFamily = 'sans-serif' | 'mono' | 'serif';

export type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  toggleDarkMode: () => void;
  prefersReducedMotion: boolean;
  toggleReducedMotion: () => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
