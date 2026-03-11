
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';

import { useTheme } from '../providers/ThemeProvider';

/**
 * Props for the FontSelector component
 */
type FontSelectorProps = {
  className?: string;
};

type FontFamily = 'sans-serif' | 'mono' | 'serif';

/**
 * FontSelector component that allows switching between font families
 */
const FontSelector = React.memo(({ className = '' }: FontSelectorProps): React.ReactElement => {
  const { fontFamily, setFontFamily, prefersReducedMotion } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fontOptions: { value: FontFamily; label: string; icon: string }[] = [
    { value: 'sans-serif', label: 'Sans Serif', icon: 'mingcute:font-size-line' },
    { value: 'mono', label: 'Monospace', icon: 'mingcute:code-line' },
    { value: 'serif', label: 'Serif', icon: 'mingcute:text-line' },
  ];

  // Close dropdown when clicking outside
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

  // Memoized animation settings
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

  // Memoized style objects
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

  // Get current font option
  const currentFont = fontOptions.find((option) => option.value === fontFamily) || fontOptions[0];

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  // Handle font selection
  const handleFontSelect = useCallback(
    (font: FontFamily) => {
      setFontFamily(font);
      setIsOpen(false);
    },
    [setFontFamily]
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Font selector button */}
      {prefersReducedMotion ? (
        <button
          onClick={toggleDropdown}
          className="p-2 rounded-full flex items-center gap-2"
          style={buttonStyle}
          aria-label={`Current font: ${currentFont.label}. Click to change font`}
          aria-expanded={isOpen}
        >
          <Icon icon={currentFont.icon} className="w-5 h-5" aria-hidden="true" />
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
          className="p-2 rounded-full flex items-center gap-2"
          style={buttonStyle}
          {...buttonAnimations}
          aria-label={`Current font: ${currentFont.label}. Click to change font`}
          aria-expanded={isOpen}
        >
          <Icon icon={currentFont.icon} className="w-5 h-5" aria-hidden="true" />
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

      {/* Dropdown menu */}
      {isOpen && (
        <motion.div
          className="absolute top-full right-0 mt-1 py-1 rounded-lg shadow-lg border z-50 min-w-[140px]"
          style={dropdownStyle}
          {...dropdownAnimations}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.15 }}
        >
          {fontOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFontSelect(option.value)}
              className="w-full px-3 py-2 text-left text-2xs hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
              style={{
                backgroundColor:
                  fontFamily === option.value ? 'var(--primary-color)' : 'transparent',
                color: fontFamily === option.value ? 'white' : 'var(--text-color)',
                fontFamily:
                  option.value === 'mono'
                    ? 'var(--mono-font)'
                    : option.value === 'serif'
                      ? 'var(--title-font)'
                      : 'var(--body-font)',
              }}
            >
              <Icon icon={option.icon} className="w-4 h-4" />
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
