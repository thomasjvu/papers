import type { ReactElement } from 'react';

import { brandingConfig } from '@app-shared/documentation-config.js';

type DocsLogoMarkProps = {
  size?: 'sm' | 'lg';
};

export default function DocsLogoMark({ size = 'sm' }: DocsLogoMarkProps): ReactElement {
  const logoSrc = import.meta.env.VITE_DOCS_LOGO_URL || brandingConfig.logo?.src;
  const logoAlt = brandingConfig.logo?.alt || brandingConfig.productName || 'Documentation';
  const mark = brandingConfig.productName.trim().charAt(0).toUpperCase() || 'D';

  if (!logoSrc) {
    return (
      <span
        aria-label={brandingConfig.productName || 'Documentation'}
        className={`logo-fallback shrink-0 ${size === 'lg' ? 'logo-fallback--lg' : ''}`}
        role="img"
      >
        {mark}
      </span>
    );
  }

  return (
    <img
      alt={logoAlt}
      className={`logo-image shrink-0 ${size === 'lg' ? 'logo-image--lg' : ''}`}
      src={logoSrc}
    />
  );
}
