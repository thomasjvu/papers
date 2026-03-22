import { Icon } from '@iconify/react';
import React from 'react';

interface TableOfContentsProps {
  content: string;
  onToggleInteractiveMap?: () => void;
}

interface HeadingItem {
  level: number;
  text: string;
  id: string;
}

function createHeadingId(text: string, counts: Map<string, number>): string {
  const baseId =
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section';

  const currentCount = counts.get(baseId) ?? 0;
  counts.set(baseId, currentCount + 1);

  return currentCount === 0 ? baseId : `${baseId}-${currentCount + 1}`;
}

function buildHeadingsFromMarkdown(content: string): HeadingItem[] {
  const lines = content.split('\n');
  const headingRegex = /^(#{1,6})\s+(.+)$/;
  const counts = new Map<string, number>();
  const extractedHeadings: HeadingItem[] = [];

  for (const line of lines) {
    const match = line.match(headingRegex);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    const text = match[2].trim();
    const id = createHeadingId(text, counts);
    extractedHeadings.push({ level, text, id });
  }

  return extractedHeadings;
}

const TableOfContents = React.memo(({ content, onToggleInteractiveMap }: TableOfContentsProps) => {
  const headings = React.useMemo(() => buildHeadingsFromMarkdown(content), [content]);
  const [activeHeadingId, setActiveHeadingId] = React.useState<string | null>(
    headings[0]?.id ?? null
  );

  React.useEffect(() => {
    setActiveHeadingId(headings[0]?.id ?? null);
  }, [headings]);

  React.useEffect(() => {
    if (!headings.length || typeof window === 'undefined') {
      return undefined;
    }

    const scrollContainer = document.querySelector('.doc-content-scroll');
    if (!(scrollContainer instanceof HTMLElement)) {
      return undefined;
    }

    const resolveActiveHeading = () => {
      const rootRect = scrollContainer.getBoundingClientRect();
      const activationLine = rootRect.top + rootRect.height * 0.3;

      let nextActiveId = headings[0]?.id ?? null;

      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (!element) {
          continue;
        }

        const rect = element.getBoundingClientRect();
        if (rect.top <= activationLine) {
          nextActiveId = heading.id;
        } else {
          break;
        }
      }

      setActiveHeadingId((currentId) => (currentId === nextActiveId ? currentId : nextActiveId));
    };

    resolveActiveHeading();
    const immediateTimer = window.setTimeout(resolveActiveHeading, 0);
    const settledTimer = window.setTimeout(resolveActiveHeading, 200);

    scrollContainer.addEventListener('scroll', resolveActiveHeading, { passive: true });
    window.addEventListener('resize', resolveActiveHeading);

    return () => {
      window.clearTimeout(immediateTimer);
      window.clearTimeout(settledTimer);
      scrollContainer.removeEventListener('scroll', resolveActiveHeading);
      window.removeEventListener('resize', resolveActiveHeading);
    };
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <div
      className="flex w-full max-h-[calc(100vh-7rem)] flex-col self-start overflow-hidden rounded-lg border p-4"
      style={{
        backgroundColor: 'var(--toc-bg-color)',
        borderColor: 'var(--toc-border-color)',
      }}
    >
      <div className="mb-3 flex flex-shrink-0 items-center justify-between">
        <h4
          className="ui-caption"
          style={{
            color: 'var(--toc-text-color)',
          }}
        >
          On This Page
        </h4>
        {onToggleInteractiveMap ? (
          <button
            onClick={onToggleInteractiveMap}
            className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 transition-opacity hover:opacity-80"
            aria-label="Show interactive map"
            style={{
              backgroundColor: 'var(--card-color)',
              borderColor: 'var(--border-unified)',
              color: 'var(--text-color)',
              fontFamily: 'var(--mono-font)',
            }}
            type="button"
          >
            <Icon icon="mingcute:brain-line" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <nav
        className="toc-scroll overflow-x-hidden overflow-y-auto pr-1"
        style={{ maxHeight: 'calc(100vh - 11rem)' }}
      >
        {headings.map((heading) => {
          const isActive = heading.id === activeHeadingId;

          return (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className="block py-1 transition-all duration-200"
              style={{
                fontFamily: 'var(--mono-font)',
                paddingLeft: `${(heading.level - 1) * 12}px`,
                fontSize:
                  heading.level === 1
                    ? 'calc(var(--text-xs) + 1px)'
                    : 'calc(var(--text-2xs) + 1px)',
                color: isActive ? 'var(--toc-text-hover-color)' : 'var(--toc-text-color)',
                opacity: isActive ? 1 : 0.58,
                fontWeight: isActive ? 600 : 500,
              }}
              onClick={(event) => {
                event.preventDefault();
                const element = document.getElementById(heading.id);
                if (!element) {
                  return;
                }

                setActiveHeadingId(heading.id);
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.replaceState(null, '', `#${heading.id}`);
              }}
            >
              {heading.text}
            </a>
          );
        })}
      </nav>
    </div>
  );
});

TableOfContents.displayName = 'TableOfContents';

export default TableOfContents;
