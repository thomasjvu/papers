declare module '@app-shared/documentation-config.js' {
  export interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileItem[];
    expanded?: boolean;
    tags?: string[];
    description?: string;
    icon?: string;
    order?: number;
    hidden?: boolean;
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
        width?: number;
        height?: number;
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
    labels?: Record<string, string>;
  }

  export interface ChromeConfig {
    languageSwitcher: {
      enabled: 'auto' | boolean;
      placement: Array<'sidebar' | 'command-palette'>;
    };
    sidebarVariant: 'tree' | 'groups';
  }

  export interface BrandingConfig {
    productName: string;
    logo?: { src: string; alt: string } | null;
    heroFont?: 'brand' | 'title';
    copyright: {
      holder: string;
      year?: number;
      notice?: string;
    };
    attribution: { text: string; href?: string } | null;
    social: Array<{
      name: string;
      href: string;
      icon: string;
    }>;
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
    allowedOrigins?: string[];
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
  export const chromeConfig: ChromeConfig;
  export const uiStringsConfig: Record<string, Record<string, string>>;
  export const brandingConfig: BrandingConfig;
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
    description?: string;
    icon?: string;
    order?: number;
    hidden?: boolean;
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
        width?: number;
        height?: number;
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
    labels?: Record<string, string>;
  }

  export interface ChromeConfig {
    languageSwitcher: {
      enabled: 'auto' | boolean;
      placement: Array<'sidebar' | 'command-palette'>;
    };
    sidebarVariant: 'tree' | 'groups';
  }

  export interface BrandingConfig {
    productName: string;
    logo?: { src: string; alt: string } | null;
    heroFont?: 'brand' | 'title';
    copyright: {
      holder: string;
      year?: number;
      notice?: string;
    };
    attribution: { text: string; href?: string } | null;
    social: Array<{
      name: string;
      href: string;
      icon: string;
    }>;
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
    allowedOrigins?: string[];
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
  export const chromeConfig: ChromeConfig;
  export const uiStringsConfig: Record<string, Record<string, string>>;
  export const brandingConfig: BrandingConfig;
  export const openapiConfig: OpenApiConfig;
  export const designBookConfig: DesignBookConfig;
  export const frameworkDocPaths: string[];
  export const navConfig: NavConfig;
}
