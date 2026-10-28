import type { ReactNode } from 'react';

interface SectionHeadingProps {
  title: ReactNode;
  subtitle: ReactNode;
  subtitleClassName?: string;
}

/** Centered homepage section title and lead paragraph. */
export function SectionHeading({ title, subtitle, subtitleClassName }: SectionHeadingProps) {
  return (
    <div className="text-center mb-16">
      <h2
        className="font-bold mb-4"
        style={{
          fontFamily: 'var(--title-font)',
          color: 'var(--papers-text-color)',
          fontSize: 'clamp(var(--papers-text-2xl), 4vw, var(--papers-text-4xl))',
          letterSpacing: '-0.03em',
        }}
      >
        {title}
      </h2>
      <p
        className={subtitleClassName}
        style={{
          color: 'var(--muted-color)',
          fontSize: 'var(--papers-text-lg)',
          lineHeight: 'var(--papers-leading-loose)',
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}
