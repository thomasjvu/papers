import { Icon } from '@iconify/react';
import React, {
  useState,
  useCallback,
  useEffect,
  type CSSProperties,
  type ComponentType,
} from 'react';

import { ANIMATION_DURATION } from '../constants/ui';
import { getLanguageDisplay } from '../utils/languageUtils';

import styles from './CodeBlock.module.css';

interface CodeSnippet {
  language: string;
  code: string;
  label?: string;
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
  customStyle?: CSSProperties;
  codeTagProps?: {
    style?: CSSProperties;
  };
  children: string;
};

type SyntaxHighlighterComponent = ComponentType<SyntaxHighlighterProps> & {
  registerLanguage: (name: string, language: unknown) => void;
};

type SyntaxModule = {
  SyntaxHighlighter: SyntaxHighlighterComponent;
};

const REGISTERED_LANGUAGES = new Set([
  'bash',
  'css',
  'javascript',
  'json',
  'markdown',
  'markup',
  'tsx',
  'typescript',
]);

const LANGUAGE_ALIASES: Record<string, string> = {
  env: 'bash',
  html: 'markup',
  js: 'javascript',
  md: 'markdown',
  ts: 'typescript',
  xml: 'markup',
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
    color: 'var(--code-text-color)',
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
  deleted: {
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

function normalizeLanguage(language: string): string | undefined {
  const lowerLanguage = language.toLowerCase();
  const mappedLanguage = LANGUAGE_ALIASES[lowerLanguage] || lowerLanguage;
  return REGISTERED_LANGUAGES.has(mappedLanguage) ? mappedLanguage : undefined;
}

const CodeBlock: React.FC<CodeBlockProps> = React.memo(
  ({ snippets = [], title, defaultLanguage, showLineNumbers = true, className = '' }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [copied, setCopied] = useState(false);
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

        if (!cancelled) {
          setSyntaxModule({ SyntaxHighlighter });
        }
      }

      void loadSyntaxHighlighter();

      return () => {
        cancelled = true;
      };
    }, []);

    useEffect(() => {
      if (defaultLanguage && snippets.length > 1) {
        const defaultIndex = snippets.findIndex(
          (snippet) => snippet.language.toLowerCase() === defaultLanguage.toLowerCase()
        );
        if (defaultIndex !== -1) {
          setActiveTab(defaultIndex);
        }
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
            <div className="ui-skeleton-strong mb-2 h-4 rounded"></div>
            <div className="ui-skeleton h-32 rounded"></div>
          </div>
        </div>
      );
    }

    const { SyntaxHighlighter } = syntaxModule;
    const normalizedLanguage = normalizeLanguage(currentSnippet.language);

    return (
      <div className={`${styles.codeBlockContainer} ${className}`}>
        {title && (
          <div className={styles.codeBlockTitle}>
            <h4 className="ui-title mb-3">{title}</h4>
          </div>
        )}

        {snippets.length > 1 && (
          <div className={styles.codeBlockTabs}>
            {snippets.map((snippet, index) => (
              <button
                key={index}
                className={`${styles.codeBlockTab} ${activeTab === index ? styles.codeBlockTabActive : ''}`}
                onClick={() => setActiveTab(index)}
                type="button"
              >
                {snippet.label || getLanguageDisplay(snippet.language)}
              </button>
            ))}
          </div>
        )}

        <div className={styles.codeBlockWrapper}>
          <div className={styles.codeBlockHeader}>
            <span className={styles.codeBlockLanguage}>
              {currentSnippet.label || getLanguageDisplay(currentSnippet.language)}
            </span>
            <button
              className={styles.codeBlockCopyBtn}
              onClick={copyToClipboard}
              title={copied ? 'Copied!' : 'Copy to clipboard'}
              type="button"
            >
              {copied ? (
                <>
                  <Icon icon="mingcute:check-line" className="h-4 w-4" />
                  <span className={styles.codeBlockCopyLabel}>Copied!</span>
                </>
              ) : (
                <>
                  <Icon icon="mingcute:copy-line" className="h-4 w-4" />
                  <span className={styles.codeBlockCopyLabel}>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className={styles.codeBlockContent}>
            <SyntaxHighlighter
              language={normalizedLanguage}
              style={minimalSyntaxTheme}
              showLineNumbers={showLineNumbers}
              wrapLines={true}
              customStyle={{
                margin: 0,
                padding: '1.25rem',
                background: 'transparent',
                fontSize: 'var(--code-font-size)',
                lineHeight: 'var(--code-line-height)',
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'var(--mono-font)',
                  fontSize: 'inherit',
                },
              }}
            >
              {currentSnippet.code.trim()}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    );
  }
);

CodeBlock.displayName = 'CodeBlock';

export default CodeBlock;
