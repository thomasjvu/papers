import type { ReactElement } from 'react';

type DocsLogoMarkProps = {
  size?: 'sm' | 'lg';
};

export default function DocsLogoMark({ size = 'sm' }: DocsLogoMarkProps): ReactElement {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center font-semibold tracking-tight text-foreground ${
        size === 'lg' ? 'text-lg' : 'text-sm'
      }`}
    >
      Papers
    </span>
  );
}