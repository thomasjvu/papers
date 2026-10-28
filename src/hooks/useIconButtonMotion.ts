import { useMemo } from 'react';

/** Text colour shared by the chrome's round icon buttons. */
export const ICON_BUTTON_STYLE = Object.freeze({ color: 'var(--papers-text-color)' });

/** Hover/tap scale for icon buttons; empty when the user prefers reduced motion. */
export function useIconButtonMotion(prefersReducedMotion: boolean) {
  return useMemo(() => {
    if (prefersReducedMotion) {
      return {};
    }

    return {
      whileHover: { scale: 1.1 },
      whileTap: { scale: 0.95 },
    };
  }, [prefersReducedMotion]);
}
