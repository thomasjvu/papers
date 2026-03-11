import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import safeLocalStorage from '../utils/storage';

type FontFamily = 'sans-serif' | 'mono' | 'serif';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  toggleDarkMode: () => void;
  prefersReducedMotion: boolean;
  toggleReducedMotion: () => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [fontFamily, setFontFamilyState] = useState<FontFamily>('sans-serif');
  const hasExplicitThemePreference = useRef(false);
  const hasExplicitMotionPreference = useRef(false);

  const applyTheme = useCallback((darkMode: boolean, persist = false) => {
    const html = document.documentElement;

    html.classList.toggle('dark', darkMode);

    if (persist) {
      safeLocalStorage.setItem('darkMode', darkMode.toString());
    }
  }, []);

  const applyMotionPreference = useCallback((reducedMotion: boolean, persist = false) => {
    const html = document.documentElement;

    html.classList.toggle('reduce-motion', reducedMotion);

    if (persist) {
      safeLocalStorage.setItem('prefersReducedMotion', reducedMotion.toString());
    }
  }, []);

  const applyFontFamily = useCallback((font: FontFamily) => {
    const html = document.documentElement;

    html.classList.remove('font-sans', 'font-mono', 'font-serif');
    html.classList.add(`font-${font}`);

    safeLocalStorage.setItem('fontFamily', font);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const storedThemePreference = safeLocalStorage.getItem('darkMode');
    const hasStoredThemePreference =
      storedThemePreference === 'true' || storedThemePreference === 'false';
    hasExplicitThemePreference.current = hasStoredThemePreference;

    const darkModeEnabled = hasStoredThemePreference
      ? storedThemePreference === 'true'
      : darkModeMediaQuery.matches;

    setIsDarkMode(darkModeEnabled);
    applyTheme(darkModeEnabled, hasStoredThemePreference);

    const storedMotionPreference = safeLocalStorage.getItem('prefersReducedMotion');
    const hasStoredMotionPreference =
      storedMotionPreference === 'true' || storedMotionPreference === 'false';
    hasExplicitMotionPreference.current = hasStoredMotionPreference;

    const reducedMotionEnabled = hasStoredMotionPreference
      ? storedMotionPreference === 'true'
      : motionMediaQuery.matches;

    setPrefersReducedMotion(reducedMotionEnabled);
    applyMotionPreference(reducedMotionEnabled, hasStoredMotionPreference);

    const storedFontPreference = safeLocalStorage.getItem('fontFamily') as FontFamily | null;
    const selectedFont = storedFontPreference || 'sans-serif';

    setFontFamilyState(selectedFont);
    applyFontFamily(selectedFont);

    const handleDarkModeChange = (event: MediaQueryListEvent) => {
      if (!hasExplicitThemePreference.current) {
        setIsDarkMode(event.matches);
      }
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (!hasExplicitMotionPreference.current) {
        setPrefersReducedMotion(event.matches);
      }
    };

    darkModeMediaQuery.addEventListener('change', handleDarkModeChange);
    motionMediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
      motionMediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, [applyTheme, applyMotionPreference, applyFontFamily]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    applyTheme(isDarkMode, hasExplicitThemePreference.current);
  }, [isDarkMode, applyTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    applyMotionPreference(prefersReducedMotion, hasExplicitMotionPreference.current);
  }, [prefersReducedMotion, applyMotionPreference]);

  const toggleTheme = useCallback(() => {
    hasExplicitThemePreference.current = true;
    setIsDarkMode((prev) => !prev);
  }, []);

  const toggleReducedMotion = useCallback(() => {
    hasExplicitMotionPreference.current = true;
    setPrefersReducedMotion((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'i') {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      toggleTheme();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  const setFontFamily = useCallback(
    (font: FontFamily) => {
      setFontFamilyState(font);
      applyFontFamily(font);
    },
    [applyFontFamily]
  );

  const contextValue = useMemo(
    () => ({
      isDarkMode,
      toggleTheme,
      toggleDarkMode: toggleTheme,
      prefersReducedMotion,
      toggleReducedMotion,
      fontFamily,
      setFontFamily,
    }),
    [isDarkMode, toggleTheme, prefersReducedMotion, toggleReducedMotion, fontFamily, setFontFamily]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
