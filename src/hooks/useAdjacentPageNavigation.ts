import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { buildCanonicalDocsPath } from '../../shared/docsRouting.js';
import { documentationTree } from '../data/documentation';
import { findAdjacentPages } from '../lib/navigation';
import { useCommandPalette } from '../providers/CommandPaletteProvider';
import { KEYBOARD_KEYS } from '../constants/ui';
import { isEditableTarget } from '../utils/keyboard';

type AdjacentPage = { path: string; title: string };

type UseAdjacentPageNavigationOptions = {
  path: string;
  version: string | null;
  locale: string | null;
  enabled?: boolean;
};

export function useAdjacentPageNavigation({
  path,
  version,
  locale,
  enabled = true,
}: UseAdjacentPageNavigationOptions) {
  const navigate = useNavigate();
  const { isOpen: isCommandPaletteOpen } = useCommandPalette();

  const { prev, next } = useMemo(() => findAdjacentPages(path, documentationTree), [path]);

  const goToPage = useCallback(
    (page?: AdjacentPage) => {
      if (!page) {
        return;
      }

      navigate(
        buildCanonicalDocsPath(page.path, {
          version,
          locale,
        })
      );
    },
    [locale, navigate, version]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isCommandPaletteOpen || isEditableTarget(event.target)) {
        return;
      }

      if (event.key === KEYBOARD_KEYS.ARROW_LEFT) {
        if (!prev) {
          return;
        }
        event.preventDefault();
        goToPage(prev);
        return;
      }

      if (event.key === KEYBOARD_KEYS.ARROW_RIGHT) {
        if (!next) {
          return;
        }
        event.preventDefault();
        goToPage(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, goToPage, isCommandPaletteOpen, next, prev]);

  return { prev, next, goToPage };
}
