import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { useTheme } from '../../providers/ThemeProvider';

import OptimizedDocumentationGraph from './OptimizedDocumentationGraph';

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

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0, scale: 1 },
        visible: { opacity: 1, scale: 1 },
      }
    : {
        hidden: { opacity: 0, scale: 0.95, y: -20 },
        visible: { opacity: 1, scale: 1, y: 0 },
      };

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: 'var(--overlay-color)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          <motion.div
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
                    style={{ color: 'var(--text-color)', fontFamily: 'var(--mono-font)' }}
                  >
                    Interactive map
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="ui-control-ghost rounded-md p-2"
                  aria-label="Close expanded mindmap"
                  style={{ color: 'var(--text-color)' }}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
