import { Icon } from '@iconify/react';

const githubHref = import.meta.env.VITE_GITHUB_URL || 'https://github.com/thomasjvu/papers';

export const socialLinks = [
  {
    name: 'GitHub',
    href: githubHref,
    icon: <Icon icon="mingcute:github-fill" width="24" height="24" />,
  },
];
