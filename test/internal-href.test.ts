import assert from 'node:assert/strict';

import { resolveInternalHref } from '../src/utils/internalHref.ts';

const context = {
  currentPath: 'guides/setup/install',
  activeLocale: null,
  activeVersion: null,
  resolveDocumentPath: (slug: string) => (slug === 'guides' ? 'guides/intro' : slug),
};

export const internalHrefTests = [
  {
    name: 'resolveInternalHref leaves anchors and external links to the browser',
    run: () => {
      for (const href of [
        '',
        '#',
        '#section',
        'https://x.dev',
        'mailto:a@b.c',
        '//cdn.x/y',
        'TEL:1',
      ]) {
        assert.equal(resolveInternalHref(href, context), null, href);
      }
    },
  },
  {
    name: 'resolveInternalHref maps site, hosted and absolute docs links',
    run: () => {
      assert.equal(resolveInternalHref('/', context), '/');
      assert.equal(resolveInternalHref('/llms', context), '/llms.txt');
      assert.equal(resolveInternalHref('/llms.txt', context), '/llms.txt');
      assert.equal(resolveInternalHref('/skill', context), '/skill.md');
      assert.equal(resolveInternalHref('/skill.md', context), '/skill.md');
      assert.equal(resolveInternalHref('/docs/a/b/?q=1#h', context), '/docs/a/b?q=1#h');
      assert.equal(resolveInternalHref('/docs', context), '/docs');
      assert.equal(resolveInternalHref('/dev-docs/x', context), '/dev-docs/x');
      assert.equal(resolveInternalHref('/dev-docs', context), '/dev-docs');
      assert.equal(resolveInternalHref('/guides/intro.md#top', context), '/docs/guides/intro#top');
      assert.equal(resolveInternalHref('/docsy', context), '/docs/docsy');
      assert.equal(resolveInternalHref('/guides/', context), '/docs/guides/intro');
      assert.equal(
        resolveInternalHref('/x', { ...context, activeVersion: '1.0', activeLocale: 'fr' }),
        '/docs/x' // variants are disabled in the default config
      );
    },
  },
  {
    name: 'resolveInternalHref resolves relative links against the current document',
    run: () => {
      assert.equal(resolveInternalHref('next.md', context), '/docs/guides/setup/next');
      assert.equal(resolveInternalHref('../intro.mdx?x=1', context), '/docs/guides/intro?x=1');
      assert.equal(resolveInternalHref('./a#b?c', context), '/docs/guides/setup/a#b?c');
      assert.equal(resolveInternalHref('peer', { ...context, currentPath: 'root' }), '/docs/peer');
    },
  },
];
