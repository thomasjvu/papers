import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { documentationTree } from '../shared/documentation-config.js';
import {
  buildCanonicalDocsPath,
  buildDocsContentPath,
  buildDocsRouteVariants,
} from '../shared/docsRouting.js';
import { getDefaultDocumentPath } from '../shared/seo.js';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const distDocsContentDir = join(distDir, 'docs-content');
const distDocsIndexPath = join(distDir, 'docs-index.json');
const distHeadersPath = join(distDir, '_headers');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function toDistHtmlPath(routePath) {
  if (routePath === '/') {
    return join(distDir, 'index.html');
  }

  if (routePath.endsWith('.html')) {
    return join(distDir, routePath.replace(/^\//, ''));
  }

  return join(distDir, routePath.replace(/^\//, ''), 'index.html');
}

function ensureRouteHtml(routePath) {
  const filePath = toDistHtmlPath(routePath);
  assert(existsSync(filePath), `Missing generated route HTML: ${routePath}`);
  return readText(filePath);
}

function main() {
  assert(existsSync(distDir), 'Missing dist/ output. Run `npm run build` first.');
  assert(existsSync(distDocsIndexPath), 'Missing dist/docs-index.json.');
  assert(existsSync(join(distDir, 'robots.txt')), 'Missing dist/robots.txt.');
  assert(existsSync(join(distDir, 'sitemap.xml')), 'Missing dist/sitemap.xml.');
  assert(existsSync(join(distDir, 'llms', 'index.html')), 'Missing dist/llms/index.html.');
  assert(existsSync(join(distDir, '404.html')), 'Missing dist/404.html.');
  assert(existsSync(distHeadersPath), 'Missing dist/_headers.');

  const indexHtml = ensureRouteHtml('/');
  assert(indexHtml.includes('/js/theme-init.js'), 'index.html is missing the local theme init script.');
  assert(!indexHtml.includes('code.iconify.design'), 'index.html still references the external Iconify CDN.');

  const headers = readText(distHeadersPath);
  assert(headers.includes("script-src 'self'"), 'CSP is missing self-only script-src.');

  const docsIndex = JSON.parse(readText(distDocsIndexPath));
  const defaultDocPath = getDefaultDocumentPath(documentationTree);
  assert(defaultDocPath, 'Could not resolve the default documentation path.');
  assert(docsIndex.paths.includes(defaultDocPath), 'Default documentation path is missing from docs-index.json.');

  for (const routePath of buildDocsRouteVariants('')) {
    ensureRouteHtml(routePath);
  }

  for (const routePath of buildDocsRouteVariants(defaultDocPath)) {
    const html = ensureRouteHtml(routePath);
    assert(
      html.includes(`<link rel="canonical" href="${buildCanonicalDocsPath(defaultDocPath)}" />`),
      `Canonical tag mismatch for ${routePath}.`
    );
  }

  const sampleDocPath = docsIndex.paths.find((path) => path !== 'llms') || defaultDocPath;
  const sampleDocJsonPath = join(distDocsContentDir, `${buildDocsContentPath(sampleDocPath)}.json`);
  assert(existsSync(sampleDocJsonPath), `Missing generated docs JSON for ${sampleDocPath}.`);
  const sampleDocument = JSON.parse(readText(sampleDocJsonPath));
  assert(typeof sampleDocument.sourcePath === 'string', 'Generated docs JSON is missing sourcePath metadata.');

  console.log('Release smoke checks passed.');
}

main();