import assert from 'node:assert/strict';

import {
  absoluteOrPath,
  appendRoutePreloads,
  applyMetadataToHtml,
  createAgentLinks,
  createHomepageMetadata,
  createRouteMetadata,
  escapeAttribute,
  escapeRegExp,
  socialCardTitle,
  stripNonCriticalPreloads,
} from '../scripts/lib/routeHtml.mjs';

const TEMPLATE = '<html><head><title>Old</title></head><body></body></html>';

const baseMetadata = {
  title: 'Page | Site',
  description: 'Desc',
  canonicalUrl: 'https://ex.com/docs/a',
  url: 'https://ex.com/docs/a',
  imageUrl: 'https://ex.com/og.png',
  twitterImageUrl: 'https://ex.com/tw.png',
  robots: 'index, follow',
  type: 'article',
  siteName: 'Site',
  routePath: '/docs/a',
  agentLinks: [{ href: '/llms.txt', contentType: 'text/plain', title: 'LLM index' }],
};

function count(html: string, needle: string | RegExp) {
  return html.split(needle).length - 1;
}

export const routeHtmlTests = [
  {
    name: 'escapeAttribute and escapeRegExp neutralise HTML and regex syntax',
    run: () => {
      assert.equal(escapeAttribute('a & "b" <c> \'d\''), "a &amp; &quot;b&quot; &lt;c&gt; 'd'");
      assert.equal(escapeAttribute('&&'), '&amp;&amp;');
      const special = '.*+?^${}()|[]\\';
      assert.equal(escapeRegExp(special), '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
      assert.ok(new RegExp(`^${escapeRegExp(special)}$`).test(special));
      assert.equal(escapeRegExp('plain'), 'plain');
    },
  },
  {
    name: 'applyMetadataToHtml inserts every SEO tag into a bare template',
    run: () => {
      const html = applyMetadataToHtml(TEMPLATE, baseMetadata);
      assert.match(html, /<title>Page \| Site<\/title>/);
      for (const tag of [
        '<meta name="description" content="Desc" />',
        '<meta name="robots" content="index, follow" />',
        '<meta property="og:type" content="article" />',
        '<meta property="og:title" content="Page | Site" />',
        '<meta property="og:description" content="Desc" />',
        '<meta property="og:site_name" content="Site" />',
        '<meta property="og:url" content="https://ex.com/docs/a" />',
        '<meta property="og:image" content="https://ex.com/og.png" />',
        '<meta property="og:image:alt" content="Page | Site documentation preview" />',
        '<meta name="twitter:card" content="summary_large_image" />',
        '<meta name="twitter:title" content="Page | Site" />',
        '<meta name="twitter:description" content="Desc" />',
        '<meta name="twitter:image" content="https://ex.com/tw.png" />',
        '<meta name="twitter:image:alt" content="Page | Site documentation preview" />',
        '<link rel="canonical" href="https://ex.com/docs/a" />',
        '<link rel="alternate" type="text/plain" title="LLM index" href="/llms.txt" />',
      ]) {
        assert.equal(count(html, `    ${tag}\n`), 1, tag);
      }
      const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      assert.ok(jsonLd);
      const graph = JSON.parse(jsonLd[1])['@graph'];
      assert.ok(graph.some((node: { headline?: string }) => node.headline === 'Page | Site'));
      assert.ok(html.endsWith('</script>\n  </head><body></body></html>'));
    },
  },
  {
    name: 'applyMetadataToHtml replaces existing tags instead of duplicating them',
    run: () => {
      const first = applyMetadataToHtml(TEMPLATE, baseMetadata);
      const second = applyMetadataToHtml(first, {
        ...baseMetadata,
        title: 'New <T> & "Q"',
        description: 'Other',
        robots: 'noindex, nofollow',
        canonicalUrl: '/x',
      });
      assert.match(second, /<title>New &lt;T&gt; &amp; &quot;Q&quot;<\/title>/);
      assert.equal(count(second, '<meta name="description"'), 1);
      assert.equal(count(second, '<meta name="robots" content="noindex, nofollow" />'), 1);
      assert.equal(count(second, '<link rel="canonical" href="/x" />'), 1);
      assert.equal(count(second, '<link rel="alternate"'), 1);
      assert.equal(count(second, 'application/ld+json'), 1);
      assert.doesNotMatch(second, /content="Desc"/);
      // Re-applying restores the original tags; only indentation differs because
      // the alternate-link upsert re-indents its line and eats trailing whitespace.
      const squash = (html: string) => html.replace(/\s+/g, ' ');
      assert.equal(squash(applyMetadataToHtml(second, baseMetadata)), squash(first));
    },
  },
  {
    name: 'applyMetadataToHtml matches existing tags case-insensitively and self-closed or not',
    run: () => {
      const template =
        '<html><head><TITLE>x</TITLE><META name="description"   content="old">' +
        '<link rel="canonical" href="/old">' +
        '<link rel="alternate" type="text/plain" title="LLM index" href="/old.txt" />  ' +
        '<script type="application/ld+json">{"old":true}</script></head></html>';
      const html = applyMetadataToHtml(template, {
        ...baseMetadata,
        agentLinks: baseMetadata.agentLinks,
      });
      assert.match(html, /<title>Page \| Site<\/title>/);
      assert.equal(count(html, 'name="description"'), 1);
      assert.equal(count(html, 'rel="canonical"'), 1);
      assert.equal(count(html, 'rel="alternate"'), 1);
      assert.doesNotMatch(html, /old/);
    },
  },
  {
    name: 'stripNonCriticalPreloads drops lazy vendor and page chunks only',
    run: () => {
      const keep = [
        '<link rel="modulepreload" crossorigin href="/assets/vendor-react-1.js">',
        '<link rel="stylesheet" crossorigin href="/assets/index-1.css">',
      ];
      const drop = [
        '<link rel="modulepreload" crossorigin href="/assets/vendor-mermaid-1.js">',
        '<link rel="modulepreload" crossorigin href="/assets/vendor-openapi-1.js">',
        '<link rel="modulepreload" crossorigin href="/assets/vendor-markdown-1.js">',
        '<link rel="modulepreload" crossorigin href="/assets/vendor-syntax-1.js">',
        '<link rel="modulepreload" crossorigin href="/assets/vendor-sanitize-1.js">',
        '<link rel="modulepreload" crossorigin href="/assets/DocsPage-1.js">',
        '<link rel="modulepreload" crossorigin href="/assets/OpenApiPage-1.js">',
        '<link rel="modulepreload" crossorigin href="/assets/DesignBookPage-1.js">',
        '<link rel="stylesheet" crossorigin href="/assets/vendor-openapi-1.css">',
      ];
      const html = ['<head>', ...[...keep, ...drop].map((line) => `    ${line}`), '</head>'].join(
        '\n'
      );
      const stripped = stripNonCriticalPreloads(html);
      for (const line of keep) assert.ok(stripped.includes(line), line);
      for (const line of drop) assert.ok(!stripped.includes(line), line);
      const inline = '<p><link rel="modulepreload" crossorigin href="/assets/DocsPage-1.js"> x</p>';
      assert.equal(stripNonCriticalPreloads(inline), inline);
    },
  },
  {
    name: 'appendRoutePreloads inserts before </head> only when there is something to add',
    run: () => {
      assert.equal(appendRoutePreloads(TEMPLATE, ''), TEMPLATE);
      assert.equal(appendRoutePreloads(TEMPLATE, undefined), TEMPLATE);
      assert.equal(
        appendRoutePreloads('<head></head>', '<link rel="preload">'),
        '<head>    <link rel="preload">\n  </head>'
      );
    },
  },
  {
    name: 'absoluteOrPath and createAgentLinks fall back to root-relative paths',
    run: () => {
      assert.equal(absoluteOrPath('/a', ''), '/a');
      assert.equal(absoluteOrPath('/a', 'https://ex.com/'), 'https://ex.com/a');
      const relative = createAgentLinks('', [{ id: 'docs' }]);
      assert.deepEqual(relative[0], {
        href: '/agents.json',
        contentType: 'application/json',
        title: 'Documentation agent index',
      });
      assert.deepEqual(relative.at(-1), {
        href: '/rss.xml',
        contentType: 'application/rss+xml',
        title: 'Documentation updates',
      });
      assert.ok(relative.some((link: { href: string }) => link.href === '/llms.txt'));
      for (const link of relative)
        assert.deepEqual(Object.keys(link).sort(), ['contentType', 'href', 'title']);
      const absolute = createAgentLinks('https://ex.com', [{ id: 'docs' }]);
      assert.equal(absolute[0].href, 'https://ex.com/agents.json');
      assert.equal(absolute[1].href, 'https://ex.com/llms.txt');
      assert.equal(absolute.length, relative.length);
    },
  },
  {
    name: 'createHomepageMetadata and createRouteMetadata pick URLs, images and robots',
    run: () => {
      const agentLinks = [{ href: '/x', contentType: 'text/plain', title: 'X' }];
      assert.deepEqual(
        createHomepageMetadata({
          siteName: 'S',
          siteSubtitle: 'Sub',
          siteDescription: 'D',
          siteUrl: 'https://ex.com',
          agentLinks,
        }),
        {
          title: 'S | Sub',
          description: 'D',
          canonicalUrl: 'https://ex.com/',
          url: 'https://ex.com/',
          imageUrl: 'https://ex.com/images/og-image.svg',
          twitterImageUrl: 'https://ex.com/images/twitter-card.svg',
          robots: 'index, follow',
          type: 'website',
          siteName: 'S',
          routePath: '/',
          agentLinks,
        }
      );
      const entry = {
        title: 'T',
        description: 'D',
        canonicalPath: '/docs/a',
        routePath: '/docs/en/a',
        type: 'article',
      };
      assert.deepEqual(createRouteMetadata(entry, { siteUrl: '', siteName: 'S', agentLinks }), {
        title: 'T',
        description: 'D',
        canonicalUrl: '/docs/a',
        url: '/docs/a',
        imageUrl: '/images/og-image.svg',
        twitterImageUrl: '/images/twitter-card.svg',
        robots: 'index, follow',
        type: 'article',
        siteName: 'S',
        routePath: '/docs/en/a',
        agentLinks,
      });
      const withCard = createRouteMetadata(
        { ...entry, noIndex: true, type: undefined },
        { siteUrl: 'https://ex.com', siteName: 'S', agentLinks, imagePath: '/images/og/a.png' }
      );
      assert.equal(withCard.canonicalUrl, 'https://ex.com/docs/a');
      assert.equal(withCard.imageUrl, 'https://ex.com/images/og/a.png');
      assert.equal(withCard.twitterImageUrl, 'https://ex.com/images/og/a.png');
      assert.equal(withCard.robots, 'noindex, nofollow');
      assert.equal(withCard.type, 'website');
    },
  },
  {
    name: 'socialCardTitle strips a trailing site-name suffix only',
    run: () => {
      assert.equal(socialCardTitle('Intro | Papers', 'Papers'), 'Intro');
      assert.equal(socialCardTitle('Intro  |  Papers', 'Papers'), 'Intro');
      assert.equal(socialCardTitle('Papers | Intro', 'Papers'), 'Papers | Intro');
      assert.equal(socialCardTitle('A | P.s', 'P.s'), 'A');
      assert.equal(socialCardTitle('A | Pxs', 'P.s'), 'A | Pxs');
      assert.equal(socialCardTitle('', 'Papers'), 'Papers');
      assert.equal(socialCardTitle(undefined, 'Papers'), 'Papers');
    },
  },
];
