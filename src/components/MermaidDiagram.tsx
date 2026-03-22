import { useEffect, useId, useState } from 'react';

import { createLogger } from '../utils/logger';

const logger = createLogger('MermaidDiagram');

type MermaidDiagramProps = {
  chart: string;
};

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useId().replace(/:/g, '-');
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      try {
        setError(null);

        const mermaid = (await import('mermaid')).default;
        const darkMode = document.documentElement.classList.contains('dark');

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: {
            background: darkMode ? '#111111' : '#ffffff',
            primaryColor: darkMode ? '#18181b' : '#f4f4f5',
            primaryTextColor: darkMode ? '#fafafa' : '#111111',
            primaryBorderColor: darkMode ? '#3f3f46' : '#d4d4d8',
            lineColor: darkMode ? '#a1a1aa' : '#52525b',
            secondaryColor: darkMode ? '#18181b' : '#fafafa',
            tertiaryColor: darkMode ? '#111111' : '#ffffff',
            fontFamily: 'Mona Sans, sans-serif',
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

  return <div className="mermaid-block" dangerouslySetInnerHTML={{ __html: svg }} />;
}
