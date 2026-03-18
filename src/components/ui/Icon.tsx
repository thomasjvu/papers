import { Icon as IconifyIcon } from '@iconify/react';
import React from 'react';

import { ICON_SIZES } from '../../constants/ui';
import { ensureIconCollections } from '../../lib/iconify';

ensureIconCollections();

export type IconSize = keyof typeof ICON_SIZES;

interface IconProps {
  /** Icon name from Iconify */
  name: string;
  /** Predefined size */
  size?: IconSize;
  /** Custom CSS classes */
  className?: string;
  /** Custom style object */
  style?: React.CSSProperties;
  /** Click handler */
  onClick?: () => void;
  /** Accessibility label */
  'aria-label'?: string;
}

export const Icon = React.memo(function Icon({
  name,
  size = 'md',
  className = '',
  style,
  onClick,
  'aria-label': ariaLabel,
}: IconProps) {
  const sizeClasses = ICON_SIZES[size];
  const combinedClassName = `${sizeClasses} ${className}`.trim();

  return (
    <IconifyIcon
      icon={name}
      className={combinedClassName}
      style={style}
      onClick={onClick}
      aria-label={ariaLabel}
    />
  );
});
