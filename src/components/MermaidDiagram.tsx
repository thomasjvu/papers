import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { createLogger } from '../utils/logger';

const logger = createLogger('MermaidDiagram');

type MermaidDiagramProps = {
  chart: string;
};

function updateMermaidOverflow(viewport: HTMLDivElement | null) {
  if (!viewport) {
    return;
  }

  const canvas = viewport.querySelector('.mermaid-block__canvas');
  if (!canvas) {
    viewport.dataset.overflows = 'false';
    return;
  }

  const overflows = canvas.scrollWidth > viewport.clientWidth + 1;
  viewport.dataset.overflows = overflows ? 'true' : 'false';
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useId().replace(/:/g, '-');
  const viewportRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      try {
        setError(null);

        const mermaid = (await import('mermaid')).default;
        const styles = getComputedStyle(document.documentElement);

        const readThemeColor = (name: string, fallback: string) => {
          const value = styles.getPropertyValue(name).trim();
          return value || fallback;
        };

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            curve: 'basis',
            padding: 12,
            nodeSpacing: 36,
            rankSpacing: 44,
          },
          sequence: {
            useMaxWidth: false,
            diagramMarginX: 20,
            diagramMarginY: 12,
            actorMargin: 36,
            messageMargin: 32,
          },
          themeVariables: {
            background: readThemeColor('--background-color', '#0f380f'),
            primaryColor: readThemeColor('--card-color', '#1a4d1a'),
            primaryTextColor: readThemeColor('--text-color', '#9bbc0f'),
            primaryBorderColor: readThemeColor('--border-unified', '#8bac0f'),
            lineColor: readThemeColor('--muted-color', '#8bac0f'),
            secondaryColor: readThemeColor('--surface-muted', '#306230'),
            tertiaryColor: readThemeColor('--surface-color', '#1a4d1a'),
            fontFamily: readThemeColor('--mono-font', 'IBM Plex Mono, monospace'),
          },
        });

        const { svg: renderedSvg } = await mermaid.render(`mermaid-${id}`, chart);

        if (!cancelled) {
          setSvg(renderedSvg);
        }
      } catch (renderError) {
        logger.error('Failed to render Mermaid diagram:', renderError);

        if (!cancelled) {
          setError(renderError instanceof Error ? renderError.message : 'Mermaid render failed.');
          setSvg('');
        }
      }
    }

    void renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  useLayoutEffect(() => {
    updateMermaidOverflow(viewportRef.current);

    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      updateMermaidOverflow(viewport);
    });

    observer.observe(viewport);
    return () => {
      observer.disconnect();
    };
  }, [svg]);

  if (error) {
    return (
      <div className="mermaid-block mermaid-block--error">
        <strong>Diagram failed to render.</strong>
        <p>{error}</p>
      </div>
    );
  }

  if (!svg) {
    return <div className="mermaid-block mermaid-block--loading">Rendering diagram...</div>;
  }

  return (
    <div className="mermaid-block">
      <div
        ref={viewportRef}
        className="mermaid-block__viewport"
        data-overflows="false"
        tabIndex={0}
        aria-label="Architecture diagram. Scroll horizontally if needed."
      >
        <div className="mermaid-block__canvas" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
      <p className="mermaid-block__hint" aria-hidden="true">
        Scroll to explore diagram
      </p>
    </div>
  );
}
