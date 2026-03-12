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
    title: 'Phantasy',
    subtitle: 'Verified docs for the flagship companion runtime',
    description:
      'Build an AI companion or VTuber who can run her own site, content, automations, and business.',
    cta: {
      primary: {
        text: 'Installation',
        href: '/docs/getting-started/installation',
      },
      secondary: {
        text: 'First Run',
        href: '/docs/getting-started/first-run',
      },
    },
  },
  features: [
    {
      title: 'One flagship story',
      description:
        'The docs lead with the companion product: site, publishing, automations, and business around one character.',
      icon: 'mingcute:star-line',
    },
    {
      title: 'Code-verified reference',
      description:
        'Generated inventories for routes, tabs, providers, packages, and built-ins act as the fastest drift check.',
      icon: 'mingcute:shield-check-line',
    },
    {
      title: 'Five workspaces',
      description:
        'Character, Site, Business, Automations, and Operations stay consistent across UI, API, CLI, and docs.',
      icon: 'mingcute:layout-7-line',
    },
    {
      title: 'Extension surfaces',
      description:
        'Profiles, plugins, themes, skills, and workflows stay explicit so trust boundaries remain understandable.',
      icon: 'mingcute:plugin-2-line',
    },
  ],
  quickStart: {
    title: 'Start In 4 Steps',
    steps: [
      {
        title: 'Install the runtime',
        code: 'npm install @phantasy/agent',
      },
      {
        title: 'Create the flagship shape',
        code: 'npx phantasy create business-cms my-brand',
      },
      {
        title: 'Start the runtime',
        code: 'npx phantasy start --config config/agents/my-brand.json',
      },
      {
        title: 'Open the product shell',
        code: 'visit /docs/getting-started/first-run',
      },
    ],
  },
  footer: {
    brandName: 'Phantasy Docs',
    tagline: 'Verified product documentation built from the papers framework.',
    links: [
      { text: 'Installation', href: '/docs/getting-started/installation' },
      { text: 'First Run', href: '/docs/getting-started/first-run' },
      { text: 'GitHub', href: 'https://github.com/phantasy-bot/agent' },
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
        tags: ['getting-started', 'overview', 'product'],
      },
      {
        type: 'file',
        name: 'Use Cases.md',
        path: 'getting-started/use-cases',
        tags: ['getting-started', 'presets', 'product-shapes'],
      },
      {
        type: 'file',
        name: 'Installation.md',
        path: 'getting-started/installation',
        tags: ['setup', 'installation', 'business-cms'],
      },
      {
        type: 'file',
        name: 'First Run.md',
        path: 'getting-started/first-run',
        tags: ['setup', 'smoke-test', 'admin'],
      },
      {
        type: 'file',
        name: 'Local Development.md',
        path: 'getting-started/local-development',
        tags: ['development', 'bun', 'docker'],
      },
      {
        type: 'file',
        name: 'Configuration.md',
        path: 'getting-started/configuration',
        tags: ['configuration', 'profiles', 'providers'],
      },
      {
        type: 'file',
        name: 'Bootstrapping.md',
        path: 'getting-started/bootstrapping',
        tags: ['bootstrap', 'agents', 'workspace'],
      },
    ],
  },
  {
    type: 'directory',
    name: 'Product',
    path: 'product',
    children: [
      {
        type: 'file',
        name: 'Workspaces.md',
        path: 'workspaces',
        tags: ['taxonomy', 'workspaces', 'admin'],
      },
      {
        type: 'file',
        name: 'Avatar System.md',
        path: 'avatars',
        tags: ['character', 'avatars', 'live2d', 'vrm', 'pngtuber'],
      },
      {
        type: 'file',
        name: 'Website Modes.md',
        path: 'website-mode',
        tags: ['site', 'website', 'publishing'],
      },
      {
        type: 'file',
        name: 'Chronicle.md',
        path: 'features/chronicle',
        tags: ['chronicle', 'content', 'blog'],
      },
      {
        type: 'file',
        name: 'Integration Model.md',
        path: 'integrations/integrations-guide',
        tags: ['integrations', 'skills', 'mcp', 'plugins'],
      },
      {
        type: 'file',
        name: 'Workflow Overview.md',
        path: 'workflows/overview',
        tags: ['automations', 'workflows', 'approvals'],
      },
    ],
  },
  {
    type: 'directory',
    name: 'Guides',
    path: 'guides',
    children: [
      {
        type: 'file',
        name: '10 Minute Launch.md',
        path: 'guides/BUSINESS_AGENT_CMS_10_MINUTES',
        tags: ['launch', 'business-cms', 'quickstart'],
      },
      {
        type: 'file',
        name: 'Live2D Setup.md',
        path: 'guides/LIVE2D_SETUP',
        tags: ['live2d', 'appearance', 'media'],
      },
      {
        type: 'file',
        name: 'Authentication Setup.md',
        path: 'guides/AUTHENTICATION_SETUP',
        tags: ['auth', 'security', 'hosting'],
      },
      {
        type: 'file',
        name: 'Deploy.md',
        path: 'guides/DEPLOY',
        tags: ['deploy', 'docker', 'hosting'],
      },
      {
        type: 'file',
        name: 'Consuming Phantasy.md',
        path: 'guides/CONSUMING_PHANTASY',
        tags: ['packages', 'embedding', 'consumption'],
      },
      {
        type: 'file',
        name: 'Launch Playbook.md',
        path: 'guides/LAUNCH_PLAYBOOK',
        tags: ['launch', 'marketing', 'product-story'],
      },
    ],
  },
  {
    type: 'directory',
    name: 'Architecture',
    path: 'architecture',
    children: [
      {
        type: 'file',
        name: 'Design Principles.md',
        path: 'architecture/design-principles',
        tags: ['architecture', 'principles', 'core'],
      },
      {
        type: 'file',
        name: 'Runtime Packages.md',
        path: 'architecture/runtime-packages',
        tags: ['packages', 'profiles', 'exports'],
      },
      {
        type: 'file',
        name: 'System Design.md',
        path: 'architecture/system-design',
        tags: ['architecture', 'system-design', 'runtime'],
      },
      {
        type: 'file',
        name: 'Memory System.md',
        path: 'architecture/memory-system',
        tags: ['memory', 'storage', 'markdown'],
      },
      {
        type: 'file',
        name: 'Agent Compatibility.md',
        path: 'architecture/agent-compatibility',
        tags: ['agents', 'skills', 'mcp'],
      },
      {
        type: 'file',
        name: 'Heartbeat.md',
        path: 'architecture/heartbeat',
        tags: ['heartbeat', 'automation', 'background-jobs'],
      },
      {
        type: 'file',
        name: 'Admin UI Style Policy.md',
        path: 'architecture/admin-ui-style-policy',
        tags: ['admin-ui', 'style', 'css-modules'],
      },
      {
        type: 'file',
        name: 'Repository Standards.md',
        path: 'architecture/repo-standards',
        tags: ['validation', 'standards', 'architecture'],
      },
    ],
  },
  {
    type: 'directory',
    name: 'Extensions',
    path: 'extensions',
    children: [
      {
        type: 'file',
        name: 'Plugin Overview.md',
        path: 'plugins/overview',
        tags: ['plugins', 'profiles', 'capabilities'],
      },
      {
        type: 'file',
        name: 'Developing Plugins.md',
        path: 'plugins/developing',
        tags: ['plugins', 'sdk', 'development'],
      },
    ],
  },
  {
    type: 'directory',
    name: 'API & Reference',
    path: 'reference',
    children: [
      {
        type: 'file',
        name: 'CLI.md',
        path: 'cli',
        tags: ['cli', 'tui', 'runtime'],
      },
      {
        type: 'file',
        name: 'Public API.md',
        path: 'api/public-api',
        tags: ['api', 'public', 'integrations'],
      },
      {
        type: 'file',
        name: 'Admin API.md',
        path: 'api/admin-api',
        tags: ['api', 'admin', 'routes'],
      },
    ],
  },
  {
    type: 'directory',
    name: 'Generated Inventories',
    path: 'generated',
    children: [
      {
        type: 'file',
        name: 'Defaults.md',
        path: 'generated/defaults',
        tags: ['generated', 'defaults', 'configuration'],
      },
      {
        type: 'file',
        name: 'Providers.md',
        path: 'generated/providers',
        tags: ['generated', 'providers', 'models'],
      },
      {
        type: 'file',
        name: 'Package Exports.md',
        path: 'generated/package-exports',
        tags: ['generated', 'packages', 'exports'],
      },
      {
        type: 'file',
        name: 'Plugins.md',
        path: 'generated/plugins',
        tags: ['generated', 'plugins', 'profiles'],
      },
      {
        type: 'file',
        name: 'Skills.md',
        path: 'generated/skills',
        tags: ['generated', 'skills', 'behavior'],
      },
      {
        type: 'file',
        name: 'Themes.md',
        path: 'generated/themes',
        tags: ['generated', 'themes', 'site'],
      },
      {
        type: 'file',
        name: 'CLI Commands.md',
        path: 'generated/cli-commands',
        tags: ['generated', 'cli', 'commands'],
      },
      {
        type: 'file',
        name: 'Admin Tabs.md',
        path: 'generated/admin-tabs',
        tags: ['generated', 'admin', 'tabs'],
      },
      {
        type: 'file',
        name: 'Party-HQ Protocol.md',
        path: 'generated/party-hq-protocol',
        tags: ['generated', 'party-hq', 'protocol'],
      },
      {
        type: 'file',
        name: 'API Routes.md',
        path: 'generated/api-routes',
        tags: ['generated', 'api', 'routes'],
      },
    ],
  },
  {
    type: 'directory',
    name: 'Development',
    path: 'development',
    children: [
      {
        type: 'file',
        name: 'Verification.md',
        path: 'development/verification',
        tags: ['development', 'testing', 'verification'],
      },
    ],
  },
];
