import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { buildCanonicalCollectionPath } from '../../shared/docsRouting.js';
import type { ContentCollection } from '../../shared/docsRouting.js';
import { getContentCollection } from '../data/collections';
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
  collection?: ContentCollection;
};

export function useAdjacentPageNavigation({
  path,
  version,
  locale,
  enabled = true,
  collection,
}: UseAdjacentPageNavigationOptions) {
  const navigate = useNavigate();
  const { isOpen: isCommandPaletteOpen } = useCommandPalette();
  const activeCollection = collection || getContentCollection('docs');

  const navigationTree = activeCollection.tree;
  const { prev, next } = useMemo(
    () => findAdjacentPages(path, navigationTree),
    [navigationTree, path]
  );

  const goToPage = useCallback(
    (page?: AdjacentPage) => {
      if (!page) {
        return;
      }

      navigate(
        buildCanonicalCollectionPath(activeCollection, page.path, {
          version,
          locale,
        })
      );
    },
    [activeCollection, locale, navigate, version]
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
