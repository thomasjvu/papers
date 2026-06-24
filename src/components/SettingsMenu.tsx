import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import React, { useMemo, useCallback } from 'react';

import { useCommandPalette } from '../providers/CommandPaletteProvider';
import { useTheme } from '../providers/ThemeProvider';

type SettingsMenuProps = {
  className?: string;
  isCompact?: boolean;
  placement?: 'top' | 'bottom';
};

const SettingsMenu = React.memo(({ className = '' }: SettingsMenuProps) => {
  const { openCommandPalette } = useCommandPalette();
  const { prefersReducedMotion } = useTheme();

  const buttonAnimations = useMemo(() => {
    if (prefersReducedMotion) {
      return {};
    }

    return {
      whileHover: { scale: 1.1 },
      whileTap: { scale: 0.95 },
    };
  }, [prefersReducedMotion]);

  const buttonStyle = useMemo(
    () => ({
      color: 'var(--text-color)',
    }),
    []
  );

  const handleOpenPreferences = useCallback(() => {
    openCommandPalette();
  }, [openCommandPalette]);

  if (prefersReducedMotion) {
    return (
      <button
        onClick={handleOpenPreferences}
        className={`flex items-center justify-center rounded-full p-2 ${className}`}
        aria-label="Open preferences"
        title="Preferences"
        style={buttonStyle}
        type="button"
      >
        <Icon icon="mingcute:settings-3-fill" className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <motion.button
      onClick={handleOpenPreferences}
      className={`flex items-center justify-center rounded-full p-2 ${className}`}
      {...buttonAnimations}
      aria-label="Open preferences"
      title="Preferences"
      style={buttonStyle}
      type="button"
    >
      <Icon icon="mingcute:settings-3-fill" className="h-5 w-5" aria-hidden="true" />
    </motion.button>
  );
});

SettingsMenu.displayName = 'SettingsMenu';

export default SettingsMenu;
