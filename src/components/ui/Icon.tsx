import { Icon as IconifyIcon, addCollection, IconifyJSON } from '@iconify/react';
// Import icon collections at build time
import mingcuteIcons from '@iconify-json/mingcute/icons.json' with { type: 'json' };
import tokenBrandedIcons from '@iconify-json/token-branded/icons.json' with { type: 'json' };
import React from 'react';

import { ICON_SIZES } from '../../constants/ui';

// Add collections to ensure icons are bundled
if (typeof window !== 'undefined') {
  addCollection(mingcuteIcons as IconifyJSON);
  addCollection(tokenBrandedIcons as IconifyJSON);
}

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
