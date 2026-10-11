import { Icon } from '@iconify/react';

import { brandingConfig, getCopyrightLine } from '../../lib/chrome';

type SiteAttributionProps = {
  className?: string;
  density?: 'compact' | 'full';
};

/**
 * Configurable footer chrome — social icons, copyright, optional attribution.
 * Instances set brandingConfig; leave attribution null to hide a credit line.
 */
export default function SiteAttribution({
  className = '',
  density = 'compact',
}: SiteAttributionProps) {
  const social = brandingConfig.social ?? [];
  const attribution = brandingConfig.attribution;
  const copyright = getCopyrightLine();

  return (
    <div className={`shrink-0 ${className}`.trim()}>
      {social.length > 0 && (
        <div
          className={`mb-2 flex items-center gap-2.5 ${
            density === 'compact' ? 'justify-center' : 'justify-start'
          }`}
        >
          {social.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.name}
              className="social-link transition-opacity hover:opacity-80"
              style={{ color: 'var(--toc-text-color)' }}
              title={link.name}
            >
              <Icon icon={link.icon} className="h-5 w-5" />
            </a>
          ))}
        </div>
      )}

      <div className={density === 'compact' ? 'text-center' : 'text-left'}>
        <p
          className="text-2xs font-mono leading-snug"
          style={{
            color: 'var(--toc-text-color)',
            fontFamily: 'var(--mono-font)',
          }}
        >
          {copyright}
        </p>
        {attribution ? (
          <p
            className="mt-1 text-2xs font-mono leading-none"
            style={{
              color: 'var(--toc-text-color)',
              fontFamily: 'var(--mono-font)',
            }}
          >
            {attribution.href ? (
              <a
                href={attribution.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
                style={{ color: 'var(--papers-text-color)' }}
              >
                {attribution.text}
              </a>
            ) : (
              attribution.text
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}
