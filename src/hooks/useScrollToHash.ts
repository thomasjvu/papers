import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Frames to wait for async content (code blocks, MDX) to mount the target. */
const MAX_FRAMES = 90;

function decodeHashId(hash: string): string | null {
  if (!hash || hash.length < 2) return null;
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }
}

/**
 * Scroll the heading named by `location.hash` into view once the page content
 * has rendered. Search results and shared links use `/docs/page#section`.
 */
export function useScrollToHash(contentKey: string): void {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    const id = decodeHashId(hash);
    if (!id || typeof window === 'undefined') return;

    let frame = 0;
    let handle = 0;
    const tick = () => {
      const target = document.getElementById(id);
      if (target) {
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        return;
      }
      frame += 1;
      if (frame < MAX_FRAMES) handle = window.requestAnimationFrame(tick);
    };
    handle = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(handle);
  }, [hash, pathname, contentKey]);
}
