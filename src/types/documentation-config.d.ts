declare module '@app-shared/documentation-config.js' {
  export interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileItem[];
    expanded?: boolean;
    tags?: string[];
  }

  export interface NavItem {
    label: string;
    href: string;
  }

  export interface NavConfig {
    items: NavItem[];
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

  export interface VersionConfig {
    current: string;
    versions: string[];
    labels: Record<string, string>;
    enabled: boolean;
  }

  export interface I18nConfig {
    enabled: boolean;
    defaultLocale: string;
    locales: string[];
  }

  export interface OpenApiSpecConfig {
    id: string;
    label: string;
    url: string;
    description?: string;
  }

  export interface OpenApiConfig {
    enabled: boolean;
    routePrefix?: string;
    pagePath?: string;
    defaultSpecId: string;
    specs: OpenApiSpecConfig[];
  }

  export interface DesignBookConfig {
    enabled: boolean;
    title?: string;
    subtitle?: string;
    route?: string;
    sourcePath?: string;
  }

  export const homepageConfig: HomepageConfig;
  export const documentationTree: FileItem[];
  export const versionConfig: VersionConfig;
  export const i18nConfig: I18nConfig;
  export const openapiConfig: OpenApiConfig;
  export const designBookConfig: DesignBookConfig;
  export const frameworkDocPaths: string[];
  export const navConfig: NavConfig;
}

declare module '*/shared/documentation-config.js' {
  export interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileItem[];
    expanded?: boolean;
    tags?: string[];
  }

  export interface NavItem {
    label: string;
    href: string;
  }

  export interface NavConfig {
    items: NavItem[];
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

  export interface VersionConfig {
    current: string;
    versions: string[];
    labels: Record<string, string>;
    enabled: boolean;
  }

  export interface I18nConfig {
    enabled: boolean;
    defaultLocale: string;
    locales: string[];
  }

  export interface OpenApiSpecConfig {
    id: string;
    label: string;
    url: string;
    description?: string;
  }

  export interface OpenApiConfig {
    enabled: boolean;
    routePrefix?: string;
    pagePath?: string;
    defaultSpecId: string;
    specs: OpenApiSpecConfig[];
  }

  export interface DesignBookConfig {
    enabled: boolean;
    title?: string;
    subtitle?: string;
    route?: string;
    sourcePath?: string;
  }

  export const homepageConfig: HomepageConfig;
  export const documentationTree: FileItem[];
  export const versionConfig: VersionConfig;
  export const i18nConfig: I18nConfig;
  export const openapiConfig: OpenApiConfig;
  export const designBookConfig: DesignBookConfig;
  export const frameworkDocPaths: string[];
  export const navConfig: NavConfig;
}
