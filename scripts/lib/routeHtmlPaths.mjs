import { join } from 'node:path';

function normalizeRoutePath(routePath) {
  const rawPath = String(routePath || '/').split(/[?#]/, 1)[0] || '/';
  const withLeadingSlash = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const normalized = withLeadingSlash.replace(/\/+/g, '/').replace(/\/+$/, '');

  if (normalized.split('/').includes('..')) {
    throw new Error(`Route path cannot escape the dist directory: ${routePath}`);
  }

  return normalized || '/';
}

export function routeHtmlPath(routePath, distDir) {
  const normalizedRoutePath = normalizeRoutePath(routePath);

  if (normalizedRoutePath === '/') {
    return join(distDir, 'index.html');
  }

  const relativePath = normalizedRoutePath.replace(/^\/+/, '');

  if (relativePath.endsWith('.html')) {
    return join(distDir, relativePath);
  }

  return join(distDir, `${relativePath}.html`);
}
