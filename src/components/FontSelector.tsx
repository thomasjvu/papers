import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import React, { useCallback, useMemo } from 'react';

import { useTheme } from '../providers/ThemeProvider';

type FontSelectorProps = {
  className?: string;
};

type FontFamily = 'sans-serif' | 'mono' | 'serif';

const FONT_OPTIONS: { value: FontFamily; label: string; icon: string }[] = [
  { value: 'sans-serif', label: 'Sans Serif', icon: 'mingcute:font-size-line' },
  { value: 'mono', label: 'Monospace', icon: 'mingcute:code-line' },
  { value: 'serif', label: 'Serif', icon: 'mingcute:text-line' },
];

const FontSelector = React.memo(({ className = '' }: FontSelectorProps): React.ReactElement => {
  const { fontFamily, setFontFamily, prefersReducedMotion } = useTheme();

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

  const currentIndex = FONT_OPTIONS.findIndex((option) => option.value === fontFamily);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentFont = FONT_OPTIONS[safeIndex];
  const nextFont = FONT_OPTIONS[(safeIndex + 1) % FONT_OPTIONS.length];

  const handleFontCycle = useCallback(() => {
    setFontFamily(nextFont.value);
  }, [nextFont.value, setFontFamily]);

  const currentFontStyle = useMemo(() => {
    if (fontFamily === 'mono') {
      return 'var(--mono-font)';
    }

    if (fontFamily === 'serif') {
      return 'var(--title-font)';
    }

    return 'var(--body-font)';
  }, [fontFamily]);

  const buttonLabel = currentFont.label.toLowerCase();
  const ariaLabel = `Current font: ${currentFont.label}. Click to switch to ${nextFont.label}`;
  const title = `Switch font to ${nextFont.label}`;

  return (
    <div className={className}>
      {prefersReducedMotion ? (
        <button
          onClick={handleFontCycle}
          className="flex items-center gap-2 rounded-full p-2"
          style={buttonStyle}
          aria-label={ariaLabel}
          title={title}
          type="button"
        >
          <Icon icon={currentFont.icon} className="h-5 w-5" aria-hidden="true" />
          <span className="text-2xs" style={{ fontFamily: currentFontStyle }}>
            {buttonLabel}
          </span>
        </button>
      ) : (
        <motion.button
          onClick={handleFontCycle}
          className="flex items-center gap-2 rounded-full p-2"
          style={buttonStyle}
          {...buttonAnimations}
          aria-label={ariaLabel}
          title={title}
          type="button"
        >
          <Icon icon={currentFont.icon} className="h-5 w-5" aria-hidden="true" />
          <span className="text-2xs" style={{ fontFamily: currentFontStyle }}>
            {buttonLabel}
          </span>
        </motion.button>
      )}
    </div>
  );
});

FontSelector.displayName = 'FontSelector';

export default FontSelector;
