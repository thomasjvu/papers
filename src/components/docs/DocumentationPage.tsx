import { Icon } from '@iconify/react';
import { AnimatePresence } from 'framer-motion';
import { aside as MotionAside, button as MotionButton, div as MotionDiv } from 'framer-motion/m';
import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { getContentCollection } from '../../data/collections';
import { useCommandPalette } from '../../providers/CommandPaletteProvider';
import { useTheme } from '../../providers/useTheme';
import type { FileItem } from '../../types/documentation';
import { stripMarkdownBom } from '../../utils/markdown';
import safeLocalStorage from '../../utils/storage';
import type { DocumentContentFormat } from '../../lib/content';
import { prefetchDocument } from '../../lib/content';
import ContentRenderer from '../ContentRenderer';
import DocsVariantSelector from '../DocsVariantSelector';
const DocumentationGraph = React.lazy(
  () => import('../DocumentationGraph/OptimizedDocumentationGraph')
);
import LanguageSwitcher from '../chrome/LanguageSwitcher';
import SiteAttribution from '../chrome/SiteAttribution';
import fileTreeStyles from '../FileTree.module.css';
import SidebarNav from '../sidebar/SidebarNav';
import SettingsMenu from '../SettingsMenu';
import { getMobileTogglePositionClasses, uiConfig } from '../../config/ui';
import { brandingConfig } from '../../lib/chrome';
import TableOfContents from './TableOfContents';
import {
  buildCanonicalCollectionPath,
  buildCanonicalDocsPath,
  parseCollectionRoutePath,
} from '../../../shared/docsRouting.js';
import type { ContentCollection } from '../../../shared/docsRouting.js';
import { useUiStrings } from '../../lib/uiStrings';

interface DocumentationPageProps {
  initialContent: string;
  currentPath: string;
  sourcePath?: string;
  contentFormat?: DocumentContentFormat;
  contentSlot?: React.ReactNode;
  trailingContent?: ReactNode;
  isLoading?: boolean;
  pendingPath?: string;
  collection?: ContentCollection;
}

function getInitialRightSidebarState(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const saved = safeLocalStorage.getItem('rightSidebarVisible');
  return saved === 'true';
}

const DocumentationPage = React.memo(
  ({
    initialContent,
    currentPath,
    sourcePath,
    contentFormat = 'markdown',
    contentSlot,
    trailingContent,
    isLoading = false,
    pendingPath,
    collection,
  }: DocumentationPageProps) => {
    const ui = useUiStrings();
    const navigate = useNavigate();
    const location = useLocation();
    const { openCommandPalette } = useCommandPalette();
    const { prefersReducedMotion } = useTheme();
    const content = useMemo(() => stripMarkdownBom(initialContent), [initialContent]);
    const activeCollection = collection || getContentCollection('docs');
    const path = currentPath;
    const siteName = import.meta.env.VITE_SITE_NAME || 'papers';
    const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
    const shortcutLabel = isMac ? 'Cmd + K' : 'Ctrl + K';
    const nextPathLabel = useMemo(
      () => pendingPath?.split('/').pop()?.replace(/-/g, ' '),
      [pendingPath]
    );
    const navigationTree = activeCollection.tree;
    const routePrefix =
      String(activeCollection.routePrefix || '/docs').replace(/\/+$/, '') || '/docs';
    const docsRouteSlug = location.pathname.startsWith(routePrefix)
      ? location.pathname.replace(new RegExp(`^${routePrefix}/?`), '')
      : '';
    const routeContext = useMemo(
      () => parseCollectionRoutePath(activeCollection, docsRouteSlug),
      [activeCollection, docsRouteSlug]
    );

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
          buildCanonicalCollectionPath(activeCollection, item.path, {
            version: routeContext.activeVersion,
            locale: routeContext.activeLocale,
          })
        );

        if (isMobile) {
          setSidebarVisible(false);
        }
      },
      [activeCollection, isMobile, navigate, routeContext.activeLocale, routeContext.activeVersion]
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
        color: 'var(--papers-text-color)',
      }),
      []
    );

    const utilityButtonStyle = useMemo(
      () => ({
        backgroundColor: 'var(--card-color)',
        borderColor: 'var(--border-unified)',
        color: 'var(--papers-text-color)',
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
            <MotionButton
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitionConfig}
              className="fixed inset-0 z-30 md:hidden"
              style={{ backgroundColor: 'var(--overlay-color)' }}
              onClick={toggleSidebar}
              aria-label={ui.closeSidebar}
              type="button"
            />
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {sidebarVisible && (
            <MotionAside
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
              <div className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to="/"
                    className="group inline-flex min-w-0 items-center gap-3"
                    style={{ color: 'var(--papers-text-color)' }}
                  >
                    {brandingConfig.logo?.src ? (
                      <img
                        src={brandingConfig.logo.src}
                        alt=""
                        aria-hidden="true"
                        className="h-9 w-9 shrink-0 object-contain"
                      />
                    ) : (
                      <span
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-sm font-black"
                        style={{
                          color: 'var(--papers-text-color)',
                          fontFamily: 'var(--mono-font)',
                        }}
                      >
                        {(brandingConfig.productName || siteName).charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span
                      className="min-w-0 truncate font-black uppercase tracking-[0.12em]"
                      style={{
                        color: 'var(--papers-text-color)',
                        fontFamily: 'var(--mono-font)',
                        fontSize: 'clamp(1.15rem, 1.8vw, 1.45rem)',
                        lineHeight: 1,
                      }}
                    >
                      {brandingConfig.productName || siteName}
                    </span>
                  </Link>

                  {isMobile && (
                    <button
                      onClick={toggleSidebar}
                      className="rounded-full p-2 transition-opacity hover:opacity-70 md:hidden"
                      aria-label={ui.closeSidebar}
                      style={{ color: 'var(--papers-text-color)' }}
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
                    <span className="truncate">{ui.searchDocs}</span>
                  </span>
                  <kbd
                    className="hidden rounded-sm border px-1.5 py-0.5 text-xs md:inline-block"
                    style={{ borderColor: 'var(--border-unified)', color: 'var(--muted-color)' }}
                  >
                    {shortcutLabel}
                  </kbd>
                </button>

                <div className="mt-3 space-y-2">
                  <DocsVariantSelector docPath={path} collection={activeCollection} />
                  <LanguageSwitcher docPath={path} collection={activeCollection} />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pt-1 scrollbar-hide">
                <SidebarNav
                  items={navigationTree}
                  onSelect={handleSelectFile}
                  onPrefetch={(targetPath) =>
                    prefetchDocument(
                      targetPath,
                      {
                        version: routeContext.activeVersion,
                        locale: routeContext.activeLocale,
                      },
                      activeCollection.id
                    )
                  }
                  currentPath={path}
                  defaultOpenAll={true}
                />
              </div>

              <div
                className="border-t pt-4 space-y-2"
                style={{ borderColor: 'var(--border-unified)' }}
              >
                <button
                  onClick={() =>
                    navigate(
                      buildCanonicalCollectionPath(activeCollection, 'llms', {
                        version: routeContext.activeVersion,
                        locale: routeContext.activeLocale,
                      })
                    )
                  }
                  className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-opacity hover:opacity-80"
                  style={utilityButtonStyle}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <Icon icon="mingcute:file-info-line" className="h-4 w-4" />
                    <span>LLMs.txt</span>
                  </span>
                  <Icon icon="mingcute:arrow-right-line" className="h-4 w-4" />
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
                      style={{ color: 'var(--papers-text-color)', fontFamily: 'var(--mono-font)' }}
                    >
                      Theme and motion
                    </p>
                  </div>
                  <SettingsMenu placement="top" />
                </div>
              </div>
            </MotionAside>
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
                aria-label={ui.showDocumentationTree}
                style={floatingButtonStyle}
                type="button"
              >
                <Icon icon="mingcute:menu-line" className="h-5 w-5" />
              </button>
            ) : (
              <MotionButton
                onClick={toggleSidebar}
                className={`fixed z-30 rounded-lg p-3 shadow-lg ${getMobileTogglePositionClasses(uiConfig.mobileTogglePosition)}`}
                aria-label={ui.showDocumentationTree}
                style={floatingButtonStyle}
                type="button"
                {...buttonAnimationConfig}
              >
                <Icon icon="mingcute:menu-line" className="h-5 w-5" />
              </MotionButton>
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

              {contentSlot ?? (
                <ContentRenderer
                  content={content}
                  path={path}
                  trailingContent={trailingContent}
                  sourcePath={sourcePath}
                  contentFormat={contentFormat}
                  collection={activeCollection}
                />
              )}
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
            <div className="right-rail-header mb-3 flex shrink-0 items-center justify-between gap-3 pt-5">
              <h3
                className="min-w-0 truncate text-sm font-semibold font-mono"
                style={{
                  color: rightSidebarVisible
                    ? 'var(--mindmap-text-color)'
                    : 'var(--toc-text-color)',
                  fontFamily: 'var(--mono-font)',
                }}
              >
                {rightSidebarVisible ? ui.interactiveMap : ui.onThisPage}
              </h3>
              <button
                onClick={toggleRightSidebar}
                className="right-rail-toggle"
                aria-label={rightSidebarVisible ? ui.showTableOfContents : ui.showInteractiveMap}
                type="button"
              >
                <Icon
                  icon={rightSidebarVisible ? 'mingcute:sitemap-fill' : 'mingcute:brain-fill'}
                  className="h-4 w-4"
                />
              </button>
            </div>

            <div className="relative min-h-0 flex-1">
              <AnimatePresence initial={false}>
                {rightSidebarVisible ? (
                  <MotionDiv
                    key="interactive-map"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={rightRailPanelVariants}
                    transition={rightRailPanelTransition}
                    className="absolute inset-0 flex h-full flex-col will-change-[opacity]"
                  >
                    <div className="min-h-0 flex-1">
                      <React.Suspense
                        fallback={
                          <div className="flex h-full items-center justify-center text-sm text-muted">
                            Loading interactive map…
                          </div>
                        }
                      >
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
                      </React.Suspense>
                    </div>
                  </MotionDiv>
                ) : (
                  <MotionDiv
                    key="table-of-contents"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={rightRailPanelVariants}
                    transition={rightRailPanelTransition}
                    className="absolute inset-0 flex h-full flex-col will-change-[opacity]"
                  >
                    <div className="min-h-0 flex-1">
                      <TableOfContents content={content} />
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>
            </div>

            <div className="shrink-0 pt-3">
              <SiteAttribution className="pb-3" density="compact" />
            </div>
          </div>
        </div>
      </main>
    );
  }
);

DocumentationPage.displayName = 'DocumentationPage';

export default DocumentationPage;
