
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

import { useTheme } from '../providers/ThemeProvider';

import FontSelector from './FontSelector';
import MotionToggle from './MotionToggle';
import ThemeSwitcher from './ThemeSwitcher';

/**
 * Props for the SettingsMenu component
 * @typedef {Object} SettingsMenuProps
 * @property {string} [className] - Optional CSS class name for styling
 * @property {boolean} [isCompact] - Whether to display in compact mode for mobile
 */
type SettingsMenuProps = {
  className?: string;
  isCompact?: boolean;
};

/**
 * SettingsMenu component that provides access to theme and background settings
 *
 * Displays a settings icon that reveals a dropdown with theme switcher and
 * background selector controls when clicked.
 *
 * @param {SettingsMenuProps} props - Component props
 * @returns {React.ReactElement} Rendered SettingsMenu component
 */
const SettingsMenu = React.memo(
  ({ className = '', isCompact = false }: SettingsMenuProps): React.ReactElement => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { prefersReducedMotion } = useTheme();

    // Memoized animation variants (disabled if motion is reduced)
    const menuVariants = useMemo(() => {
      if (prefersReducedMotion) {
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
          exit: { opacity: 0 },
        };
      }
      return {
        hidden: {
          opacity: 0,
          y: -10,
          scale: 0.95,
          transformOrigin: isCompact ? 'center top' : 'top right',
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
        },
        exit: {
          opacity: 0,
          y: -10,
          scale: 0.95,
        },
      };
    }, [isCompact, prefersReducedMotion]);

    // Memoized button animations (disabled if motion is reduced)
    const buttonAnimations = useMemo(() => {
      if (prefersReducedMotion) {
        return {};
      }
      return {
        whileHover: { scale: 1.1 },
        whileTap: { scale: 0.95 },
      };
    }, [prefersReducedMotion]);

    // Memoized transition config (faster if motion is reduced)
    const transitionConfig = useMemo(
      () => ({
        duration: prefersReducedMotion ? 0.05 : 0.2,
      }),
      [prefersReducedMotion]
    );

    // Optimized toggle function
    const toggleMenu = useCallback(() => {
      setIsOpen(!isOpen);
    }, [isOpen]);

    // Optimized event handlers
    const handleClickOutside = useCallback((event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }, []);

    const handleEscape = useCallback((event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [handleClickOutside]);

    // Close menu when pressing Escape
    useEffect(() => {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [handleEscape]);

    // Memoized style objects
    const dropdownStyle = useMemo(
      () => ({
        backgroundColor: 'var(--card-color)',
        borderColor: 'var(--border-color)',
        width: 'max-content',
        minWidth: '16rem',
        maxWidth: 'calc(100vw - 1rem)',
      }),
      []
    );

    const buttonStyle = useMemo(
      () => ({
        color: 'var(--text-color)',
      }),
      []
    );

    const headingStyle = useMemo(
      () => ({
        color: 'var(--muted-color)',
        fontFamily: "'MapleMono', 'SF Mono', 'Monaco', 'Consolas', monospace !important",
        marginTop: '0',
      }),
      []
    );

    const textStyle = useMemo(
      () => ({
        color: 'var(--text-color)',
      }),
      []
    );

    return (
      <div className={`relative ${className}`} ref={menuRef}>
        {/* Settings toggle button */}
        {prefersReducedMotion ? (
          <button
            onClick={toggleMenu}
            className={`p-2 rounded-full flex items-center justify-center ${isOpen ? 'bg-primary-color text-background-color' : ''}`}
            aria-label="Settings menu"
            title="Settings"
            aria-expanded={isOpen}
            aria-controls="settings-dropdown"
            style={buttonStyle}
          >
            <Icon icon="mingcute:settings-3-fill" className="w-5 h-5" aria-hidden="true" />
          </button>
        ) : (
          <motion.button
            onClick={toggleMenu}
            className={`p-2 rounded-full flex items-center justify-center ${isOpen ? 'bg-primary-color text-background-color' : ''}`}
            {...buttonAnimations}
            aria-label="Settings menu"
            title="Settings"
            aria-expanded={isOpen}
            aria-controls="settings-dropdown"
            style={buttonStyle}
          >
            <Icon icon="mingcute:settings-3-fill" className="w-5 h-5" aria-hidden="true" />
          </motion.button>
        )}

        {/* Dropdown menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="settings-dropdown"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={menuVariants}
              transition={transitionConfig}
              className={`absolute z-50 mt-2 p-3 rounded-lg shadow-lg border doc-card ${
                isCompact ? 'right-0 top-full' : 'right-0 top-full'
              }`}
              style={dropdownStyle}
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="settings-menu-button"
            >
              <div className="flex flex-col items-start justify-start space-y-2">
                {/* Theme section */}
                <div className="w-full">
                  <h3 className="text-2xs mb-1" style={headingStyle}>
                    APPEARANCE
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-2xs"
                      style={{ ...textStyle, fontFamily: 'var(--mono-font)' }}
                    >
                      theme
                    </span>
                    <ThemeSwitcher />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-2xs"
                      style={{ ...textStyle, fontFamily: 'var(--mono-font)' }}
                    >
                      motion
                    </span>
                    <MotionToggle />
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-2xs"
                      style={{ ...textStyle, fontFamily: 'var(--mono-font)' }}
                    >
                      font
                    </span>
                    <FontSelector />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

SettingsMenu.displayName = 'SettingsMenu';

export default SettingsMenu;
