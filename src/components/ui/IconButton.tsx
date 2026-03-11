import React from 'react';

import { Icon } from './Icon';
import type { IconSize } from './Icon';

interface IconButtonProps {
  /** Icon name from Iconify */
  icon: string;
  /** Button click handler */
  onClick: () => void;
  /** Accessibility label */
  'aria-label': string;
  /** Icon size */
  size?: IconSize;
  /** Button variant */
  variant?: 'ghost' | 'solid' | 'outline';
  /** Additional CSS classes */
  className?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
}

const variantClasses = {
  ghost: 'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-lg',
  solid:
    'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-lg',
  outline:
    'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg',
};

const sizeToButtonSize = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
  xl: 'p-3',
} as const;

export const IconButton = React.memo(function IconButton({
  icon,
  onClick,
  'aria-label': ariaLabel,
  size = 'md',
  variant = 'ghost',
  className = '',
  disabled = false,
  type = 'button',
}: IconButtonProps) {
  const buttonSizeClass = sizeToButtonSize[size];
  const variantClass = variantClasses[variant];
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const combinedClassName =
    `${buttonSizeClass} ${variantClass} ${disabledClass} ${className}`.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedClassName}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <Icon name={icon} size={size} />
    </button>
  );
});
