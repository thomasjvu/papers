import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';

import { socialLinks } from '../constants/social';
import { UI_CLASSES } from '../constants/ui';
import { useCommandPalette } from '../providers/CommandPaletteProvider';
import { useTheme } from '../providers/ThemeProvider';

import FontSelector from './FontSelector';
import MotionToggle from './MotionToggle';
import SettingsMenu from './SettingsMenu';
import ThemeSwitcher from './ThemeSwitcher';

type NavigationProps = {
  docsPath?: string;
  onToggleSidebar?: () => void;
};

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: 'Design System', href: '/docs/developer-guides/design-system' },
  { label: 'Deployment', href: '/docs/deployment/overview' },
  { label: 'LLMs.txt', href: '/llms' },
];

const bracketAnimationConfig = {
  duration: 0.4,
  times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
  ease: 'easeOut' as const,
};

const exitAnimationConfig = {
  duration: 0.3,
  times: [0, 0.2, 0.4, 0.6, 0.8, 1],
  ease: 'easeOut' as const,
};

export default function Navigation({
  docsPath,
  onToggleSidebar,
}: NavigationProps): React.ReactElement {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { prefersReducedMotion } = useTheme();
  const { openCommandPalette } = useCommandPalette();
  const isDocsPage = docsPath !== undefined;
  const siteName = import.meta.env.VITE_SITE_NAME || 'papers';
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
  const shortcutLabel = isMac ? 'Cmd + K' : 'Ctrl + K';

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  const leftBracketVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 0, color: 'var(--primary-color)' },
        animate: { opacity: 1, color: 'var(--primary-color)', transition: { duration: 0.05 } },
        exit: { opacity: 0, color: 'var(--primary-color)', transition: { duration: 0.05 } },
      };
    }
    return {
      initial: {
        opacity: 0,
        x: -10,
        color: 'var(--primary-color)',
      },
      animate: {
        opacity: [0, 0.4, 0, 0.7, 0, 1, 0, 0, 0, 0.5, 1],
        x: [-10, -9, -7, -5, -4, -2, 0, 0, 0, 0, 0],
        scale: [1, 1.2, 0.8, 1.1, 0.9, 1.0, 0.95, 1.1, 0.9, 1.0, 1],
        color: [
          'var(--primary-color)',
          'transparent',
          'var(--animation-text-color)',
          'transparent',
          'transparent',
          'var(--primary-color)',
          'transparent',
          'transparent',
          'transparent',
          'var(--animation-text-color)',
          'var(--primary-color)',
        ],
        transition: {
          ...bracketAnimationConfig,
          scale: { ...bracketAnimationConfig, ease: 'easeInOut' },
          opacity: { ...bracketAnimationConfig, ease: 'linear' },
          color: { ...bracketAnimationConfig, ease: 'linear' },
        },
      },
      exit: {
        opacity: [1, 0, 0.7, 0, 0.4, 0],
        x: [-2, -4, -5, -7, -9, -10],
        color: 'var(--primary-color)',
        transition: {
          ...exitAnimationConfig,
          opacity: { ...exitAnimationConfig, ease: 'linear' },
        },
      },
    };
  }, [prefersReducedMotion]);

  const rightBracketVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 0, color: 'var(--primary-color)' },
        animate: { opacity: 1, color: 'var(--primary-color)', transition: { duration: 0.05 } },
        exit: { opacity: 0, color: 'var(--primary-color)', transition: { duration: 0.05 } },
      };
    }
    return {
      initial: {
        opacity: 0,
        x: 10,
        color: 'var(--primary-color)',
      },
      animate: {
        opacity: [0, 0.4, 0, 0.7, 0, 1, 0, 0, 0, 0.5, 1],
        x: [10, 9, 7, 5, 4, 2, 0, 0, 0, 0, 0],
        scale: [1, 1.2, 0.8, 1.1, 0.9, 1.0, 0.95, 1.1, 0.9, 1.0, 1],
        color: [
          'var(--primary-color)',
          'transparent',
          'var(--animation-text-color)',
          'transparent',
          'transparent',
          'var(--primary-color)',
          'transparent',
          'transparent',
          'transparent',
          'var(--animation-text-color)',
          'var(--primary-color)',
        ],
        transition: {
          ...bracketAnimationConfig,
          scale: { ...bracketAnimationConfig, ease: 'easeInOut' },
          opacity: { ...bracketAnimationConfig, ease: 'linear' },
          color: { ...bracketAnimationConfig, ease: 'linear' },
        },
      },
      exit: {
        opacity: [1, 0, 0.7, 0, 0.4, 0],
        x: [2, 4, 5, 7, 9, 10],
        color: 'var(--primary-color)',
        transition: {
          ...exitAnimationConfig,
          opacity: { ...exitAnimationConfig, ease: 'linear' },
        },
      },
    };
  }, [prefersReducedMotion]);

  const mobileMenuVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }
    return {
      hidden: { opacity: 0, height: 0 },
      visible: { opacity: 1, height: 'auto' },
      exit: { opacity: 0, height: 0 },
    };
  }, [prefersReducedMotion]);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const handleMobileNavClick = useCallback(() => {
    setMobileMenuOpen(false);
    setHoveredItem(null);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    if (onToggleSidebar) {
      onToggleSidebar();
      setMobileMenuOpen(false);
    }
  }, [onToggleSidebar]);

  const renderNavLink = useCallback(
    (item: NavItem, isMobile = false): React.ReactElement => (
      <Link
        key={item.label}
        to={item.href}
        className={`transition-colors nav-link ${isMobile ? 'py-2 px-4' : ''} relative`}
        style={{
          color: 'var(--text-color)',
          fontFamily: 'var(--mono-font)',
          ...(isMobile ? {} : { letterSpacing: '-0.02em' }),
        }}
        onClick={isMobile ? handleMobileNavClick : undefined}
        onMouseEnter={() => setHoveredItem(item.label)}
        onMouseLeave={() => setHoveredItem(null)}
        tabIndex={0}
      >
        <div className="flex items-center relative">
          <AnimatePresence>
            {hoveredItem === item.label ? (
              <motion.span
                className="bracket-left"
                style={{ left: '-1.5rem' }}
                key="bracket-left"
                variants={leftBracketVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                [
              </motion.span>
            ) : null}
          </AnimatePresence>

          <span className="px-2">{item.label}</span>

          <AnimatePresence>
            {hoveredItem === item.label ? (
              <motion.span
                className="bracket-right"
                style={{ right: '-1.5rem' }}
                key="bracket-right"
                variants={rightBracketVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                ]
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </Link>
    ),
    [hoveredItem, leftBracketVariants, rightBracketVariants, handleMobileNavClick]
  );

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 header-bar"
      style={{ backgroundColor: 'var(--card-color)' }}
    >
      <div className="max-w-full mx-auto px-5 md:px-8 flex items-center justify-between h-12">
        <Link
          to="/"
          className="logo-link flex items-center gap-3"
          style={{ color: 'var(--text-color)' }}
          tabIndex={0}
        >
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-black"
            style={{
              borderColor: 'var(--border-unified)',
              backgroundColor: 'var(--card-color)',
              color: 'var(--text-color)',
              fontFamily: 'var(--mono-font)',
            }}
          >
            P
          </span>
          <span
            className="text-lg tracking-wider uppercase font-black"
            style={{ fontFamily: 'var(--mono-font)' }}
          >
            {siteName}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {renderNavLink(item)}
              </div>
            ))}

            <div
              className="ml-2 mr-2 h-6 w-px"
              style={{ backgroundColor: 'var(--border-unified)' }}
              aria-hidden="true"
            ></div>
          </nav>

          <button
            onClick={openCommandPalette}
            className="ui-control-ghost hidden items-center gap-2 rounded-md px-3 py-1.5 text-sm md:flex"
            style={{
              color: 'var(--muted-color)',
              fontFamily: 'var(--mono-font)',
            }}
            title="Open command palette"
          >
            <Icon icon="mingcute:search-ai-line" className="w-4 h-4" />
            <kbd
              className="hidden lg:inline-block px-1.5 py-0.5 text-xs border rounded"
              style={{ borderColor: 'var(--border-color)' }}
            >
              {shortcutLabel}
            </kbd>
          </button>

          <div className="hidden md:flex items-center gap-2">
            <SettingsMenu className="hover:text-primary-color" />
          </div>

          <div className="flex md:hidden items-center">
            <button
              onClick={handleMobileMenuToggle}
              style={{ color: 'var(--text-color)' }}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
              tabIndex={0}
            >
              {mobileMenuOpen ? (
                <Icon icon="mingcute:close-line" className="w-6 h-6" />
              ) : (
                <Icon icon="mingcute:menu-line" className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mobileMenuVariants}
            transition={{ duration: 0.2 }}
            className="md:hidden"
          >
            <nav
              className="flex flex-col gap-1 p-3 border-t shadow-lg"
              style={{
                backgroundColor: 'var(--background-color)',
                borderColor: 'var(--border-color)',
              }}
            >
              {navItems.map((item) => (
                <div key={item.label}>{renderNavLink(item, true)}</div>
              ))}

              <div
                className="pt-3 pb-2 px-4 border-t mt-2"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-sm"
                    style={{
                      color: 'var(--muted-color)',
                      fontFamily: 'var(--mono-font)',
                    }}
                  >
                    theme
                  </span>
                  <ThemeSwitcher />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-sm"
                    style={{
                      color: 'var(--muted-color)',
                      fontFamily: 'var(--mono-font)',
                    }}
                  >
                    motion
                  </span>
                  <MotionToggle />
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm"
                    style={{
                      color: 'var(--muted-color)',
                      fontFamily: 'var(--mono-font)',
                    }}
                  >
                    font
                  </span>
                  <FontSelector />
                </div>
              </div>

              {isDocsPage && onToggleSidebar && (
                <div
                  className="pt-3 pb-2 px-4 border-t"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      const event = new CustomEvent('openMindMap');
                      window.dispatchEvent(event);
                    }}
                    className="flex items-center gap-2 py-2 w-full hover:text-primary-color transition-colors text-sm"
                    style={{
                      color: 'var(--text-color)',
                      fontFamily: 'var(--mono-font)',
                    }}
                  >
                    <Icon icon="mingcute:brain-fill" className="w-5 h-5" />
                    <span>show mind map</span>
                  </button>
                  <button
                    onClick={handleSidebarToggle}
                    className="flex items-center gap-2 py-2 w-full hover:text-primary-color transition-colors text-sm"
                    style={{
                      color: 'var(--text-color)',
                      fontFamily: 'var(--mono-font)',
                    }}
                  >
                    <Icon icon="mingcute:folder-line" className="w-5 h-5" />
                    <span>show documentation tree</span>
                  </button>
                </div>
              )}

              <div
                className="pt-3 pb-3 px-4 border-t"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="ui-meta text-sm" style={{ fontFamily: 'var(--mono-font)' }}>
                    links:
                  </span>
                  {socialLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`social-link flex items-center gap-1 ${UI_CLASSES.button}`}
                      style={{
                        color: 'var(--muted-color)',
                      }}
                    >
                      <div className="w-4 h-4">{link.icon}</div>
                      <span
                        className="text-xs"
                        style={{
                          fontFamily: 'var(--mono-font)',
                        }}
                      >
                        {link.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
