import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import CommandPalette from '../components/CommandPalette/OptimizedCommandPalette';

interface CommandPaletteContextType {
  isOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
}

interface CommandPaletteProviderProps {
  children: React.ReactNode;
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openCommandPalette = useCallback(() => setIsOpen(true), []);
  const closeCommandPalette = useCallback(() => setIsOpen(false), []);
  const toggleCommandPalette = useCallback(() => setIsOpen((prev) => !prev), []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      // Also support Cmd+/ or Ctrl+/
      else if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen,
        openCommandPalette,
        closeCommandPalette,
        toggleCommandPalette,
      }}
    >
      {children}
      <CommandPalette isOpen={isOpen} onClose={closeCommandPalette} />
    </CommandPaletteContext.Provider>
  );
}
