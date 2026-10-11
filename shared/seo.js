import { documentationTree, homepageConfig } from './documentation-config.js';

export const DEFAULT_OG_IMAGE_PATH = '/images/og-image.svg';
export const DEFAULT_TWITTER_IMAGE_PATH = '/images/twitter-card.svg';
export const AGENT_DISCOVERY_PATH = '/agents.json';
export const PAGE_SOCIAL_IMAGE_DIR = '/images/og';

/**
 * Per-page social card path for a canonical route, e.g.
 * `/docs/getting-started/introduction` -> `/images/og/docs/getting-started/introduction.svg`.
 * The cards are generated into dist/ at build time by generate-route-html.
 * Unsafe or empty routes fall back to the site-wide card.
 */
export function socialImagePathForRoute(canonicalPath) {
  if (typeof canonicalPath !== 'string') return DEFAULT_OG_IMAGE_PATH;
  const trimmed = canonicalPath.replace(/\/+$/, '');
  if (!trimmed || !/^(\/[A-Za-z0-9._-]+)+$/.test(trimmed) || trimmed.split('/').includes('..')) {
    return DEFAULT_OG_IMAGE_PATH;
  }
  return `${PAGE_SOCIAL_IMAGE_DIR}${trimmed}.svg`;
}

export const AGENT_ARTIFACTS = Object.freeze([
  {
    id: 'llms',
    path: '/llms.txt',
    contentType: 'text/plain',
    title: 'Concise LLM documentation index',
  },
  {
    id: 'llms-full',
    path: '/llms-full.txt',
    contentType: 'text/plain',
    title: 'Full LLM documentation corpus',
  },
  {
    id: 'skill',
    path: '/skill.md',
    contentType: 'text/markdown',
    title: 'Agent integration guidance',
  },
  {
    id: 'collection',
    path: '/docs-collection.json',
    contentType: 'application/json',
    title: 'Typed documentation collection manifest',
  },
  {
    id: 'collections',
    path: '/collections.json',
    contentType: 'application/json',
    title: 'Documentation collection directory',
  },
  {
    id: 'references',
    path: '/docs-references.json',
    contentType: 'application/json',
    title: 'Documentation reference graph and backlinks',
  },
  {
    id: 'openapi',
    path: '/openapi-artifacts.json',
    contentType: 'application/json',
    title: 'Structured OpenAPI operations and schemas',
  },
]);

const FRONTMATTER_REGEX = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

function stripUtf8Bom(content) {
  return typeof content === 'string' ? content.replace(/^\uFEFF/, '') : '';
}

export function stripFrontmatter(content) {
  return stripUtf8Bom(content).replace(FRONTMATTER_REGEX, '');
}

function cleanMarkdownParagraph(paragraph) {
  return paragraph
    .replace(/^>\s?/gm, '')
    .replace(/^#+\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateText(text, maxLength = 160) {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const truncated = normalized.slice(0, Math.max(0, maxLength - 1));
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  const safeText = lastSpaceIndex > 0 ? truncated.slice(0, lastSpaceIndex) : truncated;
  return `${safeText.trim()}...`;
}

export function extractDescriptionFromMarkdown(content, maxLength = 160) {
  const body = stripFrontmatter(content)
    .replace(/^```[\s\S]*?^```$/gm, ' ')
    .trim();

  for (const paragraph of body.split(/\n\s*\n/)) {
    const trimmed = paragraph.trim();

    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('```')) {
      continue;
    }

    const cleaned = cleanMarkdownParagraph(trimmed);

    if (cleaned) {
      return truncateText(cleaned, maxLength);
    }
  }

  return '';
}

export function normalizeSiteUrl(siteUrl) {
  if (typeof siteUrl !== 'string' || !siteUrl.trim()) {
    return '';
  }

  const trimmed = siteUrl.trim().replace(/\/+$/, '');
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(candidate).toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function buildAbsoluteUrl(path, siteUrl) {
  if (!path) {
    return normalizeSiteUrl(siteUrl);
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);

  if (!normalizedSiteUrl) {
    return path;
  }

  return new URL(path.startsWith('/') ? path : `/${path}`, `${normalizedSiteUrl}/`).toString();
}

function findFirstDocumentPath(items) {
  for (const item of items) {
    if (item.type === 'file') {
      return item.path;
    }

    if (item.type === 'directory' && Array.isArray(item.children)) {
      const childPath = findFirstDocumentPath(item.children);
      if (childPath) {
        return childPath;
      }
    }
  }

  return null;
}

function collectDocumentPaths(items, paths) {
  for (const item of items) {
    if (item.type === 'file') {
      paths.push(item.path);
    }

    if (item.type === 'directory' && Array.isArray(item.children)) {
      collectDocumentPaths(item.children, paths);
    }
  }

  return paths;
}

function collectDirectoryAliases(items, aliases, routePrefix = 'docs') {
  for (const item of items) {
    if (item.type !== 'directory' || !Array.isArray(item.children)) {
      continue;
    }

    const defaultPath = findFirstDocumentPath(item.children);
    if (defaultPath) {
      aliases.push({
        routePath: `/${routePrefix}/${item.path}`,
        docPath: defaultPath,
      });
    }

    collectDirectoryAliases(item.children, aliases, routePrefix);
  }

  return aliases;
}

export function getDefaultDocumentPath(items = documentationTree) {
  return findFirstDocumentPath(items);
}

export function getDocumentPaths(items = documentationTree) {
  return collectDocumentPaths(items, []);
}

export function getDirectoryAliasEntries(items = documentationTree, routePrefix = 'docs') {
  return collectDirectoryAliases(items, [], routePrefix);
}

export function getHomeMetadataDefaults() {
  return {
    siteName: homepageConfig.hero?.title || 'papers',
    siteSubtitle: homepageConfig.hero?.subtitle || 'Documentation',
    siteDescription: homepageConfig.hero?.description || '',
  };
}

export function getAgentArtifactLinks(siteUrl = '', options = {}) {
  const collectionArtifacts = (options.collections || []).flatMap((collection) => {
    const namespace = collection?.artifactNamespace || collection?.id;
    if (!namespace || namespace === 'docs') {
      return [];
    }

    return [
      {
        id: `${namespace}-collection`,
        path: `/${namespace}-collection.json`,
        contentType: 'application/json',
        title: `${collection.label || namespace} collection manifest`,
      },
      {
        id: `${namespace}-references`,
        path: `/${namespace}-references.json`,
        contentType: 'application/json',
        title: `${collection.label || namespace} reference graph and backlinks`,
      },
    ];
  });

  return [...AGENT_ARTIFACTS, ...collectionArtifacts].map((artifact) => ({
    ...artifact,
    href: buildAbsoluteUrl(artifact.path, siteUrl),
  }));
}

export function createAgentDiscoveryManifest({ siteName, siteUrl, description, collections } = {}) {
  const defaults = getHomeMetadataDefaults();

  return {
    schemaVersion: 1,
    kind: 'documentation-agent-index',
    name: siteName || defaults.siteName,
    description: description || defaults.siteDescription,
    artifacts: getAgentArtifactLinks(siteUrl, { collections }),
  };
}

function createBreadcrumbItems(routePath, title, siteName, siteUrl) {
  const normalizedPath = String(routePath || '/').replace(/^\/+|\/+$/g, '');

  if (!normalizedPath) {
    return [];
  }

  const segments = normalizedPath.split('/').filter(Boolean);
  const docsIndex = segments.indexOf('docs');
  const visibleSegments = docsIndex >= 0 ? segments.slice(docsIndex + 1) : segments;
  const rootUrl = buildAbsoluteUrl('/', siteUrl);
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: siteName,
      item: rootUrl,
    },
  ];

  visibleSegments.forEach((segment, index) => {
    const isLast = index === visibleSegments.length - 1;
    const itemPath =
      docsIndex >= 0
        ? `/docs/${visibleSegments.slice(0, index + 1).join('/')}`
        : `/${segments.slice(0, index + 1).join('/')}`;
    items.push({
      '@type': 'ListItem',
      position: index + 2,
      name: isLast ? title : segment.replace(/[-_]+/g, ' '),
      item: buildAbsoluteUrl(itemPath, siteUrl),
    });
  });

  return items;
}

export function createSeoStructuredData({
  siteName,
  title,
  description,
  url,
  routePath = '/',
  type = 'website',
} = {}) {
  const defaults = getHomeMetadataDefaults();
  const resolvedSiteName = siteName || defaults.siteName;
  const resolvedTitle = title || resolvedSiteName;
  const resolvedDescription = description || defaults.siteDescription;
  const resolvedUrl = url || routePath || '/';
  const siteUrl = /^https?:\/\//i.test(resolvedUrl) ? new URL(resolvedUrl).origin : '';
  const rootUrl = buildAbsoluteUrl('/', siteUrl);
  const isHomepage = routePath === '/' && type === 'website';
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${rootUrl}#website`,
      url: rootUrl,
      name: resolvedSiteName,
      description: defaults.siteDescription,
    },
    {
      '@type': isHomepage ? 'WebSite' : type === 'article' ? 'TechArticle' : 'WebPage',
      '@id': `${resolvedUrl}#primary`,
      url: resolvedUrl,
      name: resolvedTitle,
      headline: resolvedTitle,
      description: resolvedDescription,
      isPartOf: { '@id': `${rootUrl}#website` },
    },
  ];
  const breadcrumbItems = createBreadcrumbItems(
    routePath,
    resolvedTitle,
    resolvedSiteName,
    siteUrl
  );

  if (breadcrumbItems.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${resolvedUrl}#breadcrumb`,
      itemListElement: breadcrumbItems,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export function serializeJsonLd(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
