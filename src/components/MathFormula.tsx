import { useEffect, useState } from 'react';

import { createLogger } from '../utils/logger';
import { loadKatex, renderTexToHtml } from '../utils/renderMath';

const logger = createLogger('MathFormula');

type MathFormulaProps = {
  tex: string;
  displayMode: boolean;
};

/**
 * Renders TeX with KaTeX. Until KaTeX loads (or if it fails) the readable TeX source is
 * shown, so content is never lost.
 */
export default function MathFormula({ tex, displayMode }: MathFormulaProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadKatex()
      .then((katex) => {
        if (!cancelled) {
          setHtml(renderTexToHtml(katex, tex, displayMode));
        }
      })
      .catch((error) => {
        logger.error('Failed to load KaTeX:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [tex, displayMode]);

  if (displayMode) {
    return (
      <div className="formula math-display" data-math-rendered={html ? 'true' : 'false'}>
        {html ? (
          <div className="formula__body" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="formula__body formula__body--source">{tex}</div>
        )}
      </div>
    );
  }

  return html ? (
    <span
      className="math-inline"
      data-math-rendered="true"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <span className="math-inline math-inline--source" data-math-rendered="false">
      {tex}
    </span>
  );
}
