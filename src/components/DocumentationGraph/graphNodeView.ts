/** Pure view-model helpers for GraphNode, kept free of React so unit tests cover them. */

export type GraphNodeGeometry = { x: number; y: number; radius: number; isSidebarView: boolean };

export function truncateGraphNodeTitle(title: string, isSidebarView: boolean): string {
  const maxLength = isSidebarView ? 6 : 12;
  return title.length > maxLength ? `${title.slice(0, maxLength)}...` : title;
}

export function getGraphNodeFlags(
  nodeId: string,
  {
    currentPath,
    focusedNodeId,
    pendingSwitchNodeId,
  }: {
    currentPath?: string;
    focusedNodeId?: string;
    pendingSwitchNodeId?: string;
  }
) {
  const activeNodeId = focusedNodeId || currentPath;
  return {
    isActive: nodeId === activeNodeId,
    showSwitch: nodeId === pendingSwitchNodeId && nodeId !== currentPath,
  };
}

export function getGraphNodeMotion(prefersReducedMotion: boolean, index: number) {
  const hidden = prefersReducedMotion ? 1 : 0;
  return {
    initial: { scale: hidden, opacity: hidden },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: hidden, opacity: hidden },
    transition: {
      duration: prefersReducedMotion ? 0.01 : 0.5,
      delay: prefersReducedMotion ? 0 : index * 0.05,
    },
    whileHover: prefersReducedMotion ? {} : { scale: 1.1, transition: { duration: 0.2 } },
    whileTap: prefersReducedMotion ? {} : { scale: 0.95 },
  };
}

export function getGraphSwitchMotion(prefersReducedMotion: boolean) {
  return {
    transition: {
      duration: prefersReducedMotion ? 0.01 : 0.3,
      delay: prefersReducedMotion ? 0 : 0.4,
    },
    whileHover: prefersReducedMotion ? {} : { scale: 1.05 },
    whileTap: prefersReducedMotion ? {} : { scale: 0.95 },
  };
}

export function getGraphNodeLayout({ x, y, radius, isSidebarView }: GraphNodeGeometry) {
  return {
    labelY: y + radius + (isSidebarView ? 8 : 12),
    labelFontSize: isSidebarView ? '0.75rem' : 'var(--papers-text-2xs)',
    switchRect: {
      x: x - (isSidebarView ? 18 : 24),
      y: y - radius - (isSidebarView ? 20 : 28),
      width: isSidebarView ? 36 : 48,
      height: isSidebarView ? 14 : 18,
      rx: isSidebarView ? 7 : 9,
    },
    switchLabelY: y - radius - (isSidebarView ? 14 : 19),
    switchLabelFontSize: isSidebarView ? 'var(--papers-text-2xs)' : 'var(--papers-text-xs)',
  };
}
