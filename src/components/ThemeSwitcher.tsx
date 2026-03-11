
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import React, { useMemo, useCallback } from 'react';

import { useTheme } from '../providers/ThemeProvider';

/**
 * Props for the ThemeSwitcher component
 * @typedef {Object} ThemeSwitcherProps
 * @property {string} [className] - Optional CSS class name for styling
 */
type ThemeSwitcherProps = {
  className?: string;
};

/**
 * ThemeSwitcher component that toggles between light and dark mode
 *
 * Displays a sun icon in dark mode and a moon icon in light mode.
 * Uses framer-motion for hover and tap animations.
 *
 * @param {ThemeSwitcherProps} props - Component props
 * @returns {React.ReactElement} Rendered ThemeSwitcher component
 */
const ThemeSwitcher = React.memo(({ className = '' }: ThemeSwitcherProps): React.ReactElement => {
  const { isDarkMode, toggleTheme } = useTheme();

  // Memoized animation settings for button
  const buttonAnimations = useMemo(
    () => ({
      whileHover: { scale: 1.1 },
      whileTap: { scale: 0.95 },
    }),
    []
  );

  // Memoized ARIA labels based on current mode
  const ariaAttrs = useMemo(
    () => ({
      'aria-label': isDarkMode ? 'Switch to light mode' : 'Switch to dark mode',
      title: isDarkMode ? 'Switch to light mode' : 'Switch to dark mode',
    }),
    [isDarkMode]
  );

  // Memoized style object
  const buttonStyle = useMemo(
    () => ({
      color: 'var(--text-color)',
    }),
    []
  );

  // Optimized theme toggle handler
  const handleToggleTheme = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  /**
   * Renders the appropriate icon based on the current theme
   * @returns {React.ReactElement} The sun or moon icon
   */
  const renderThemeIcon = useCallback((): React.ReactElement => {
    if (isDarkMode) {
      // Sun icon for light mode
      return <Icon icon="mingcute:sun-line" className="w-5 h-5" aria-hidden="true" />;
    } else {
      // Moon icon for dark mode
      return <Icon icon="mingcute:moon-line" className="w-5 h-5" aria-hidden="true" />;
    }
  }, [isDarkMode]);

  // Memoized text display
  const displayText = useMemo(() => {
    return isDarkMode ? 'light' : 'dark';
  }, [isDarkMode]);

  return (
    <motion.button
      onClick={handleToggleTheme}
      className={`p-2 rounded-full flex items-center gap-2 ${className}`}
      style={buttonStyle}
      {...buttonAnimations}
      {...ariaAttrs}
      tabIndex={0}
    >
      {renderThemeIcon()}
      <span className="text-2xs" style={{ fontFamily: 'var(--mono-font)' }}>
        {displayText}
      </span>
    </motion.button>
  );
});

ThemeSwitcher.displayName = 'ThemeSwitcher';

export default ThemeSwitcher;
