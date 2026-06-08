import { Icon } from '@iconify/react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { fitMermaidNodeLabels, waitForDiagramFonts } from '../utils/mermaidLayout';
import { createLogger } from '../utils/logger';

const logger = createLogger('MermaidDiagram');

type MermaidDiagramProps = {
  chart: string;
};

type RenderMode = 'inline' | 'lightbox';

function readThemeColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

async function renderMermaidChart(chart: string, renderId: string, mode: RenderMode): Promise<string> {
  await waitForDiagramFonts();

  const mermaid = (await import('mermaid')).default;
  const isInline = mode === 'inline';

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    flowchart: {
      useMaxWidth: isInline,
      htmlLabels: true,
      curve: 'basis',
      padding: isInline ? 20 : 28,
      nodeSpacing: isInline ? 44 : 56,
      rankSpacing: isInline ? 52 : 64,
      wrappingWidth: isInline ? 280 : 360,
    },
    sequence: {
      useMaxWidth: isInline,
      diagramMarginX: isInline ? 16 : 24,
      diagramMarginY: isInline ? 12 : 16,
      actorMargin: isInline ? 40 : 48,
      messageMargin: isInline ? 28 : 36,
      wrap: true,
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
      fontSize: isInline ? '11px' : '12px',
    },
  });

  const { svg } = await mermaid.render(renderId, chart);
  return svg;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useId().replace(/:/g, '-');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inlineCanvasRef = useRef<HTMLDivElement>(null);
  const lightboxCanvasRef = useRef<HTMLDivElement>(null);

  const [inlineSvg, setInlineSvg] = useState('');
  const [lightboxSvg, setLightboxSvg] = useState('');
  const [lightboxLoading, setLightboxLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderInline() {
      try {
        setError(null);
        const renderedSvg = await renderMermaidChart(chart, `mermaid-inline-${id}`, 'inline');

        if (!cancelled) {
          setInlineSvg(renderedSvg);
        }
      } catch (renderError) {
        logger.error('Failed to render inline Mermaid diagram:', renderError);

        if (!cancelled) {
          setError(renderError instanceof Error ? renderError.message : 'Mermaid render failed.');
          setInlineSvg('');
        }
      }
    }

    void renderInline();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  useEffect(() => {
    if (!isOpen || lightboxSvg) {
      return undefined;
    }

    let cancelled = false;
    setLightboxLoading(true);

    async function renderLightbox() {
      try {
        const renderedSvg = await renderMermaidChart(chart, `mermaid-lightbox-${id}`, 'lightbox');

        if (!cancelled) {
          setLightboxSvg(renderedSvg);
        }
      } catch (renderError) {
        logger.error('Failed to render lightbox Mermaid diagram:', renderError);

        if (!cancelled) {
          setError(renderError instanceof Error ? renderError.message : 'Mermaid render failed.');
        }
      } finally {
        if (!cancelled) {
          setLightboxLoading(false);
        }
      }
    }

    void renderLightbox();

    return () => {
      cancelled = true;
    };
  }, [chart, id, isOpen, lightboxSvg]);

  const closeLightbox = useCallback(() => {
    dialogRef.current?.close();
    setIsOpen(false);
  }, []);

  const openLightbox = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    setIsOpen(true);

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeLightbox();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeLightbox, isOpen]);

  useEffect(() => {
    setLightboxSvg('');
    setLightboxLoading(false);
    setIsOpen(false);
  }, [chart]);

  useLayoutEffect(() => {
    fitMermaidNodeLabels(inlineCanvasRef.current);
  }, [inlineSvg]);

  useLayoutEffect(() => {
    if (!lightboxSvg) {
      return;
    }

    fitMermaidNodeLabels(lightboxCanvasRef.current);
  }, [lightboxSvg]);

  if (error && !inlineSvg) {
    return (
      <div className="mermaid-block mermaid-block--error">
        <strong>Diagram failed to render.</strong>
        <p>{error}</p>
      </div>
    );
  }

  if (!inlineSvg) {
    return <div className="mermaid-block mermaid-block--loading">Rendering diagram...</div>;
  }

  return (
    <>
      <div className="mermaid-block">
        <button
          type="button"
          className="mermaid-block__trigger"
          onClick={openLightbox}
          aria-label="Expand diagram"
        >
          <div
            ref={inlineCanvasRef}
            className="mermaid-block__content"
            dangerouslySetInnerHTML={{ __html: inlineSvg }}
          />
        </button>
        <p className="mermaid-block__expand-hint" aria-hidden="true">
          Click to expand
        </p>
      </div>

      <dialog
        ref={dialogRef}
        className="mermaid-lightbox"
        onCancel={(event) => {
          event.preventDefault();
          closeLightbox();
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            closeLightbox();
          }
        }}
      >
        <div className="mermaid-lightbox__panel">
          <button
            type="button"
            className="mermaid-lightbox__close"
            onClick={closeLightbox}
            aria-label="Close diagram"
          >
            <Icon icon="mingcute:close-line" className="h-5 w-5" />
          </button>

          <div className="mermaid-lightbox__body">
            {lightboxLoading && !lightboxSvg ? (
              <p className="mermaid-lightbox__loading">Rendering diagram...</p>
            ) : null}
            {lightboxSvg ? (
              <div
                ref={lightboxCanvasRef}
                className="mermaid-lightbox__content"
                dangerouslySetInnerHTML={{ __html: lightboxSvg }}
              />
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}