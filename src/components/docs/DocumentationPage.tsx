import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { documentationTree } from '../../data/documentation';
import { useCommandPalette } from '../../providers/CommandPaletteProvider';
import { useTheme } from '../../providers/ThemeProvider';
import type { FileItem } from '../../types/documentation';
import { stripMarkdownBom } from '../../utils/markdown';
import safeLocalStorage from '../../utils/storage';
import ContentRenderer from '../ContentRenderer';
import DocumentationGraph from '../DocumentationGraph/OptimizedDocumentationGraph';
import FileTree from '../FileTree';
import fileTreeStyles from '../FileTree.module.css';
import SettingsMenu from '../SettingsMenu';
import { socialLinks } from '../../constants/social';
import { UI_CLASSES } from '../../constants/ui';
import { getMobileTogglePositionClasses, uiConfig } from '../../config/ui';
import TableOfContents from './TableOfContents';
import { buildCanonicalDocsPath, parseDocsRoutePath } from '../../../shared/docsRouting.js';

interface DocumentationPageProps {
  initialContent: string;
  currentPath: string;
  sourcePath?: string;
  isLoading?: boolean;
  pendingPath?: string;
}

function getInitialRightSidebarState(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const saved = safeLocalStorage.getItem('rightSidebarVisible');
  return saved === null ? true : saved === 'true';
}

function RightRailFooter() {
  return (
    <div className="flex-shrink-0 pb-3">
      <div className="mb-2 flex items-center justify-center gap-2.5">
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.name}
            className={`social-link ${UI_CLASSES.button}`}
            style={{ color: 'var(--toc-text-color)' }}
          >
            <div className="h-5 w-5">{link.icon}</div>
          </a>
        ))}
      </div>

      <div className="text-center">
        <p
          className="text-2xs font-mono leading-none"
          style={{
            color: 'var(--toc-text-color)',
            fontFamily: 'var(--mono-font)',
          }}
        >
          Design by{' '}
          <a
            href="https://x.com/ultima_gg"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-color)' }}
          >
            Ultima
          </a>
        </p>
      </div>
    </div>
  );
}

const DocumentationPage = React.memo(
  ({
    initialContent,
    currentPath,
    sourcePath,
    isLoading = false,
    pendingPath,
  }: DocumentationPageProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { openCommandPalette } = useCommandPalette();
    const { prefersReducedMotion } = useTheme();
    const content = useMemo(() => stripMarkdownBom(initialContent), [initialContent]);
    const path = currentPath;
    const siteName = import.meta.env.VITE_SITE_NAME || 'papers';
    const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
    const shortcutLabel = isMac ? 'Cmd + K' : 'Ctrl + K';
    const nextPathLabel = useMemo(
      () => pendingPath?.split('/').pop()?.replace(/-/g, ' '),
      [pendingPath]
    );
    const docsRouteSlug = location.pathname.startsWith('/docs')
      ? location.pathname.replace(/^\/docs\/?/, '')
      : '';
    const routeContext = useMemo(() => parseDocsRoutePath(docsRouteSlug), [docsRouteSlug]);

    const [isMobile, setIsMobile] = useState(() => {
      if (typeof window === 'undefined') {
        return false;
      }

      return window.innerWidth < 768;
    });
    const [sidebarVisible, setSidebarVisible] = useState(() => {
      if (typeof window === 'undefined') {
        return false;
      }

      return window.innerWidth >= 768;
    });
    const [rightSidebarVisible, setRightSidebarVisible] = useState(getInitialRightSidebarState);
    const [mobileMapVisible, setMobileMapVisible] = useState(false);

    const sidebarAnimationVariants = useMemo(() => {
      if (prefersReducedMotion) {
        return {
          mobile: {
            initial: { opacity: 0, position: 'fixed' as const },
            animate: { opacity: 1, position: 'fixed' as const },
            exit: { opacity: 0, position: 'fixed' as const },
          },
          desktop: {
            initial: { opacity: 1, position: 'relative' as const },
            animate: { opacity: 1, position: 'relative' as const },
            exit: { opacity: 1, position: 'relative' as const },
          },
        };
      }

      return {
        mobile: {
          initial: { opacity: 0, x: -96, position: 'fixed' as const },
          animate: { opacity: 1, x: 0, position: 'fixed' as const },
          exit: { opacity: 0, x: -96, position: 'fixed' as const },
        },
        desktop: {
          initial: { opacity: 1, x: 0, position: 'relative' as const },
          animate: { opacity: 1, x: 0, position: 'relative' as const },
          exit: { opacity: 1, x: 0, position: 'relative' as const },
        },
      };
    }, [prefersReducedMotion]);

    const transitionConfig = useMemo(
      () => ({
        duration: prefersReducedMotion ? 0.05 : 0.25,
      }),
      [prefersReducedMotion]
    );

    const buttonAnimationConfig = useMemo(() => {
      if (prefersReducedMotion) {
        return {
          initial: { opacity: 1 },
          animate: { opacity: 1 },
          exit: { opacity: 1 },
          transition: { duration: 0.05 },
        };
      }

      return {
        whileHover: { scale: 1.06 },
        whileTap: { scale: 0.96 },
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
        transition: { duration: 0.2 },
      };
    }, [prefersReducedMotion]);

    const rightRailPanelVariants = useMemo(() => {
      if (prefersReducedMotion) {
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
          exit: { opacity: 0 },
        };
      }

      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }, [prefersReducedMotion]);

    const rightRailPanelTransition = useMemo(
      () => ({
        duration: prefersReducedMotion ? 0.05 : 0.12,
        ease: 'easeOut' as const,
      }),
      [prefersReducedMotion]
    );

    useEffect(() => {
      if (typeof window === 'undefined') {
        return undefined;
      }

      const handleResize = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        setSidebarVisible(!mobile);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSelectFile = useCallback(
      (item: FileItem) => {
        if (item.type !== 'file') {
          return;
        }

        navigate(
          buildCanonicalDocsPath(item.path, {
            version: routeContext.activeVersion,
            locale: routeContext.activeLocale,
          })
        );

        if (isMobile) {
          setSidebarVisible(false);
        }
      },
      [isMobile, navigate, routeContext.activeLocale, routeContext.activeVersion]
    );

    const toggleSidebar = useCallback(() => {
      setSidebarVisible((visible) => !visible);
    }, []);

    const setRightSidebarVisibility = useCallback((nextState: boolean) => {
      setRightSidebarVisible(nextState);
      safeLocalStorage.setItem('rightSidebarVisible', nextState.toString());
    }, []);

    const toggleRightSidebar = useCallback(() => {
      setRightSidebarVisibility(!rightSidebarVisible);
    }, [rightSidebarVisible, setRightSidebarVisibility]);

    const handleMapButtonClick = useCallback(() => {
      if (isMobile) {
        setMobileMapVisible(true);
        setSidebarVisible(false);
        return;
      }

      setRightSidebarVisibility(!rightSidebarVisible);
    }, [isMobile, rightSidebarVisible, setRightSidebarVisibility]);

    const sidebarStyle = useMemo(
      () => ({
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderTopRightRadius: 0,
      }),
      []
    );

    const contentOpacityClass = useMemo(
      () => (sidebarVisible && isMobile ? 'opacity-40' : 'opacity-100'),
      [isMobile, sidebarVisible]
    );

    const floatingButtonStyle = useMemo(
      () => ({
        backgroundColor: 'var(--card-color)',
        border: '1px solid var(--border-unified)',
        color: 'var(--text-color)',
      }),
      []
    );

    const utilityButtonStyle = useMemo(
      () => ({
        backgroundColor: 'var(--card-color)',
        borderColor: 'var(--border-unified)',
        color: 'var(--text-color)',
        fontFamily: 'var(--mono-font)',
      }),
      []
    );

    const searchButtonStyle = useMemo(
      () => ({
        backgroundColor: 'var(--background-color)',
        borderColor: 'var(--border-unified)',
        color: 'var(--muted-color)',
        fontFamily: 'var(--mono-font)',
      }),
      []
    );

    return (
      <main
        className="flex h-screen overflow-hidden"
        style={{ backgroundColor: 'var(--background-color)' }}
      >
        <AnimatePresence>
          {isMobile && sidebarVisible && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitionConfig}
              className="fixed inset-0 z-30 md:hidden"
              style={{ backgroundColor: 'var(--overlay-color)' }}
              onClick={toggleSidebar}
              aria-label="Close sidebar"
              type="button"
            />
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {sidebarVisible && (
            <motion.aside
              initial={
                isMobile
                  ? sidebarAnimationVariants.mobile.initial
                  : sidebarAnimationVariants.desktop.initial
              }
              animate={
                isMobile
                  ? sidebarAnimationVariants.mobile.animate
                  : sidebarAnimationVariants.desktop.animate
              }
              exit={
                isMobile
                  ? sidebarAnimationVariants.mobile.exit
                  : sidebarAnimationVariants.desktop.exit
              }
              transition={isMobile ? transitionConfig : { duration: 0 }}
              className={`docs-sidebar ${fileTreeStyles.fileTreePanel} z-40 flex h-screen shrink-0 flex-col border-r p-4 ${
                isMobile ? 'inset-y-0 left-0 w-[min(18rem,calc(100vw-2.5rem))] shadow-2xl' : 'w-72'
              }`}
              style={sidebarStyle}
            >
              <div className="border-b pb-4" style={{ borderColor: 'var(--border-unified)' }}>
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to="/"
                    className="group inline-flex min-w-0 items-center gap-3"
                    style={{ color: 'var(--text-color)' }}
                  >
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-black"
                      style={{
                        borderColor: 'var(--border-unified)',
                        backgroundColor: 'var(--card-color)',
                        color: 'var(--text-color)',
                        fontFamily: 'var(--mono-font)',
                      }}
                    >
                      P
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-sm uppercase tracking-[0.28em]"
                        style={{ color: 'var(--muted-color)', fontFamily: 'var(--mono-font)' }}
                      >
                        Docs
                      </span>
                      <span
                        className="block truncate text-lg font-black uppercase tracking-[0.18em]"
                        style={{ color: 'var(--text-color)', fontFamily: 'var(--mono-font)' }}
                      >
                        {siteName}
                      </span>
                    </span>
                  </Link>

                  {isMobile && (
                    <button
                      onClick={toggleSidebar}
                      className="rounded-full p-2 transition-opacity hover:opacity-70 md:hidden"
                      aria-label="Close sidebar"
                      style={{ color: 'var(--text-color)' }}
                      type="button"
                    >
                      <Icon icon="mingcute:close-line" className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={openCommandPalette}
                  className="mt-4 flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm transition-opacity hover:opacity-80"
                  style={searchButtonStyle}
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon icon="mingcute:search-ai-line" className="h-4 w-4 shrink-0" />
                    <span className="truncate">Search docs</span>
                  </span>
                  <kbd
                    className="hidden rounded border px-1.5 py-0.5 text-xs md:inline-block"
                    style={{ borderColor: 'var(--border-unified)', color: 'var(--muted-color)' }}
                  >
                    {shortcutLabel}
                  </kbd>
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto py-4 scrollbar-hide">
                <FileTree
                  items={documentationTree}
                  onSelect={handleSelectFile}
                  currentPath={path}
                  defaultOpenAll={true}
                />
              </div>

              <div
                className="border-t pt-4 space-y-2"
                style={{ borderColor: 'var(--border-unified)' }}
              >
                <Link
                  to="/llms"
                  className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-opacity hover:opacity-80"
                  style={utilityButtonStyle}
                >
                  <span className="flex items-center gap-2">
                    <Icon icon="mingcute:file-info-line" className="h-4 w-4" />
                    <span>LLMs.txt</span>
                  </span>
                  <Icon icon="mingcute:arrow-right-line" className="h-4 w-4" />
                </Link>

                <button
                  onClick={handleMapButtonClick}
                  className="group flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-opacity hover:opacity-80"
                  style={utilityButtonStyle}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <Icon
                      icon="mingcute:brain-line"
                      className="h-4 w-4 transition duration-150 group-hover:invert"
                    />
                    <span>
                      {isMobile ? 'Open map' : rightSidebarVisible ? 'Hide map' : 'Show map'}
                    </span>
                  </span>
                  <Icon
                    icon={
                      isMobile || !rightSidebarVisible
                        ? 'mingcute:arrow-right-line'
                        : 'mingcute:arrow-left-line'
                    }
                    className="h-4 w-4"
                  />
                </button>

                <div
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                  style={{
                    backgroundColor: 'var(--card-color)',
                    borderColor: 'var(--border-unified)',
                  }}
                >
                  <div>
                    <p
                      className="text-2xs uppercase tracking-[0.2em]"
                      style={{ color: 'var(--muted-color)', fontFamily: 'var(--mono-font)' }}
                    >
                      Preferences
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-color)', fontFamily: 'var(--mono-font)' }}
                    >
                      Theme and motion
                    </p>
                  </div>
                  <SettingsMenu placement="top" />
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className={`relative flex min-w-0 flex-1 overflow-hidden ${contentOpacityClass}`}>
          {uiConfig.showMobileFileTreeToggle &&
            isMobile &&
            !sidebarVisible &&
            (prefersReducedMotion ? (
              <button
                onClick={toggleSidebar}
                className={`fixed z-30 rounded-lg p-3 shadow-lg ${getMobileTogglePositionClasses(uiConfig.mobileTogglePosition)}`}
                aria-label="Show documentation tree"
                style={floatingButtonStyle}
                type="button"
              >
                <Icon icon="mingcute:menu-line" className="h-5 w-5" />
              </button>
            ) : (
              <motion.button
                onClick={toggleSidebar}
                className={`fixed z-30 rounded-lg p-3 shadow-lg ${getMobileTogglePositionClasses(uiConfig.mobileTogglePosition)}`}
                aria-label="Show documentation tree"
                style={floatingButtonStyle}
                type="button"
                {...buttonAnimationConfig}
              >
                <Icon icon="mingcute:menu-line" className="h-5 w-5" />
              </motion.button>
            ))}

          <div className="flex h-full w-full gap-6 overflow-hidden">
            <div className="relative min-w-0 flex-1">
              {isLoading && (
                <div
                  className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                  style={{
                    backgroundColor: 'var(--card-color)',
                    borderColor: 'var(--border-unified)',
                    color: 'var(--muted-color)',
                    fontFamily: 'var(--mono-font)',
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full"
                    style={{ backgroundColor: 'var(--primary-color)' }}
                  />
                  Loading {nextPathLabel || 'page'}...
                </div>
              )}

              <ContentRenderer content={content} path={path} sourcePath={sourcePath} />
            </div>
          </div>
        </div>

        <div
          className="hidden h-full shrink-0 lg:block"
          style={{
            backgroundColor: 'var(--background-color)',
          }}
        >
          <div className="flex h-full w-72 flex-col overflow-hidden px-4 py-4 xl:w-80">
            <div className="relative min-h-0 flex-1">
              <AnimatePresence initial={false} mode="wait">
                {rightSidebarVisible ? (
                  <motion.div
                    key="interactive-map"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={rightRailPanelVariants}
                    transition={rightRailPanelTransition}
                    className="absolute inset-0 flex h-full flex-col pt-5 will-change-[opacity]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3
                        className="mb-1 text-sm font-semibold font-mono"
                        style={{
                          color: 'var(--mindmap-text-color)',
                          fontFamily: 'var(--mono-font)',
                          marginTop: '1px',
                        }}
                      >
                        Interactive Map
                      </h3>
                      <button
                        onClick={toggleRightSidebar}
                        className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 transition-opacity hover:opacity-80"
                        aria-label="Show table of contents"
                        style={{
                          backgroundColor: 'var(--card-color)',
                          borderColor: 'var(--border-unified)',
                          color: 'var(--text-color)',
                          fontFamily: 'var(--mono-font)',
                        }}
                        type="button"
                      >
                        TOC
                      </button>
                    </div>
                    <div className="min-h-0 flex-1">
                      <DocumentationGraph
                        currentPath={path}
                        onNodeClick={(nodePath) => {
                          navigate(
                            buildCanonicalDocsPath(nodePath, {
                              version: routeContext.activeVersion,
                              locale: routeContext.activeLocale,
                            })
                          );
                        }}
                        className="h-full w-full"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="table-of-contents"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={rightRailPanelVariants}
                    transition={rightRailPanelTransition}
                    className="absolute inset-0 flex h-full flex-col pt-5 will-change-[opacity]"
                  >
                    <div className="min-h-0 flex-1">
                      <TableOfContents
                        content={content}
                        onToggleInteractiveMap={toggleRightSidebar}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-shrink-0 pt-3">
              <RightRailFooter />
            </div>
          </div>
        </div>
        <AnimatePresence>
          {isMobile && mobileMapVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50"
              style={{ backgroundColor: 'var(--overlay-color)' }}
              onClick={() => setMobileMapVisible(false)}
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0.05 : 0.3 }}
                className="absolute inset-x-4 bottom-4 top-12 rounded-lg p-4 shadow-xl"
                style={{ backgroundColor: 'var(--background-color)' }}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  onClick={() => setMobileMapVisible(false)}
                  className="absolute right-4 top-4 rounded-full p-2 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-color)' }}
                  aria-label="Close mind map"
                  type="button"
                >
                  <Icon icon="mingcute:close-line" className="h-5 w-5" />
                </button>

                <h3
                  className="mb-4 text-lg font-semibold font-mono"
                  style={{
                    color: 'var(--mindmap-text-color)',
                    fontFamily: 'var(--mono-font)',
                  }}
                >
                  Interactive Map
                </h3>

                <div className="h-full pb-16">
                  <DocumentationGraph
                    currentPath={path}
                    onNodeClick={(nodePath) => {
                      navigate(
                        buildCanonicalDocsPath(nodePath, {
                          version: routeContext.activeVersion,
                          locale: routeContext.activeLocale,
                        })
                      );
                      setMobileMapVisible(false);
                    }}
                    className="h-full w-full"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    );
  }
);

DocumentationPage.displayName = 'DocumentationPage';

export default DocumentationPage;
