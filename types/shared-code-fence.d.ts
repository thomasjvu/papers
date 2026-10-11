declare module '*/shared/codeFence.js' {
  export interface CodeFenceMeta {
    title?: string;
    highlightLines?: number[];
    highlightWords?: string[];
    showLineNumbers?: boolean;
  }

  export interface CodeFenceInfo extends CodeFenceMeta {
    language: string;
  }

  export type CodeLineKind = 'added' | 'removed' | null;

  export function parseHighlightLines(spec: string): number[];
  export function parseCodeFenceMeta(meta: string): CodeFenceMeta;
  export function parseCodeFenceInfo(info: string): CodeFenceInfo;
  export function parseDiffLanguage(language: string): {
    isDiff: boolean;
    syntaxLanguage: string;
  };
  export function getDiffLineKind(line: string, isDiff: boolean): CodeLineKind;
}
