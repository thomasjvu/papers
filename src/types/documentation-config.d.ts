declare module '*/shared/documentation-config.js' {
  export interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileItem[];
    expanded?: boolean;
    tags?: string[];
  }

  export interface HomepageConfig {
    enabled: boolean;
    hero: {
      title: string;
      subtitle: string;
      description: string;
      artwork?: {
        src: string;
        alt: string;
        caption?: string;
      };
      cta: {
        primary: { text: string; href: string };
        secondary: { text: string; href: string };
      };
    };
    features: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
    quickStart: {
      title: string;
      steps: Array<{
        title: string;
        code: string;
      }>;
    };
    footer: {
      links: Array<{
        text: string;
        href: string;
      }>;
    };
  }

  export const homepageConfig: HomepageConfig;
  export const documentationTree: FileItem[];
}
