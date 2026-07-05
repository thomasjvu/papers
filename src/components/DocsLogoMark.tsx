import type { ReactElement } from 'react';

type DocsLogoMarkProps = {
  size?: 'sm' | 'lg';
};

const LOGO_SRC = import.meta.env.VITE_DOCS_LOGO_URL || '/boss-raid-pfp.png';

export default function DocsLogoMark({ size = 'sm' }: DocsLogoMarkProps): ReactElement {
  return (
    <img
      alt={import.meta.env.VITE_SITE_NAME || 'Docs'}
      className={`logo-image shrink-0 ${size === 'lg' ? 'logo-image--lg' : ''}`}
      src={LOGO_SRC}
    />
  );
}
