export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
} as const;

export const ANIMATION_DURATION = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  feedback: 2000,
  autoFocusDelay: 100,
} as const;

export const ANIMATION_DURATION_SECONDS = {
  instant: 0,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  feedback: 2,
} as const;

export const TIMING_CONSTANTS = ANIMATION_DURATION;

export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  overlay: 20,
  modal: 30,
  notification: 40,
  tooltip: 50,
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const SPACING = {
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem',
} as const;

export const BORDER_RADIUS = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
} as const;

export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  TAB: 'Tab',
  SPACE: ' ',
} as const;

export const UI_CLASSES = {
  focusRing:
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-primary-500',
  transition: 'transition-all duration-200 ease-in-out',
  disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
  link: 'text-primary-600 dark:text-primary-400 hover:underline',
  button: 'px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
} as const;
