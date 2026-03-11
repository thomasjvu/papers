import DOMPurify from 'dompurify';
import { useEffect, useRef, useState } from 'react';

import { processWalletAddresses } from '../utils/contentProcessor';

import CodeBlock from './CodeBlock';

interface LiveExampleProps {
  code: string;
  language: string;
  showCode?: boolean;
}

const ALLOWED_TAGS = [
  'div',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'a',
  'strong',
  'em',
  'u',
  'del',
  'mark',
  'br',
  'hr',
  'button',
  'input',
  'label',
  'form',
  'select',
  'option',
  'textarea',
  'img',
  'code',
  'pre',
  'blockquote',
];

const ALLOWED_ATTR = [
  'class',
  'id',
  'href',
  'src',
  'alt',
  'title',
  'type',
  'name',
  'value',
  'placeholder',
  'disabled',
  'readonly',
  'checked',
  'selected',
  'data-address',
  'data-processed',
  'data-copy-processed',
  'data-chain',
  'width',
  'height',
  'target',
  'rel',
];

const PREVIEW_BASE_STYLES = `
  :host {
    color: var(--text-color);
    font-family: var(--body-font);
  }

  .preview-root {
    color: var(--text-color);
    font-family: var(--body-font);
    line-height: 1.5;
  }

  .preview-root * {
    box-sizing: border-box;
  }

  .preview-root > * + * {
    margin-top: 0.75rem;
  }

  .preview-root a {
    color: var(--primary-color);
  }

  .preview-root button,
  .preview-root input,
  .preview-root select,
  .preview-root textarea {
    font: inherit;
  }

  .preview-root img {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .preview-root table {
    width: 100%;
    border-collapse: collapse;
  }

  .preview-root pre,
  .preview-root code {
    font-family: var(--mono-font);
  }

  .preview-root pre {
    overflow-x: auto;
  }
`;

function createExampleFromCSS(css: string): string {
  const classMatches = css.match(/\.([\w-]+)/g);
  if (!classMatches) {
    return '<div>No CSS classes found to demonstrate</div>';
  }

  const uniqueClasses = [...new Set(classMatches.map((className) => className.slice(1)))];

  return uniqueClasses
    .map((className) => {
      if (className.includes('notification')) {
        return `<div class="${className}"><strong>Example:</strong> This is a ${className.replace('-', ' ')}</div>`;
      }

      if (className.includes('wallet-address')) {
        return `<code class="${className} wallet-address" data-address="0x1234...5678">0x1234...5678</code>`;
      }

      if (className.includes('button') && !className.includes('copy-button')) {
        return `<button class="${className}" type="button">Example Button</button>`;
      }

      if (className.includes('font-')) {
        return `<div class="${className}">Example text with ${className}</div>`;
      }

      return `<div class="${className}">Example ${className.replace(/-/g, ' ')}</div>`;
    })
    .join('\n');
}

function sanitizePreviewMarkup(markup: string): string {
  return DOMPurify.sanitize(markup, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

const LiveExample: React.FC<LiveExampleProps> = ({ code, language, showCode = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCodeView, setShowCodeView] = useState(false);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) {
      return;
    }

    const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });

    try {
      setError(null);

      const styleElement = document.createElement('style');
      styleElement.textContent =
        language === 'css' ? `${PREVIEW_BASE_STYLES}\n${code}` : PREVIEW_BASE_STYLES;

      const previewRoot = document.createElement('div');
      previewRoot.className = 'preview-root';

      if (language === 'html') {
        previewRoot.innerHTML = sanitizePreviewMarkup(code);
      } else if (language === 'css') {
        previewRoot.innerHTML = sanitizePreviewMarkup(createExampleFromCSS(code));
      } else {
        previewRoot.textContent = 'Unsupported live example language.';
      }

      processWalletAddresses(previewRoot);
      shadowRoot.replaceChildren(styleElement, previewRoot);
    } catch (err) {
      shadowRoot.replaceChildren();
      setError(err instanceof Error ? err.message : 'Failed to render example');
    }

    return () => {
      shadowRoot.replaceChildren();
    };
  }, [code, language]);

  if (error) {
    return (
      <div className="ui-panel-danger p-4">
        <strong className="text-danger">Render Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="mb-6">
      {showCode && (
        <div className="mb-2 flex items-center justify-between">
          <span className="ui-label">Live Example</span>
          <button
            onClick={() => setShowCodeView(!showCodeView)}
            className="ui-label flex items-center gap-1 transition-opacity hover:opacity-80"
            style={{ color: 'var(--primary-color)' }}
            type="button"
          >
            {showCodeView ? 'Hide Code' : 'Show Code'}
          </button>
        </div>
      )}

      <div className="ui-panel mb-2 p-4">
        <div ref={containerRef} />
      </div>

      {showCode && showCodeView && (
        <div>
          <CodeBlock snippets={[{ language, code }]} showLineNumbers={false} className="mt-2" />
        </div>
      )}
    </div>
  );
};

export default LiveExample;
