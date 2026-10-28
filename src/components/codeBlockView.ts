/**
 * Pure view rules for CodeBlock: language mapping, tab defaults, labels and
 * per-line classes. The component keeps state, effects and markup.
 */
import { getDiffLineKind, parseDiffLanguage } from '../../shared/codeFence.js';
import { getLanguageDisplay } from '../utils/languageUtils.ts';

export interface CodeSnippetView {
  language: string;
  code: string;
  label?: string;
  title?: string;
  highlightLines?: number[];
  showLineNumbers?: boolean;
}

const REGISTERED_LANGUAGES = new Set([
  'bash',
  'css',
  'javascript',
  'json',
  'markdown',
  'markup',
  'tsx',
  'typescript',
  'diff',
  'python',
  'yaml',
  'sql',
  'go',
  'rust',
]);

const LANGUAGE_ALIASES: Record<string, string> = {
  env: 'bash',
  py: 'python',
  yml: 'yaml',
  rs: 'rust',
  sh: 'bash',
  shell: 'bash',
  html: 'markup',
  js: 'javascript',
  md: 'markdown',
  ts: 'typescript',
  xml: 'markup',
};

/** Prism grammar name for a fence language, or undefined for plain text. */
export function normalizeLanguage(language: string): string | undefined {
  const lowerLanguage = language.toLowerCase();
  const mappedLanguage = LANGUAGE_ALIASES[lowerLanguage] || lowerLanguage;
  return REGISTERED_LANGUAGES.has(mappedLanguage) ? mappedLanguage : undefined;
}

/** Tab to open for `defaultLanguage`, or -1 to keep the current tab. */
export function findDefaultSnippetIndex(
  snippets: Pick<CodeSnippetView, 'language'>[],
  defaultLanguage: string | undefined
): number {
  if (!defaultLanguage || snippets.length <= 1) return -1;
  const wanted = defaultLanguage.toLowerCase();
  return snippets.findIndex((snippet) => snippet.language.toLowerCase() === wanted);
}

export function getSnippetLabel(snippet: Pick<CodeSnippetView, 'label' | 'language'>): string {
  return snippet.label || getLanguageDisplay(snippet.language);
}

export function getCodeView(snippet: CodeSnippetView, title: string | undefined) {
  const { isDiff, syntaxLanguage } = parseDiffLanguage(snippet.language);
  const trimmedCode = snippet.code.trim();
  const highlighted = new Set(snippet.highlightLines ?? []);
  return {
    isDiff,
    normalizedLanguage: normalizeLanguage(syntaxLanguage),
    snippetTitle: title ?? snippet.title,
    trimmedCode,
    codeLines: trimmedCode.split('\n'),
    highlighted,
    // Only wrap lines when a block uses line metadata, so plain blocks render exactly as before.
    needsLineProps: isDiff || highlighted.size > 0,
  };
}

export function resolveLineNumbersVisible(
  override: boolean | null,
  snippet: Pick<CodeSnippetView, 'showLineNumbers'>,
  fallback: boolean
): boolean {
  return override ?? snippet.showLineNumbers ?? fallback;
}

export type CodeLineClassNames = {
  line: string;
  highlighted: string;
  added: string;
  removed: string;
};

export function getCodeLineProps(
  lineNumber: number,
  view: { codeLines: string[]; isDiff: boolean; highlighted: Set<number> },
  classNames: CodeLineClassNames
) {
  const classes = [classNames.line];
  const diffKind = getDiffLineKind(view.codeLines[lineNumber - 1] ?? '', view.isDiff);
  if (view.highlighted.has(lineNumber)) classes.push(classNames.highlighted);
  if (diffKind === 'added') classes.push(classNames.added);
  if (diffKind === 'removed') classes.push(classNames.removed);
  return {
    className: classes.join(' '),
    style: { display: 'block' },
    ...(diffKind ? { 'data-line-kind': diffKind } : {}),
  };
}
