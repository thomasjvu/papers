import { Icon } from '@iconify/react';
import { createElement } from 'react';

import { brandingConfig } from '@app-shared/documentation-config.js';

/** Derived from brandingConfig for Navigation and legacy consumers. */
export const socialLinks = (brandingConfig.social ?? []).map((link) => ({
  name: link.name,
  href: link.href,
  icon: createElement(Icon, { icon: link.icon, width: 24, height: 24 }),
}));
