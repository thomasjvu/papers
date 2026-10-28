import { Icon } from '@iconify/react';
import { button as MotionButton } from 'framer-motion/m';
import React, { useCallback, useMemo } from 'react';

import { ICON_BUTTON_STYLE, useIconButtonMotion } from '../hooks/useIconButtonMotion';
import { useTheme } from '../providers/useTheme';

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

  const buttonAnimations = useIconButtonMotion(prefersReducedMotion);

  const buttonStyle = ICON_BUTTON_STYLE;

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
  const ButtonComponent = prefersReducedMotion ? 'button' : MotionButton;
  const buttonProps = prefersReducedMotion ? {} : buttonAnimations;

  return (
    <div className={className}>
      <ButtonComponent
        onClick={handleFontCycle}
        className="flex items-center gap-2 rounded-full p-2"
        style={buttonStyle}
        {...buttonProps}
        aria-label={ariaLabel}
        title={title}
        type="button"
      >
        <Icon icon={currentFont.icon} className="h-5 w-5" aria-hidden="true" />
        <span className="text-2xs" style={{ fontFamily: currentFontStyle }}>
          {buttonLabel}
        </span>
      </ButtonComponent>
    </div>
  );
});

FontSelector.displayName = 'FontSelector';

export default FontSelector;
