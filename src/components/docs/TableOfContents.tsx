import { Icon } from '@iconify/react';
import React from 'react';

interface TableOfContentsProps {
  content: string;
  onToggleRightSidebar: () => void;
}

const TableOfContents = React.memo(({ content, onToggleRightSidebar }: TableOfContentsProps) => {
  const headings = React.useMemo(() => {
    const lines = content.split('\n');
    const headingRegex = /^(#{1,6})\s+(.+)$/;
    const extractedHeadings: Array<{ level: number; text: string; id: string }> = [];

    lines.forEach((line) => {
      const match = line.match(headingRegex);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        extractedHeadings.push({ level, text, id });
      }
    });

    return extractedHeadings;
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <div
      className="rounded-lg border p-4 max-h-96 overflow-hidden flex flex-col"
      style={{
        backgroundColor: 'var(--toc-bg-color)',
        borderColor: 'var(--toc-border-color)',
      }}
    >
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h4
          className="text-xs font-semibold uppercase tracking-wide"
          style={{
            fontFamily: 'var(--mono-font)',
            color: 'var(--toc-text-color)',
          }}
        >
          On This Page
        </h4>
        <button
          onClick={onToggleRightSidebar}
          className="flex items-center justify-center w-6 h-6 rounded-md transition-colors border"
          style={{
            backgroundColor: 'var(--toc-button-bg)',
            borderColor: 'var(--toc-border-color)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--toc-button-hover-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--toc-button-bg)';
          }}
          aria-label="Show documentation map"
        >
          <Icon
            icon="mingcute:brain-line"
            className="w-3.5 h-3.5"
            style={{
              color: 'var(--toc-text-color)',
            }}
          />
        </button>
      </div>
      <nav className="space-y-1 overflow-y-auto overflow-x-hidden toc-scroll">
        {headings.map((heading, index) => (
          <a
            key={index}
            href={`#${heading.id}`}
            className="block text-sm transition-colors py-1"
            style={{
              fontFamily: 'var(--mono-font)',
              paddingLeft: `${(heading.level - 1) * 12}px`,
              fontSize: heading.level === 1 ? '13px' : '12px',
              color: 'var(--toc-text-color)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--toc-text-hover-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--toc-text-color)';
            }}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
});

TableOfContents.displayName = 'TableOfContents';

export default TableOfContents;
