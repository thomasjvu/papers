import { documentationTree, homepageConfig } from './documentation-config.js';

export const DEFAULT_OG_IMAGE_PATH = '/images/og-image.svg';
export const DEFAULT_TWITTER_IMAGE_PATH = '/images/twitter-card.svg';

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
  const body = stripFrontmatter(content).replace(/^```[\s\S]*?^```$/gm, ' ').trim();

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

function collectDirectoryAliases(items, aliases) {
  for (const item of items) {
    if (item.type !== 'directory' || !Array.isArray(item.children)) {
      continue;
    }

    const defaultPath = findFirstDocumentPath(item.children);
    if (defaultPath) {
      aliases.push({
        routePath: `/docs/${item.path}`,
        docPath: defaultPath,
      });
    }

    collectDirectoryAliases(item.children, aliases);
  }

  return aliases;
}

export function getDefaultDocumentPath(items = documentationTree) {
  return findFirstDocumentPath(items);
}

export function getDocumentPaths(items = documentationTree) {
  return collectDocumentPaths(items, []);
}

export function getDirectoryAliasEntries(items = documentationTree) {
  return collectDirectoryAliases(items, []);
}

export function getHomeMetadataDefaults() {
  return {
    siteName: homepageConfig.hero?.title || 'papers',
    siteSubtitle: homepageConfig.hero?.subtitle || 'Documentation',
    siteDescription: homepageConfig.hero?.description || '',
  };
}
