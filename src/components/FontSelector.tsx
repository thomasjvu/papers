import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';

import { useTheme } from '../providers/ThemeProvider';

type FontSelectorProps = {
  className?: string;
};

type FontFamily = 'sans-serif' | 'mono' | 'serif';

const FontSelector = React.memo(({ className = '' }: FontSelectorProps): React.ReactElement => {
  const { fontFamily, setFontFamily, prefersReducedMotion } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fontOptions: { value: FontFamily; label: string; icon: string }[] = [
    { value: 'sans-serif', label: 'Sans Serif', icon: 'mingcute:font-size-line' },
    { value: 'mono', label: 'Monospace', icon: 'mingcute:code-line' },
    { value: 'serif', label: 'Serif', icon: 'mingcute:text-line' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const buttonAnimations = useMemo(() => {
    if (prefersReducedMotion) return {};
    return {
      whileHover: { scale: 1.1 },
      whileTap: { scale: 0.95 },
    };
  }, [prefersReducedMotion]);

  const dropdownAnimations = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }
    return {
      initial: { opacity: 0, y: -10, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -10, scale: 0.95 },
    };
  }, [prefersReducedMotion]);

  const buttonStyle = useMemo(
    () => ({
      color: 'var(--text-color)',
    }),
    []
  );

  const dropdownStyle = useMemo(
    () => ({
      backgroundColor: 'var(--card-color)',
      borderColor: 'var(--border-color)',
    }),
    []
  );

  const currentFont = fontOptions.find((option) => option.value === fontFamily) || fontOptions[0];

  const toggleDropdown = useCallback(() => {
    setIsOpen((open) => !open);
  }, []);

  const handleFontSelect = useCallback(
    (font: FontFamily) => {
      setFontFamily(font);
      setIsOpen(false);
    },
    [setFontFamily]
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {prefersReducedMotion ? (
        <button
          onClick={toggleDropdown}
          className="flex items-center gap-2 rounded-full p-2"
          style={buttonStyle}
          aria-label={`Current font: ${currentFont.label}. Click to change font`}
          aria-expanded={isOpen}
          type="button"
        >
          <Icon icon={currentFont.icon} className="h-5 w-5" aria-hidden="true" />
          <span
            className="text-2xs"
            style={{
              fontFamily:
                fontFamily === 'mono'
                  ? 'var(--mono-font)'
                  : fontFamily === 'serif'
                    ? 'var(--title-font)'
                    : 'var(--body-font)',
            }}
          >
            {currentFont.label.toLowerCase()}
          </span>
        </button>
      ) : (
        <motion.button
          onClick={toggleDropdown}
          className="flex items-center gap-2 rounded-full p-2"
          style={buttonStyle}
          {...buttonAnimations}
          aria-label={`Current font: ${currentFont.label}. Click to change font`}
          aria-expanded={isOpen}
          type="button"
        >
          <Icon icon={currentFont.icon} className="h-5 w-5" aria-hidden="true" />
          <span
            className="text-2xs"
            style={{
              fontFamily:
                fontFamily === 'mono'
                  ? 'var(--mono-font)'
                  : fontFamily === 'serif'
                    ? 'var(--title-font)'
                    : 'var(--body-font)',
            }}
          >
            {currentFont.label.toLowerCase()}
          </span>
        </motion.button>
      )}

      {isOpen && (
        <motion.div
          className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border py-1 shadow-lg"
          style={dropdownStyle}
          {...dropdownAnimations}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.15 }}
        >
          {fontOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFontSelect(option.value)}
              className="ui-control-ghost flex w-full items-center gap-2 px-3 py-2 text-left text-2xs"
              style={{
                backgroundColor:
                  fontFamily === option.value ? 'var(--primary-color)' : 'transparent',
                color:
                  fontFamily === option.value ? 'var(--background-color)' : 'var(--text-color)',
                fontFamily:
                  option.value === 'mono'
                    ? 'var(--mono-font)'
                    : option.value === 'serif'
                      ? 'var(--title-font)'
                      : 'var(--body-font)',
              }}
              type="button"
            >
              <Icon icon={option.icon} className="h-4 w-4" />
              {option.label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
});

FontSelector.displayName = 'FontSelector';

export default FontSelector;
