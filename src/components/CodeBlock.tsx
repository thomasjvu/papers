import { Icon } from '@iconify/react';
import React, {
  useState,
  useCallback,
  useEffect,
  type CSSProperties,
  type ComponentType,
} from 'react';

import { ANIMATION_DURATION } from '../constants/ui';
import { createWordPattern, markWords, type HighlighterNode } from '../utils/codeWords';

import styles from './CodeBlock.module.css';
import {
  findDefaultSnippetIndex,
  getCodeLineProps,
  getCodeView,
  getSnippetLabel,
  resolveLineNumbersVisible,
} from './codeBlockView';
import { useUiStrings } from '../lib/uiStrings';

interface CodeSnippet {
  language: string;
  code: string;
  label?: string;
  title?: string;
  highlightLines?: number[];
  highlightWords?: string[];
  showLineNumbers?: boolean;
}

interface CodeBlockProps {
  snippets: CodeSnippet[];
  title?: string;
  defaultLanguage?: string;
  showLineNumbers?: boolean;
  className?: string;
}

type SyntaxHighlighterProps = {
  language?: string;
  style?: Record<string, CSSProperties>;
  showLineNumbers?: boolean;
  wrapLines?: boolean;
  wrapLongLines?: boolean;
  renderer?: (props: {
    rows: HighlighterNode[];
    stylesheet: Record<string, CSSProperties>;
    useInlineStyles: boolean;
  }) => React.ReactNode;
  lineProps?: (lineNumber: number) => {
    className?: string;
    style?: CSSProperties;
    'data-line-kind'?: string;
  };
  customStyle?: CSSProperties;
  codeTagProps?: {
    style?: CSSProperties;
  };
  children: string;
};

type SyntaxHighlighterComponent = ComponentType<SyntaxHighlighterProps> & {
  registerLanguage: (name: string, language: unknown) => void;
};

type CreateElement = (props: {
  node: HighlighterNode;
  stylesheet: Record<string, CSSProperties>;
  useInlineStyles: boolean;
  key: string;
}) => React.ReactNode;

type SyntaxModule = {
  SyntaxHighlighter: SyntaxHighlighterComponent;
  createElement: CreateElement;
};

const minimalSyntaxTheme: Record<string, CSSProperties> = {
  'pre[class*="language-"]': {
    color: 'var(--code-text-color)',
    background: 'transparent',
    textShadow: 'none',
    fontFamily: 'var(--mono-font)',
    fontSize: 'var(--code-font-size)',
    lineHeight: 'var(--code-line-height)',
  },
  'code[class*="language-"]': {
    color: 'var(--code-text-color)',
    background: 'transparent',
    textShadow: 'none',
    fontFamily: 'var(--mono-font)',
    fontSize: 'var(--code-font-size)',
    lineHeight: 'var(--code-line-height)',
  },
  comment: {
    color: 'var(--code-muted-color)',
    fontStyle: 'italic',
  },
  prolog: {
    color: 'var(--code-muted-color)',
  },
  doctype: {
    color: 'var(--code-muted-color)',
  },
  cdata: {
    color: 'var(--code-muted-color)',
  },
  punctuation: {
    color: 'var(--code-subtle-color)',
  },
  operator: {
    color: 'var(--code-subtle-color)',
  },
  entity: {
    color: 'var(--code-subtle-color)',
    cursor: 'help',
  },
  url: {
    color: 'var(--code-subtle-color)',
  },
  namespace: {
    color: 'var(--code-subtle-color)',
    opacity: 0.8,
  },
  keyword: {
    color: 'var(--code-text-color)',
    fontWeight: 600,
  },
  important: {
    color: 'var(--code-text-color)',
    fontWeight: 600,
  },
  property: {
    color: 'var(--code-text-color)',
  },
  tag: {
    color: 'var(--code-text-color)',
  },
  selector: {
    color: 'var(--code-text-color)',
  },
  string: {
    color: 'var(--code-text-color)',
  },
  char: {
    color: 'var(--code-text-color)',
  },
  function: {
    color: 'var(--code-text-color)',
  },
  'class-name': {
    color: 'var(--code-text-color)',
  },
  'attr-value': {
    color: 'var(--code-text-color)',
  },
  inserted: {
    color: 'var(--code-inserted-color, rgb(34, 140, 80))',
  },
  deleted: {
    color: 'var(--code-deleted-color, rgb(200, 60, 60))',
  },
  'attr-name': {
    color: 'var(--code-subtle-color)',
  },
  boolean: {
    color: 'var(--code-subtle-color)',
  },
  number: {
    color: 'var(--code-subtle-color)',
  },
  constant: {
    color: 'var(--code-subtle-color)',
  },
  symbol: {
    color: 'var(--code-subtle-color)',
  },
  builtin: {
    color: 'var(--code-subtle-color)',
  },
  variable: {
    color: 'var(--code-subtle-color)',
  },
  atrule: {
    color: 'var(--code-subtle-color)',
  },
  regex: {
    color: 'var(--code-subtle-color)',
  },
  bold: {
    fontWeight: 700,
  },
  italic: {
    fontStyle: 'italic',
  },
  '.token.line-number': {
    color: 'var(--code-line-number-color)',
    opacity: 0.72,
  },
  '.line-numbers-rows': {
    borderRight: '1px solid var(--code-border-color)',
    marginRight: '0.875rem',
  },
};

const CODE_LINE_CLASS_NAMES = {
  line: styles.codeLine,
  highlighted: styles.codeLineHighlighted,
  added: styles.codeLineAdded,
  removed: styles.codeLineRemoved,
};

const CodeBlock: React.FC<CodeBlockProps> = React.memo(
  ({ snippets = [], title, defaultLanguage, showLineNumbers = true, className = '' }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [copied, setCopied] = useState(false);
    const ui = useUiStrings();
    // Per-block line-number toggle; null follows the fence/default setting.
    const [lineNumberOverride, setLineNumberOverride] = useState<boolean | null>(null);
    const [mounted, setMounted] = useState(false);
    const [syntaxModule, setSyntaxModule] = useState<SyntaxModule | null>(null);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      let cancelled = false;

      async function loadSyntaxHighlighter() {
        const [
          { default: PrismLight },
          bash,
          css,
          javascript,
          json,
          markdown,
          markup,
          tsx,
          typescript,
          diff,
          python,
          yaml,
          sql,
          go,
          rust,
          createElementModule,
        ] = await Promise.all([
          import('react-syntax-highlighter/dist/esm/prism-light'),
          import('react-syntax-highlighter/dist/esm/languages/prism/bash'),
          import('react-syntax-highlighter/dist/esm/languages/prism/css'),
          import('react-syntax-highlighter/dist/esm/languages/prism/javascript'),
          import('react-syntax-highlighter/dist/esm/languages/prism/json'),
          import('react-syntax-highlighter/dist/esm/languages/prism/markdown'),
          import('react-syntax-highlighter/dist/esm/languages/prism/markup'),
          import('react-syntax-highlighter/dist/esm/languages/prism/tsx'),
          import('react-syntax-highlighter/dist/esm/languages/prism/typescript'),
          import('react-syntax-highlighter/dist/esm/languages/prism/diff'),
          import('react-syntax-highlighter/dist/esm/languages/prism/python'),
          import('react-syntax-highlighter/dist/esm/languages/prism/yaml'),
          import('react-syntax-highlighter/dist/esm/languages/prism/sql'),
          import('react-syntax-highlighter/dist/esm/languages/prism/go'),
          import('react-syntax-highlighter/dist/esm/languages/prism/rust'),
          import('react-syntax-highlighter/dist/esm/create-element'),
        ]);

        const SyntaxHighlighter = PrismLight as SyntaxHighlighterComponent;
        SyntaxHighlighter.registerLanguage('bash', bash.default);
        SyntaxHighlighter.registerLanguage('css', css.default);
        SyntaxHighlighter.registerLanguage('javascript', javascript.default);
        SyntaxHighlighter.registerLanguage('json', json.default);
        SyntaxHighlighter.registerLanguage('markdown', markdown.default);
        SyntaxHighlighter.registerLanguage('markup', markup.default);
        SyntaxHighlighter.registerLanguage('tsx', tsx.default);
        SyntaxHighlighter.registerLanguage('typescript', typescript.default);
        SyntaxHighlighter.registerLanguage('diff', diff.default);
        SyntaxHighlighter.registerLanguage('python', python.default);
        SyntaxHighlighter.registerLanguage('yaml', yaml.default);
        SyntaxHighlighter.registerLanguage('sql', sql.default);
        SyntaxHighlighter.registerLanguage('go', go.default);
        SyntaxHighlighter.registerLanguage('rust', rust.default);

        if (!cancelled) {
          setSyntaxModule({
            SyntaxHighlighter,
            createElement: createElementModule.default as unknown as CreateElement,
          });
        }
      }

      void loadSyntaxHighlighter();

      return () => {
        cancelled = true;
      };
    }, []);

    useEffect(() => {
      const defaultIndex = findDefaultSnippetIndex(snippets, defaultLanguage);
      if (defaultIndex !== -1) {
        setActiveTab(defaultIndex);
      }
    }, [defaultLanguage, snippets]);

    const currentSnippet = snippets[activeTab] || snippets[0];

    const copyToClipboard = useCallback(async () => {
      if (!currentSnippet) return;

      try {
        await navigator.clipboard.writeText(currentSnippet.code);
        setCopied(true);
        setTimeout(() => setCopied(false), ANIMATION_DURATION.feedback);
      } catch {
        const textArea = document.createElement('textarea');
        textArea.value = currentSnippet.code;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), ANIMATION_DURATION.feedback);
      }
    }, [currentSnippet]);

    if (!snippets.length) {
      return null;
    }

    if (!mounted || !syntaxModule) {
      return (
        <div className={`${styles.codeBlockContainer} ${className}`}>
          <div className="animate-pulse">
            <div className="ui-skeleton-strong mb-2 h-4 rounded-sm"></div>
            <div className="ui-skeleton h-32 rounded-sm"></div>
          </div>
        </div>
      );
    }

    const { SyntaxHighlighter } = syntaxModule;
    const codeView = getCodeView(currentSnippet, title);
    const { normalizedLanguage, snippetTitle, trimmedCode, needsLineProps } = codeView;
    const wordPattern = createWordPattern(currentSnippet.highlightWords ?? []);
    const lineNumbersVisible = resolveLineNumbersVisible(
      lineNumberOverride,
      currentSnippet,
      showLineNumbers
    );
    const { createElement: createHighlighterElement } = syntaxModule;
    const wordRenderer = wordPattern
      ? ({
          rows,
          stylesheet,
          useInlineStyles,
        }: {
          rows: HighlighterNode[];
          stylesheet: Record<string, CSSProperties>;
          useInlineStyles: boolean;
        }) =>
          rows.map((row, index) =>
            createHighlighterElement({
              node: markWords(row, wordPattern),
              stylesheet,
              useInlineStyles,
              key: `code-row-${index}`,
            })
          )
      : undefined;
    const lineProps = (lineNumber: number) =>
      getCodeLineProps(lineNumber, codeView, CODE_LINE_CLASS_NAMES);

    return (
      <div className={`${styles.codeBlockContainer} ${className}`}>
        {snippets.length > 1 && (
          <div className={styles.codeBlockTabs}>
            {snippets.map((snippet, index) => (
              <button
                key={index}
                className={`${styles.codeBlockTab} ${activeTab === index ? styles.codeBlockTabActive : ''}`}
                onClick={() => setActiveTab(index)}
                type="button"
              >
                {getSnippetLabel(snippet)}
              </button>
            ))}
          </div>
        )}

        <div className={styles.codeBlockWrapper}>
          <div className={styles.codeBlockHeader}>
            {snippetTitle ? (
              <span className={styles.codeBlockFilename} data-code-title="">
                {snippetTitle}
              </span>
            ) : null}
            <span className={styles.codeBlockLanguage}>{getSnippetLabel(currentSnippet)}</span>
            <button
              className={styles.codeBlockCopyBtn}
              onClick={() => setLineNumberOverride(!lineNumbersVisible)}
              title={lineNumbersVisible ? ui.hideLineNumbers : ui.showLineNumbers}
              aria-label={lineNumbersVisible ? ui.hideLineNumbers : ui.showLineNumbers}
              aria-pressed={lineNumbersVisible}
              type="button"
              data-line-number-toggle=""
            >
              <Icon icon="mingcute:list-ordered-line" className="h-4 w-4" />
            </button>
            <button
              className={styles.codeBlockCopyBtn}
              onClick={copyToClipboard}
              title={copied ? ui.copied : ui.copyCode}
              aria-label={copied ? ui.copied : ui.copyCode}
              type="button"
            >
              {copied ? (
                <Icon icon="mingcute:check-line" className="h-4 w-4" />
              ) : (
                <Icon icon="mingcute:copy-line" className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className={styles.codeBlockContent}>
            <SyntaxHighlighter
              language={normalizedLanguage}
              style={minimalSyntaxTheme}
              showLineNumbers={lineNumbersVisible}
              renderer={wordRenderer}
              wrapLines={true}
              wrapLongLines={true}
              lineProps={needsLineProps ? lineProps : undefined}
              customStyle={{
                margin: 0,
                padding: '1.25rem',
                background: 'transparent',
                fontSize: 'var(--code-font-size)',
                lineHeight: 'var(--code-line-height)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'normal',
                overflowWrap: 'break-word',
                overflowX: 'auto',
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'var(--mono-font)',
                  fontSize: 'inherit',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'normal',
                  overflowWrap: 'break-word',
                },
              }}
            >
              {trimmedCode}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    );
  }
);

CodeBlock.displayName = 'CodeBlock';

export default CodeBlock;
