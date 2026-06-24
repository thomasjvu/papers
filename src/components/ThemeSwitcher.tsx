import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import React, { useMemo, useCallback } from 'react';

import { papersThemeAllowsLightDarkToggle } from '../lib/papersTheme';
import { useTheme } from '../providers/ThemeProvider';

type ThemeSwitcherProps = {
  className?: string;
};

const ThemeSwitcher = React.memo(
  ({ className = '' }: ThemeSwitcherProps): React.ReactElement | null => {
    const allowsToggle = papersThemeAllowsLightDarkToggle();
    const { isDarkMode, toggleTheme } = useTheme();

    const currentLabel = isDarkMode ? 'Dark mode' : 'Light mode';
    const nextLabel = isDarkMode ? 'Light mode' : 'Dark mode';

    const buttonAnimations = useMemo(
      () => ({
        whileHover: { scale: 1.1 },
        whileTap: { scale: 0.95 },
      }),
      []
    );

    const ariaAttrs = useMemo(
      () => ({
        'aria-label': `Current theme: ${currentLabel}. Click to switch to ${nextLabel}`,
        title: `Switch theme to ${nextLabel}`,
      }),
      [currentLabel, nextLabel]
    );

    const buttonStyle = useMemo(
      () => ({
        color: 'var(--text-color)',
      }),
      []
    );

    const handleToggleTheme = useCallback(() => {
      toggleTheme();
    }, [toggleTheme]);

    const renderThemeIcon = useCallback((): React.ReactElement => {
      if (isDarkMode) {
        return <Icon icon="mingcute:moon-line" className="w-5 h-5" aria-hidden="true" />;
      }

      return <Icon icon="mingcute:sun-line" className="w-5 h-5" aria-hidden="true" />;
    }, [isDarkMode]);

    const displayText = useMemo(() => currentLabel.toLowerCase(), [currentLabel]);

    if (!allowsToggle) {
      return null;
    }

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
  }
);

ThemeSwitcher.displayName = 'ThemeSwitcher';

export default ThemeSwitcher;
