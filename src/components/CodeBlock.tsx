import { Icon } from '@iconify/react';
import React, { useState, useCallback, useEffect, type CSSProperties, type ComponentType } from 'react';

import { ANIMATION_DURATION } from '../constants/ui';
import { useTheme } from '../providers/ThemeProvider';
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
  oneDark: Record<string, CSSProperties>;
  oneLight: Record<string, CSSProperties>;
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

function normalizeLanguage(language: string): string | undefined {
  const lowerLanguage = language.toLowerCase();
  const mappedLanguage = LANGUAGE_ALIASES[lowerLanguage] || lowerLanguage;
  return REGISTERED_LANGUAGES.has(mappedLanguage) ? mappedLanguage : undefined;
}

const CodeBlock: React.FC<CodeBlockProps> = React.memo(
  ({ snippets = [], title, defaultLanguage, showLineNumbers = true, className = '' }) => {
    const { isDarkMode } = useTheme();
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
          prismStyles,
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
          import('react-syntax-highlighter/dist/esm/styles/prism'),
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
          setSyntaxModule({
            SyntaxHighlighter,
            oneDark: prismStyles.oneDark,
            oneLight: prismStyles.oneLight,
          });
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
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded"></div>
          </div>
        </div>
      );
    }

    const { SyntaxHighlighter, oneDark, oneLight } = syntaxModule;
    const normalizedLanguage = normalizeLanguage(currentSnippet.language);

    return (
      <div className={`${styles.codeBlockContainer} ${className}`}>
        {title && (
          <div className={styles.codeBlockTitle}>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{title}</h4>
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
                  <Icon icon="mingcute:check-line" className="w-4 h-4" />
                  <span className="text-xs font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Icon icon="mingcute:copy-line" className="w-4 h-4" />
                  <span className="text-xs font-medium">Copy</span>
                </>
              )}
            </button>
          </div>

          <div className={styles.codeBlockContent}>
            <SyntaxHighlighter
              language={normalizedLanguage}
              style={isDarkMode ? oneDark : oneLight}
              showLineNumbers={showLineNumbers}
              wrapLines={true}
              customStyle={{
                margin: 0,
                padding: '1.5rem',
                background: 'transparent',
                fontSize: '0.875rem',
                lineHeight: '1.6',
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
