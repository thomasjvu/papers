import { buildAbsoluteUrl, normalizeSiteUrl } from '../../shared/seo.js';

export const RSS_FEED_FILENAME = 'rss.xml';
export const RSS_FEED_LIMIT = 30;

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Pick feed items: indexed pages that have a last-updated date, newest first.
 * `canonicalPaths` is the set of sitemap paths, so drafts, noindex pages and
 * locale or version aliases stay out of the feed.
 */
export function selectFeedItems(
  documents,
  lastUpdatedPages,
  canonicalPaths,
  limit = RSS_FEED_LIMIT
) {
  const items = new Map();
  for (const document of documents) {
    const path = document?.metadata?.canonicalPath;
    const date = path ? lastUpdatedPages?.[path] : null;
    if (!path || !date || items.has(path) || !canonicalPaths.has(path)) continue;
    items.set(path, {
      path,
      title: document.metadata.title || document.title || path,
      description: document.metadata.description || document.description || '',
      date,
    });
  }
  return [...items.values()]
    .sort(
      (left, right) => right.date.localeCompare(left.date) || left.path.localeCompare(right.path)
    )
    .slice(0, limit);
}

/** Render an RSS 2.0 feed. The build date is the newest item date, so output is stable. */
export function createRssFeedXml({ siteName, siteUrl, description, language, items }) {
  const site = normalizeSiteUrl(siteUrl);
  const link = (path) => buildAbsoluteUrl(path, site) || path;
  const newest = items[0]?.date;
  const channel = [
    `    <title>${escapeXml(siteName)}</title>`,
    `    <link>${escapeXml(link('/'))}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    language ? `    <language>${escapeXml(language)}</language>` : '',
    `    <atom:link href="${escapeXml(link(`/${RSS_FEED_FILENAME}`))}" rel="self" type="application/rss+xml" />`,
    newest ? `    <lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>` : '',
    '    <generator>Papers</generator>',
  ].filter(Boolean);
  const entries = items.map((item) =>
    [
      '    <item>',
      `      <title>${escapeXml(item.title)}</title>`,
      `      <link>${escapeXml(link(item.path))}</link>`,
      `      <guid isPermaLink="${site ? 'true' : 'false'}">${escapeXml(link(item.path))}</guid>`,
      `      <pubDate>${new Date(item.date).toUTCString()}</pubDate>`,
      item.description ? `      <description>${escapeXml(item.description)}</description>` : '',
      '    </item>',
    ]
      .filter(Boolean)
      .join('\n')
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    ...channel,
    ...entries,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
