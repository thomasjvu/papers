import { Icon } from '@iconify/react';
import { AnimatePresence } from 'framer-motion';
import { div as MotionDiv } from 'framer-motion/m';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { getModalVariants } from '../../animations/common';
import { useTheme } from '../../providers/useTheme';
import ModalBackdrop from '../ModalBackdrop';

import OptimizedDocumentationGraph from './OptimizedDocumentationGraph';
import { useUiStrings } from '../../lib/uiStrings';

type MindmapExpandModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
  onNodeClick?: (path: string) => void;
};

export default function MindmapExpandModal({
  isOpen,
  onClose,
  currentPath,
  onNodeClick,
}: MindmapExpandModalProps) {
  const ui = useUiStrings();
  const { prefersReducedMotion } = useTheme();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const modalVariants = getModalVariants(prefersReducedMotion);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <ModalBackdrop onClose={onClose} />

          <MotionDiv
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={modalVariants}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] pointer-events-none"
          >
            <div
              className="pointer-events-auto flex h-[min(72vh,44rem)] w-full max-w-5xl flex-col overflow-hidden rounded-lg shadow-2xl"
              style={{
                backgroundColor: 'var(--card-color)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                className="flex items-center justify-between border-b px-4 py-3"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--papers-text-color)', fontFamily: 'var(--mono-font)' }}
                  >
                    {ui.interactiveMap}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="ui-control-ghost rounded-md p-2"
                  aria-label={ui.mindmapClose}
                  style={{ color: 'var(--papers-text-color)' }}
                >
                  <Icon icon="mingcute:close-line" className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden p-4">
                <OptimizedDocumentationGraph
                  currentPath={currentPath}
                  onNodeClick={(path) => {
                    onNodeClick?.(path);
                    onClose();
                  }}
                  layoutMode="expanded"
                />
              </div>
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
