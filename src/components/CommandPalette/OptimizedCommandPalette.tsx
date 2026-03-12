import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { TIMING_CONSTANTS } from '../../constants/ui';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import { useTheme } from '../../providers/ThemeProvider';

import SearchResult, { type SearchResultType } from './SearchResult';
import { useSearchLogic } from './useSearchLogic';

interface OptimizedCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OptimizedCommandPalette({ isOpen, onClose }: OptimizedCommandPaletteProps) {
  const navigate = useNavigate();
  const { prefersReducedMotion } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { filteredResults } = useSearchLogic(query);

  const activeFaq = useMemo(() => {
    const result = filteredResults[selectedIndex];
    return result?.type === 'faq' ? result : null;
  }, [filteredResults, selectedIndex]);

  const handleInputChange = useDebouncedCallback((value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  }, 100);

  const handleSelect = useCallback(
    (result: SearchResultType, index: number) => {
      if (result.type === 'faq') {
        setSelectedIndex(index);
        return;
      }

      if (result.action) {
        result.action();
        onClose();
        return;
      }

      navigate(result.path);
      onClose();
    },
    [navigate, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), TIMING_CONSTANTS.autoFocusDelay);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
    if (resultsRef.current) {
      resultsRef.current.scrollTop = 0;
    }
  }, [filteredResults.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const commandPaletteElement = document.querySelector('[data-command-palette]');
      if (!commandPaletteElement || !commandPaletteElement.contains(document.activeElement)) {
        return;
      }

      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        switch (event.key) {
          case 'ArrowDown':
            setSelectedIndex((prev) => {
              const next = prev + 1;
              return next >= filteredResults.length ? 0 : next;
            });
            break;
          case 'ArrowUp':
            setSelectedIndex((prev) => {
              const next = prev - 1;
              return next < 0 ? filteredResults.length - 1 : next;
            });
            break;
          case 'Enter':
            if (filteredResults[selectedIndex]) {
              handleSelect(filteredResults[selectedIndex], selectedIndex);
            }
            break;
          case 'Escape':
            onClose();
            break;
        }
        return;
      }

      const key = event.key.toUpperCase();
      const shortcut = event.shiftKey ? `Shift+${key}` : key;
      const shortcutIndex = filteredResults.findIndex((result) => result.shortcut === shortcut);
      const resultWithShortcut = shortcutIndex >= 0 ? filteredResults[shortcutIndex] : null;
      if (resultWithShortcut && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        event.stopPropagation();
        handleSelect(resultWithShortcut, shortcutIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, selectedIndex, filteredResults, onClose, handleSelect]);

  useEffect(() => {
    if (!resultsRef.current || selectedIndex < 0) return;
    const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex, prefersReducedMotion]);

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

  return (
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
            className="fixed inset-0 flex items-start justify-center pt-[20vh] z-50 pointer-events-none"
          >
            <div className="w-full max-w-2xl px-4 pointer-events-auto">
              <div
                data-command-palette
                className="rounded-lg shadow-2xl overflow-hidden"
                style={{
                  backgroundColor: 'var(--card-color)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      defaultValue={query}
                      onChange={(event) => handleInputChange(event.target.value)}
                      placeholder="Search documentation or type a command..."
                      className="w-full px-3 py-2 rounded-md outline-none text-base"
                      style={{
                        color: 'var(--text-color)',
                        fontFamily: 'var(--mono-font)',
                        backgroundColor: 'transparent',
                        border: '1px solid transparent',
                      }}
                    />
                  </div>
                </div>

                <div
                  ref={resultsRef}
                  className="max-h-96 overflow-y-auto command-palette-scroll"
                  tabIndex={-1}
                  style={{ outline: 'none' }}
                >
                  {filteredResults.length > 0 ? (
                    filteredResults.map((result, index) => (
                      <SearchResult
                        key={result.path}
                        result={result}
                        index={index}
                        isSelected={index === selectedIndex}
                        onSelect={handleSelect}
                        onMouseEnter={setSelectedIndex}
                      />
                    ))
                  ) : (
                    <div className="p-8 text-center" style={{ color: 'var(--muted-color)' }}>
                      No results found for &ldquo;{query}&rdquo;
                    </div>
                  )}
                </div>

                {activeFaq?.answer && (
                  <div
                    className="px-4 py-4 border-t"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--hover-color)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: 'var(--primary-color)',
                          color: 'var(--selection-text-color)',
                        }}
                      >
                        <Icon icon="mingcute:question-line" className="w-4 h-4" />
                      </div>
                      <div>
                        <div
                          className="text-xs uppercase tracking-[0.2em] mb-1"
                          style={{ color: 'var(--muted-color)', fontFamily: 'var(--mono-font)' }}
                        >
                          FAQ Preview
                        </div>
                        <div
                          className="text-sm font-semibold"
                          style={{ color: 'var(--text-color)' }}
                        >
                          {activeFaq.title}
                        </div>
                        <p
                          className="mt-2 text-sm leading-6"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {activeFaq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className="px-4 py-2 border-t flex items-center justify-between"
                  style={{
                    fontSize: '10px',
                    borderColor: 'var(--border-color)',
                    color: 'var(--muted-color)',
                  }}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <span>
                      <kbd
                        className="px-1.5 py-0.5 rounded border"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        up
                      </kbd>
                      <kbd
                        className="px-1.5 py-0.5 rounded border ml-1"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        down
                      </kbd>{' '}
                      <span style={{ fontFamily: 'var(--mono-font)' }}>to navigate</span>
                    </span>
                    <span>
                      <kbd
                        className="px-1.5 py-0.5 rounded border"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        enter
                      </kbd>{' '}
                      <span style={{ fontFamily: 'var(--mono-font)' }}>to open or preview</span>
                    </span>
                    <span>
                      <kbd
                        className="px-1.5 py-0.5 rounded border"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        esc
                      </kbd>{' '}
                      <span style={{ fontFamily: 'var(--mono-font)' }}>to close</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
