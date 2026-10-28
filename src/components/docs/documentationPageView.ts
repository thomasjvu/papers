/** Pure view-model helpers for DocumentationPage, kept free of React so unit tests cover them. */

export const MOBILE_BREAKPOINT_PX = 768;

export function isMobileViewport(innerWidth: number): boolean {
  return innerWidth < MOBILE_BREAKPOINT_PX;
}

export function getShortcutLabel(platform: string | undefined): string {
  return platform !== undefined && /mac/i.test(platform) ? 'Cmd + K' : 'Ctrl + K';
}

/** `guides/getting-started` -> `getting started`. */
export function getPendingPathLabel(pendingPath: string | undefined): string | undefined {
  return pendingPath?.split('/').pop()?.replace(/-/g, ' ');
}

export function getBrandInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function getSidebarMotionVariants(prefersReducedMotion: boolean) {
  const slide = prefersReducedMotion ? {} : { x: -96 };
  const rest = prefersReducedMotion ? {} : { x: 0 };
  const mobile = (opacity: number, offset: object) => ({
    opacity,
    ...offset,
    position: 'fixed' as const,
  });
  const desktop = { opacity: 1, ...rest, position: 'relative' as const };

  return {
    mobile: { initial: mobile(0, slide), animate: mobile(1, rest), exit: mobile(0, slide) },
    desktop: { initial: { ...desktop }, animate: { ...desktop }, exit: { ...desktop } },
  };
}

export function getSidebarTransition(prefersReducedMotion: boolean) {
  return { duration: prefersReducedMotion ? 0.05 : 0.25 };
}

export function getFloatingButtonMotion(prefersReducedMotion: boolean) {
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
}

export const RIGHT_RAIL_PANEL_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export function getRightRailTransition(prefersReducedMotion: boolean) {
  return { duration: prefersReducedMotion ? 0.05 : 0.12, ease: 'easeOut' as const };
}

export function getRightRailView(
  showInteractiveMap: boolean,
  ui: {
    interactiveMap: string;
    onThisPage: string;
    showTableOfContents: string;
    showInteractiveMap: string;
  }
) {
  return showInteractiveMap
    ? {
        title: ui.interactiveMap,
        titleColor: 'var(--mindmap-text-color)',
        toggleLabel: ui.showTableOfContents,
        toggleIcon: 'mingcute:sitemap-fill',
      }
    : {
        title: ui.onThisPage,
        titleColor: 'var(--toc-text-color)',
        toggleLabel: ui.showInteractiveMap,
        toggleIcon: 'mingcute:brain-fill',
      };
}
