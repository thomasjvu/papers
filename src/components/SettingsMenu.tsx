import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

import { useTheme } from '../providers/ThemeProvider';

import FontSelector from './FontSelector';
import MotionToggle from './MotionToggle';
import ThemeSwitcher from './ThemeSwitcher';

type SettingsMenuProps = {
  className?: string;
  isCompact?: boolean;
  placement?: 'top' | 'bottom';
};

const SettingsMenu = React.memo(
  ({ className = '', isCompact = false, placement = 'bottom' }: SettingsMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { prefersReducedMotion } = useTheme();

    const menuDirection = placement === 'top' ? 10 : -10;
    const dropdownPositionClass =
      placement === 'top' ? 'bottom-full right-0 mb-2' : 'top-full right-0 mt-2';

    const menuVariants = useMemo(() => {
      if (prefersReducedMotion) {
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
          exit: { opacity: 0 },
        };
      }

      const transformOrigin =
        placement === 'top'
          ? isCompact
            ? 'center bottom'
            : 'bottom right'
          : isCompact
            ? 'center top'
            : 'top right';

      return {
        hidden: {
          opacity: 0,
          y: menuDirection,
          scale: 0.95,
          transformOrigin,
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
        },
        exit: {
          opacity: 0,
          y: menuDirection,
          scale: 0.95,
        },
      };
    }, [isCompact, menuDirection, placement, prefersReducedMotion]);

    const buttonAnimations = useMemo(() => {
      if (prefersReducedMotion) {
        return {};
      }

      return {
        whileHover: { scale: 1.1 },
        whileTap: { scale: 0.95 },
      };
    }, [prefersReducedMotion]);

    const transitionConfig = useMemo(
      () => ({
        duration: prefersReducedMotion ? 0.05 : 0.2,
      }),
      [prefersReducedMotion]
    );

    const toggleMenu = useCallback(() => {
      setIsOpen((open) => !open);
    }, []);

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

    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [handleClickOutside]);

    useEffect(() => {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [handleEscape]);

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
        {prefersReducedMotion ? (
          <button
            onClick={toggleMenu}
            className={`flex items-center justify-center rounded-full p-2 ${isOpen ? 'bg-primary-color text-background-color' : ''}`}
            aria-label="Settings menu"
            title="Settings"
            aria-expanded={isOpen}
            aria-controls="settings-dropdown"
            style={buttonStyle}
            type="button"
          >
            <Icon icon="mingcute:settings-3-fill" className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <motion.button
            onClick={toggleMenu}
            className={`flex items-center justify-center rounded-full p-2 ${isOpen ? 'bg-primary-color text-background-color' : ''}`}
            {...buttonAnimations}
            aria-label="Settings menu"
            title="Settings"
            aria-expanded={isOpen}
            aria-controls="settings-dropdown"
            style={buttonStyle}
            type="button"
          >
            <Icon icon="mingcute:settings-3-fill" className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        )}

        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="settings-dropdown"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={menuVariants}
              transition={transitionConfig}
              className={`absolute z-50 rounded-lg border p-3 shadow-lg doc-card ${dropdownPositionClass}`}
              style={dropdownStyle}
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="settings-menu-button"
            >
              <div className="flex flex-col items-start justify-start space-y-2">
                <div className="w-full">
                  <h3 className="text-2xs mb-1" style={headingStyle}>
                    APPEARANCE
                  </h3>
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className="text-2xs"
                      style={{ ...textStyle, fontFamily: 'var(--mono-font)' }}
                    >
                      theme
                    </span>
                    <ThemeSwitcher />
                  </div>
                  <div className="mb-2 flex items-center justify-between">
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
