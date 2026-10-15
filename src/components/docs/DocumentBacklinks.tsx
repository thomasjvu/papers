import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';

import type { DocumentBacklink } from '../../lib/content';
import { useUiStrings } from '../../lib/uiStrings';

type DocumentBacklinksProps = {
  backlinks: DocumentBacklink[];
};

export default function DocumentBacklinks({ backlinks }: DocumentBacklinksProps) {
  const ui = useUiStrings();
  if (backlinks.length === 0) {
    return null;
  }

  return (
    <section
      className="mt-10 rounded-lg border p-4"
      aria-labelledby="document-backlinks-heading"
      style={{
        borderColor: 'var(--border-unified)',
        backgroundColor: 'var(--card-color)',
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon
          icon="mingcute:link-line"
          className="h-4 w-4"
          aria-hidden="true"
          style={{ color: 'var(--primary-color)' }}
        />
        <h2
          id="document-backlinks-heading"
          className="text-xs font-semibold uppercase tracking-[0.16em]"
          style={{ color: 'var(--muted-color)', fontFamily: 'var(--mono-font)' }}
        >
          {ui.referencedBy}
        </h2>
      </div>
      <ul className="space-y-2">
        {backlinks.map((backlink) => (
          <li key={`${backlink.source}:${backlink.line}:${backlink.anchor || ''}`}>
            <Link
              to={backlink.href}
              className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
              style={{ color: 'var(--papers-text-color)' }}
            >
              <span>{backlink.source}</span>
              <span
                className="text-2xs"
                style={{ color: 'var(--muted-color)', fontFamily: 'var(--mono-font)' }}
              >
                line {backlink.line}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
