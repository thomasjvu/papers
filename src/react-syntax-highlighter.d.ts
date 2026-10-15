declare module 'react-syntax-highlighter/dist/esm/prism-light' {
  import type { ComponentType, CSSProperties } from 'react';

  export interface PrismLightProps {
    language?: string;
    style?: Record<string, CSSProperties>;
    showLineNumbers?: boolean;
    wrapLines?: boolean;
    customStyle?: CSSProperties;
    codeTagProps?: {
      style?: CSSProperties;
    };
    children: string;
  }

  const SyntaxHighlighter: ComponentType<PrismLightProps> & {
    registerLanguage: (name: string, language: unknown) => void;
    alias?: (name: string, aliases: string | string[]) => void;
  };

  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  import type { CSSProperties } from 'react';

  export const oneDark: Record<string, CSSProperties>;
  export const oneLight: Record<string, CSSProperties>;
}

declare module 'react-syntax-highlighter/dist/esm/languages/prism/*' {
  const language: unknown;
  export default language;
}

declare module 'react-syntax-highlighter/dist/esm/create-element' {
  import type { ReactNode } from 'react';

  export default function createElement(props: {
    node: unknown;
    stylesheet: Record<string, unknown>;
    useInlineStyles: boolean;
    key: string;
  }): ReactNode;
}
