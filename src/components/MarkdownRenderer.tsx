import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { processMarkdown, type CodeBlockData } from '../utils/MarkdownProcessor';
import { createLogger } from '../utils/logger';
import { resolveDocumentPath } from '../lib/content';
import { buildCanonicalDocsPath, parseDocsRoutePath } from '../../shared/docsRouting.js';

import CodeBlock from './CodeBlock';
import ColorPalette from './ColorPalette';
import LiveExample from './LiveExample';

const componentLogger = createLogger('MarkdownRenderer');

type MarkdownRendererProps = {
  content: string;
  path: string;
};

interface ProcessedMarkdownData {
  html: string;
  codeBlocks: Map<string, CodeBlockData[]>;
}

interface RenderContext {
  codeBlocks: Map<string, CodeBlockData[]>;
  navigate: (href: string) => void;
}

const BOOLEAN_ATTRIBUTES = new Set(['checked', 'disabled', 'readonly', 'selected']);
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function detectChainFromAddress(address: string): string {
  if (/^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(address)) {
    return 'btc';
  }

  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return 'solana';
  }

  return 'eth';
}

function showCopyToast(message: string): void {
  if (typeof document === 'undefined' || toastTimeout) {
    return;
  }

  const toast = document.createElement('div');
  toast.innerText = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--primary-color);
    color: var(--background-color);
    padding: 8px 16px;
    border-radius: 9999px;
    border: 1px solid var(--border-unified);
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
    font-family: var(--mono-font);
    font-size: var(--text-xs);
    pointer-events: none;
  `;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';

    setTimeout(() => {
      toast.remove();
      toastTimeout = null;
    }, 300);
  }, 1500);
}

function getElementProps(element: Element, key: string): Record<string, unknown> {
  const props: Record<string, unknown> = { key };

  for (const attribute of Array.from(element.attributes)) {
    const { name, value } = attribute;

    if (name === 'class') {
      props.className = value;
      continue;
    }

    if (name === 'for') {
      props.htmlFor = value;
      continue;
    }

    if (name === 'tabindex') {
      props.tabIndex = Number(value);
      continue;
    }

    if (BOOLEAN_ATTRIBUTES.has(name)) {
      props[name === 'readonly' ? 'readOnly' : name] = value === '' || value === name;
      continue;
    }

    props[name] = value;
  }

  return props;
}

function renderNodes(
  nodes: NodeListOf<ChildNode> | ChildNode[],
  keyPrefix: string,
  context: RenderContext
) {
  return Array.from(nodes)
    .map((node, index) => renderNode(node, `${keyPrefix}-${index}`, context))
    .filter((node): node is React.ReactNode => node !== null);
}

function renderNode(node: ChildNode, key: string, context: RenderContext): React.ReactNode | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'div' && element.hasAttribute('data-codeblock-id')) {
    const blockId = element.getAttribute('data-codeblock-id');
    const snippets = blockId ? context.codeBlocks.get(blockId) : undefined;

    if (!snippets) {
      return null;
    }

    return <CodeBlock key={key} snippets={snippets} showLineNumbers={true} className="my-6" />;
  }

  if (tagName === 'div' && element.hasAttribute('data-colorpalette-id')) {
    const paletteData = element.getAttribute('data-palette');

    if (!paletteData) {
      return null;
    }

    try {
      const parsedData = JSON.parse(paletteData);
      return <ColorPalette key={key} colors={parsedData.colors} />;
    } catch (error) {
      componentLogger.error('Error parsing color palette data:', error);
      return (
        <div key={key} className="notification notification-error">
          Invalid ColorPalette JSON format
        </div>
      );
    }
  }

  if (tagName === 'div' && element.hasAttribute('data-liveexample-id')) {
    const language = element.getAttribute('data-language');
    const encodedCode = element.getAttribute('data-code');

    if (!language || !encodedCode) {
      return null;
    }

    try {
      return <LiveExample key={key} code={decodeURIComponent(encodedCode)} language={language} />;
    } catch (error) {
      componentLogger.error('Error processing live example:', error);
      return null;
    }
  }

  if (tagName === 'a') {
    const href = element.getAttribute('href') || '#';
    const dataFile = element.getAttribute('data-file');
    const dataUrl = element.getAttribute('data-url');
    const props = getElementProps(element, key);
    const children = renderNodes(element.childNodes, key, context);

    if (dataFile) {
      return (
        <a {...props} href={href} download={dataFile}>
          {children}
        </a>
      );
    }

    if (dataUrl) {
      return (
        <MarkdownCopyLink
          key={key}
          href={href}
          url={dataUrl}
          className={element.getAttribute('class') || ''}
        >
          {children}
        </MarkdownCopyLink>
      );
    }

    if (href.startsWith('/docs/') || href === '/llms' || href === '/') {
      return (
        <MarkdownRouteLink
          key={key}
          href={href}
          className={element.getAttribute('class') || ''}
          title={element.getAttribute('title') || undefined}
          onNavigate={context.navigate}
        >
          {children}
        </MarkdownRouteLink>
      );
    }

    return React.createElement('a', props, ...children);
  }

  if (tagName === 'code' && element.classList.contains('wallet-address')) {
    return (
      <MarkdownWalletAddress
        key={key}
        address={element.getAttribute('data-address') || element.textContent || ''}
        chain={element.getAttribute('data-chain') || undefined}
        className={element.getAttribute('class') || ''}
      >
        {element.textContent || ''}
      </MarkdownWalletAddress>
    );
  }

  const props = getElementProps(element, key);
  const children = renderNodes(element.childNodes, key, context);

  return React.createElement(tagName, props, ...children);
}

function parseHtmlToReactNodes(processedData: ProcessedMarkdownData, context: RenderContext) {
  if (typeof DOMParser === 'undefined') {
    return [processedData.html];
  }

  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(
    `<body>${processedData.html}</body>`,
    'text/html'
  );
  return renderNodes(documentFragment.body.childNodes, 'markdown', context);
}

function MarkdownRouteLink({
  href,
  className,
  title,
  children,
  onNavigate,
}: {
  href: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
  onNavigate: (href: string) => void;
}) {
  return (
    <a
      href={href}
      className={className}
      title={title}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(href);
      }}
    >
      {children}
    </a>
  );
}

function MarkdownCopyLink({
  href,
  url,
  className,
  children,
}: {
  href: string;
  url: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <a
      href={href}
      className={className}
      onClick={async (event) => {
        event.preventDefault();

        try {
          await navigator.clipboard.writeText(window.location.origin + url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (error) {
          componentLogger.error('Failed to copy link:', error);
        }
      }}
    >
      {copied ? 'Copied!' : children}
    </a>
  );
}

function MarkdownWalletAddress({
  address,
  chain,
  className,
  children,
}: {
  address: string;
  chain?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const resolvedChain = chain || detectChainFromAddress(address);

  return (
    <code className={className} data-address={address} data-chain={resolvedChain}>
      <span className="chain-icon-container">
        <Icon
          icon={`token:${resolvedChain}`}
          width="18"
          height="18"
          className="chain-icon"
          aria-hidden="true"
        />
      </span>
      <span className="wallet-address-text">{children}</span>
      <button
        className="copy-button"
        type="button"
        aria-label="Copy to clipboard"
        title="Copy to clipboard"
        onClick={async (event) => {
          event.stopPropagation();

          try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            showCopyToast('Copied to clipboard!');
            setTimeout(() => setCopied(false), 1500);
          } catch (error) {
            componentLogger.error('Failed to copy wallet address:', error);
          }
        }}
      >
        <Icon
          icon={copied ? 'mingcute:check-line' : 'mingcute:copy-line'}
          width="14"
          height="14"
          aria-hidden="true"
        />
      </button>
    </code>
  );
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [processedData, setProcessedData] = useState<ProcessedMarkdownData | null>(null);
  const currentDocsSlug = location.pathname.startsWith('/docs')
    ? location.pathname.replace(/^\/docs\/?/, '')
    : '';
  const routeContext = useMemo(() => parseDocsRoutePath(currentDocsSlug), [currentDocsSlug]);
  const [isProcessing, setIsProcessing] = useState(true);
  const hasRenderedContentRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (!content) {
      hasRenderedContentRef.current = false;
      setProcessedData(null);
      setIsProcessing(false);
      return () => {
        isMounted = false;
      };
    }

    const processContent = async () => {
      try {
        setIsProcessing(true);
        componentLogger.debug('Processing markdown content');

        const result = await processMarkdown(content);

        if (isMounted) {
          hasRenderedContentRef.current = true;
          setProcessedData(result);
          setIsProcessing(false);
        }
      } catch (error) {
        componentLogger.error('Error processing markdown:', error);
        if (isMounted) {
          hasRenderedContentRef.current = true;
          setProcessedData({
            html: '<p>Error loading content. Please try again.</p>',
            codeBlocks: new Map(),
          });
          setIsProcessing(false);
        }
      }
    };

    void processContent();

    return () => {
      isMounted = false;
    };
  }, [content]);

  const renderedContent = useMemo(() => {
    if (!processedData) {
      return null;
    }

    return parseHtmlToReactNodes(processedData, {
      codeBlocks: processedData.codeBlocks,
      navigate: (href) => {
        if (href === '/' || href === '/llms') {
          navigate(href);
          return;
        }

        if (href.startsWith('/docs')) {
          const targetSlug = href.replace(/^\/docs\/?/, '');
          const parsedTarget = parseDocsRoutePath(targetSlug);
          const resolvedTargetPath = resolveDocumentPath(parsedTarget.docPath);

          navigate(
            buildCanonicalDocsPath(resolvedTargetPath, {
              version: routeContext.activeVersion,
              locale: routeContext.activeLocale,
            })
          );
          return;
        }

        navigate(href);
      },
    });
  }, [navigate, processedData, routeContext.activeLocale, routeContext.activeVersion]);

  if (!processedData && isProcessing) {
    return (
      <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="w-full">
        <div className="animate-pulse space-y-4">
          <div className="ui-skeleton-strong h-8 w-3/4 rounded"></div>
          <div className="ui-skeleton h-4 w-full rounded"></div>
          <div className="ui-skeleton h-4 w-5/6 rounded"></div>
          <div className="ui-skeleton h-32 rounded"></div>
          <div className="ui-skeleton h-4 w-4/5 rounded"></div>
        </div>
      </motion.div>
    );
  }

  if (!processedData || !renderedContent) {
    return (
      <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="w-full">
        <p className="ui-meta">No content available.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0.9, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="w-full"
    >
      {isProcessing && hasRenderedContentRef.current && (
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 ui-meta"
          style={{ borderColor: 'var(--border-unified)' }}
        >
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ backgroundColor: 'var(--primary-color)' }}
          />
          Updating content...
        </div>
      )}
      <div className="markdown-content prose prose-gray dark:prose-invert max-w-none">
        {renderedContent}
      </div>
    </motion.div>
  );
};

export default MarkdownRenderer;
