import { Icon } from '@iconify/react';
import DOMPurify from 'dompurify';
import { div as MotionDiv } from 'framer-motion/m';
import { useLocation, useNavigate } from 'react-router-dom';
import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';

import {
  processMarkdown,
  type CodeBlockData,
  type MermaidBlockData,
} from '../utils/MarkdownProcessor';
import { createLogger } from '../utils/logger';
import { readHtmlCodeBlock } from '../utils/htmlCodeBlocks';
import { parseDocsRoutePath } from '../../shared/docsRouting.js';
import { resolveInternalHref } from '../utils/internalHref';
import { resolveDocumentPath } from '../lib/content';

import CodeBlock from './CodeBlock';
import ColorPalette from './ColorPalette';
import ContentTabs from './ContentTabs';
import LiveExample from './LiveExample';
import MathFormula from './MathFormula';
import { hydrateMathPlaceholders } from '../utils/renderMath';
const MermaidDiagram = lazy(() => import('./MermaidDiagram'));

const componentLogger = createLogger('MarkdownRenderer');

type MarkdownRendererProps = {
  content: string;
  path: string;
};

type HtmlRendererProps = {
  html: string;
};

const HTML_RENDERER_SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
};

const VOID_HTML_TAGS = new Set(['area', 'br', 'col', 'hr', 'img', 'input', 'source', 'wbr']);
const INTERACTIVE_HTML_SELECTOR = 'pre, .papers-code, [data-mermaid-chart], .papers-tabs';

function readMermaidChart(element: Element): string | null {
  const encoded = element.getAttribute('data-mermaid-chart');
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

function isElementNode(node: ChildNode): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

/** Text nodes render as their text; comments and other non-element nodes render nothing. */
function renderNonElementNode(node: ChildNode): string | null {
  return node.nodeType === Node.TEXT_NODE ? node.textContent : null;
}

/**
 * Convert sanitized MDX HTML to React. Code blocks (at any depth, including inside
 * callouts and tabs), Mermaid placeholders, and `<Tabs>` become components; every
 * other subtree stays static HTML so math hydration can still typeset it.
 */
function convertHtmlNode(node: ChildNode, key: string): React.ReactNode {
  if (!isElementNode(node)) {
    return renderNonElementNode(node);
  }

  const element = node;
  const tagName = element.tagName.toLowerCase();

  const codeSnippet = readHtmlCodeBlock(element);
  if (codeSnippet) {
    return <CodeBlock key={key} snippets={[codeSnippet]} showLineNumbers={true} className="my-6" />;
  }

  const chart = readMermaidChart(element);
  if (chart) {
    return (
      <Suspense
        key={key}
        fallback={<div className="mermaid-block mermaid-block--loading">Rendering diagram...</div>}
      >
        <MermaidDiagram chart={chart} />
      </Suspense>
    );
  }

  if (tagName === 'div' && element.classList.contains('papers-tabs')) {
    const panels = Array.from(element.children)
      .filter((child) => child.classList.contains('papers-tabs__panel'))
      .map((panel, index) => {
        const summary = Array.from(panel.children).find(
          (child) => child.tagName.toLowerCase() === 'summary'
        );
        const content = Array.from(panel.childNodes)
          .filter((child) => child !== summary)
          .map((child, childIndex) => convertHtmlNode(child, `${key}-${index}-${childIndex}`));
        return { label: summary?.textContent?.trim() || `Tab ${index + 1}`, content };
      });
    if (panels.length > 0) {
      return (
        <ContentTabs
          key={key}
          group={element.getAttribute('data-tabs-group')}
          panels={panels}
          className="papers-tabs"
          panelClassName="papers-tabs__panel"
        />
      );
    }
  }

  const props = getElementProps(element, key);
  delete props.style;

  if (VOID_HTML_TAGS.has(tagName)) {
    return React.createElement(tagName, props);
  }

  if (!element.querySelector(INTERACTIVE_HTML_SELECTOR)) {
    return React.createElement(tagName, {
      ...props,
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    });
  }

  return React.createElement(
    tagName,
    props,
    Array.from(element.childNodes).map((child, index) => convertHtmlNode(child, `${key}-${index}`))
  );
}

export function HtmlRenderer({ html }: HtmlRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(html, HTML_RENDERER_SANITIZE_CONFIG),
    [html]
  );
  const children = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const template = document.createElement('template');
    template.innerHTML = sanitizedHtml;
    if (!template.content.querySelector(INTERACTIVE_HTML_SELECTOR)) return null;
    return Array.from(template.content.childNodes).map((node, index) =>
      convertHtmlNode(node, `html-${index}`)
    );
  }, [sanitizedHtml]);

  // Typeset math placeholders emitted by the MDX pipeline (scripts/lib/mdxCompile.mjs).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }
    let cancelled = false;
    void hydrateMathPlaceholders(container, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [sanitizedHtml]);

  if (!children) {
    return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
  }

  return <div ref={containerRef}>{children}</div>;
}

interface ProcessedMarkdownData {
  html: string;
  codeBlocks: Map<string, CodeBlockData[]>;
  mermaidBlocks: Map<string, MermaidBlockData>;
}

interface RenderContext {
  codeBlocks: Map<string, CodeBlockData[]>;
  mermaidBlocks: Map<string, MermaidBlockData>;
  currentPath: string;
  activeLocale: string | null;
  activeVersion: string | null;
  navigate: (href: string) => void;
}

const BOOLEAN_ATTRIBUTES = new Set(['checked', 'disabled', 'open', 'readonly', 'selected']);
let toastTimeout: ReturnType<typeof setTimeout> | null = null;
const HEADING_TAG_PATTERN = /^h[1-6]$/;

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
    font-size: var(--papers-text-xs);
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
  if (!isElementNode(node)) {
    return renderNonElementNode(node);
  }

  const element = node;
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'div' && element.classList.contains('md-tabs')) {
    const panels = Array.from(element.children)
      .filter((child) => child.classList.contains('md-tabs__panel'))
      .map((panel, index) => ({
        label: panel.getAttribute('data-tab-label') || `Tab ${index + 1}`,
        content: renderNodes(panel.childNodes, `${key}-panel-${index}`, context),
      }));
    if (panels.length === 0) {
      return null;
    }
    return (
      <ContentTabs key={key} group={element.getAttribute('data-tabs-group')} panels={panels} />
    );
  }

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

  if (tagName === 'div' && element.hasAttribute('data-mermaid-id')) {
    const blockId = element.getAttribute('data-mermaid-id');
    const block = blockId ? context.mermaidBlocks.get(blockId) : undefined;

    if (!block) {
      return null;
    }

    return (
      <Suspense
        key={key}
        fallback={<div className="mermaid-block mermaid-block--loading">Rendering diagram...</div>}
      >
        <MermaidDiagram chart={block.chart} />
      </Suspense>
    );
  }

  if ((tagName === 'div' || tagName === 'span') && element.hasAttribute('data-math-tex')) {
    let tex = '';
    try {
      tex = decodeURIComponent(element.getAttribute('data-math-tex') || '');
    } catch {
      tex = element.textContent || '';
    }
    return (
      <MathFormula
        key={key}
        tex={tex}
        displayMode={element.getAttribute('data-math-display') === 'true'}
      />
    );
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

  if (HEADING_TAG_PATTERN.test(tagName)) {
    const props = getElementProps(element, key);
    const children = renderNodes(element.childNodes, key, context);
    const headingId = element.getAttribute('id');

    if (!headingId) {
      return React.createElement(tagName, props, ...children);
    }

    return React.createElement(
      tagName,
      props,
      ...children,
      <MarkdownHeadingCopyLink
        key={`${key}-copy-link`}
        headingId={headingId}
        label={element.textContent || 'section'}
      />
    );
  }

  if (tagName === 'a') {
    const href = element.getAttribute('href') || '#';
    const dataFile = element.getAttribute('data-file');
    const dataUrl = element.getAttribute('data-url');
    const props = getElementProps(element, key);
    const children = renderNodes(element.childNodes, key, context);
    const internalHref = resolveInternalHref(href, { ...context, resolveDocumentPath });

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

    if (internalHref) {
      return (
        <MarkdownRouteLink
          key={key}
          href={internalHref}
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

function MarkdownHeadingCopyLink({ headingId, label }: { headingId: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <a
      href={`#${headingId}`}
      className="heading-anchor-link"
      aria-label={`Copy link to ${label}`}
      title="Copy section link"
      onClick={async (event) => {
        event.preventDefault();

        try {
          const hash = `#${headingId}`;
          const url =
            typeof window === 'undefined'
              ? hash
              : `${window.location.origin}${window.location.pathname}${window.location.search}${hash}`;

          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', hash);
          }

          await navigator.clipboard.writeText(url);
          setCopied(true);
          showCopyToast('Copied section link');
          setTimeout(() => setCopied(false), 1500);
        } catch (error) {
          componentLogger.error('Failed to copy section link:', error);
        }
      }}
    >
      <Icon
        icon={copied ? 'mingcute:check-line' : 'mingcute:link-line'}
        width="0.8em"
        height="0.8em"
        aria-hidden="true"
      />
    </a>
  );
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

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, path }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [processedData, setProcessedData] = useState<ProcessedMarkdownData | null>(null);
  const currentDocsSlug = location.pathname.replace(/^\/+|\/+$/g, '');
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
            mermaidBlocks: new Map(),
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
      mermaidBlocks: processedData.mermaidBlocks,
      currentPath: path,
      activeLocale: routeContext.activeLocale ?? null,
      activeVersion: routeContext.activeVersion ?? null,
      navigate: (href) => {
        if (href === '/') {
          navigate(href);
          return;
        }

        if (href === '/llms.txt') {
          window.location.assign(href);
          return;
        }

        navigate(href);
      },
    });
  }, [navigate, path, processedData, routeContext.activeLocale, routeContext.activeVersion]);

  if (!processedData && isProcessing) {
    return (
      <MotionDiv initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="w-full">
        <div className="animate-pulse space-y-4">
          <div className="ui-skeleton-strong h-8 w-3/4 rounded-sm"></div>
          <div className="ui-skeleton h-4 w-full rounded-sm"></div>
          <div className="ui-skeleton h-4 w-5/6 rounded-sm"></div>
          <div className="ui-skeleton h-32 rounded-sm"></div>
          <div className="ui-skeleton h-4 w-4/5 rounded-sm"></div>
        </div>
      </MotionDiv>
    );
  }

  if (!processedData || !renderedContent) {
    return (
      <MotionDiv initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="w-full">
        <p className="ui-meta">No content available.</p>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv
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
    </MotionDiv>
  );
};

export default MarkdownRenderer;
