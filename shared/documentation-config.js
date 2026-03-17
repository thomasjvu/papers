export { documentationTree } from './documentation-tree.generated.js';

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
        code: 'npx phantasy create vtuber my-brand',
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
