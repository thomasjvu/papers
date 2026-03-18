/**
 * Shared documentation tree configuration.
 *
 * This file is the single source of truth for the docs structure. It is used by:
 * - src/data/documentation.ts
 * - scripts/generate-docs.mjs
 * - scripts/generate-llms.mjs
 */

/**
 * @typedef {Object} FileItem
 * @property {string} name
 * @property {string} path
 * @property {'file' | 'directory'} type
 * @property {FileItem[]} [children]
 * @property {boolean} [expanded]
 * @property {string[]} [tags]
 */

/**
 * @typedef {Object} HomepageConfig
 * @property {boolean} enabled
 * @property {Object} hero
 * @property {Object[]} [features]
 * @property {Object} [quickStart]
 */

/** @type {{ current: string, versions: string[], labels: Record<string, string>, enabled: boolean }} */
export const versionConfig = {
  current: '1.0',
  versions: ['1.0'],
  labels: {
    '1.0': 'Latest',
  },
  enabled: false,
};

/** @type {{ enabled: boolean, defaultLocale: string, locales: string[] }} */
export const i18nConfig = {
  enabled: false,
  defaultLocale: 'en',
  locales: ['en'],
};

/** @type {HomepageConfig} */
export const homepageConfig = {
  enabled: true,
  hero: {
    title: 'papers',
    subtitle: 'Static documentation template',
    description:
      'A minimal docs starter with install-ready defaults, generated content, and static-host deployment support.',
    artwork: {
      src: '/images/docs/placeholders/template-hero-banner.svg',
      alt: 'Placeholder hero banner for a documentation homepage',
      caption:
        'Placeholder hero banner. Replace with a product screenshot, illustrated system overview, or docs brand artwork.',
    },
    cta: {
      primary: {
        text: 'Installation',
        href: '/docs/getting-started/installation',
      },
      secondary: {
        text: 'Quick Start',
        href: '/docs/getting-started/quick-start',
      },
    },
  },
  features: [
    {
      title: 'Install fast',
      description: 'Clone the repo, install dependencies, and start editing docs in a few minutes.',
      icon: 'mingcute:flash-line',
    },
    {
      title: 'Write in Markdown',
      description:
        'Keep your real documentation in `src/docs/content/` and drive navigation from shared config.',
      icon: 'mingcute:file-text-line',
    },
    {
      title: 'Ship static',
      description:
        'Build once and deploy to Cloudflare Pages, Vercel, Netlify, or any host with SPA rewrites.',
      icon: 'mingcute:rocket-line',
    },
    {
      title: 'Search-ready',
      description:
        'Use the command palette locally and Pagefind full-text search in production builds.',
      icon: 'mingcute:search-line',
    },
  ],
  quickStart: {
    title: 'Install In 4 Steps',
    steps: [
      {
        title: 'Clone the template',
        code: 'git clone git@github.com:thomasjvu/papers.git',
      },
      {
        title: 'Enter the project and install dependencies',
        code: 'cd papers && npm install',
      },
      {
        title: 'Start the local docs app',
        code: 'npm run dev',
      },
      {
        title: 'Open the setup docs',
        code: 'visit /docs/getting-started/installation',
      },
    ],
  },
  footer: {
    links: [
      { text: 'Installation', href: '/docs/getting-started/installation' },
      { text: 'Documentation', href: '/docs/getting-started/introduction' },
      { text: 'GitHub', href: 'https://github.com/thomasjvu/papers' },
    ],
  },
};

/** @type {FileItem[]} */
export const documentationTree = [
  {
    type: 'directory',
    name: 'Getting Started',
    path: 'getting-started',
    children: [
      {
        type: 'file',
        name: 'Introduction.md',
        path: 'getting-started/introduction',
        tags: ['getting-started', 'overview', 'template'],
      },
      {
        type: 'file',
        name: 'Quick Start.md',
        path: 'getting-started/quick-start',
        tags: ['setup', 'quick-start', 'template'],
      },
      {
        type: 'file',
        name: 'Installation.md',
        path: 'getting-started/installation',
        tags: ['setup', 'installation', 'environment'],
      },
    ],
  },
  {
    type: 'directory',
    name: 'User Guide',
    path: 'user-guide',
    children: [
      {
        type: 'file',
        name: 'Basic Usage.md',
        path: 'user-guide/basic-usage',
        tags: ['usage', 'navigation', 'guide'],
      },
      {
        type: 'file',
        name: 'Advanced Features.md',
        path: 'user-guide/advanced-features',
        tags: ['advanced', 'search', 'features'],
      },
      {
        type: 'file',
        name: 'Configuration.md',
        path: 'user-guide/configuration',
        tags: ['configuration', 'setup', 'guide'],
      },
      {
        type: 'file',
        name: 'Troubleshooting.md',
        path: 'user-guide/troubleshooting',
        tags: ['troubleshooting', 'debugging', 'guide'],
      },
      {
        type: 'file',
        name: 'Command Palette.md',
        path: 'user-guide/command-palette',
        tags: ['search', 'keyboard', 'command-palette'],
      },
      {
        type: 'file',
        name: 'Interactive Map.md',
        path: 'user-guide/interactive-map',
        tags: ['visualization', 'navigation', 'graph'],
      },
    ],
  },
  {
    type: 'directory',
    name: 'API Reference',
    path: 'api-reference',
    children: [
      {
        type: 'file',
        name: 'Overview.md',
        path: 'api-reference/overview',
        tags: ['api', 'overview', 'reference'],
      },
      {
        type: 'file',
        name: 'Content Pipeline.md',
        path: 'api-reference/content-pipeline',
        tags: ['api', 'build', 'content'],
      },
      {
        type: 'file',
        name: 'Runtime APIs.md',
        path: 'api-reference/runtime-apis',
        tags: ['api', 'runtime', 'hooks'],
      },
    ],
  },
  {
    type: 'directory',
    name: 'Developer Guides',
    path: 'developer-guides',
    children: [
      {
        type: 'file',
        name: 'Code Examples.md',
        path: 'developer-guides/code-examples',
        tags: ['code', 'examples', 'development'],
      },
      {
        type: 'file',
        name: 'Best Practices.md',
        path: 'developer-guides/best-practices',
        tags: ['best-practices', 'development', 'guide'],
      },
      {
        type: 'file',
        name: 'Design System.md',
        path: 'developer-guides/design-system',
        tags: ['design', 'ui', 'development'],
      },
      {
        type: 'file',
        name: 'UI Configuration.md',
        path: 'developer-guides/ui-configuration',
        tags: ['ui', 'configuration', 'development'],
      },
      {
        type: 'file',
        name: 'Icon Customization.md',
        path: 'developer-guides/icon-customization',
        tags: ['icons', 'customization', 'ui'],
      },
    ],
  },
  {
    type: 'directory',
    name: 'Deployment',
    path: 'deployment',
    children: [
      {
        type: 'file',
        name: 'Overview.md',
        path: 'deployment/overview',
        tags: ['deployment', 'overview', 'static-hosting'],
      },
      {
        type: 'file',
        name: 'Production Setup.md',
        path: 'deployment/production-setup',
        tags: ['deployment', 'production', 'setup'],
      },
      {
        type: 'directory',
        name: 'Platform Guides',
        path: 'deployment/platforms',
        children: [
          {
            type: 'file',
            name: 'Cloudflare.md',
            path: 'deployment/platforms/cloudflare',
            tags: ['deployment', 'cloudflare', 'hosting'],
          },
          {
            type: 'file',
            name: 'Vercel.md',
            path: 'deployment/platforms/vercel',
            tags: ['deployment', 'vercel', 'hosting'],
          },
          {
            type: 'file',
            name: 'Netlify.md',
            path: 'deployment/platforms/netlify',
            tags: ['deployment', 'netlify', 'hosting'],
          },
        ],
      },
    ],
  },
  {
    type: 'file',
    name: 'LLMs.txt.md',
    path: 'llms',
    tags: ['llms', 'ai', 'reference'],
  },
];
