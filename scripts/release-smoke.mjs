import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { documentationTree, openapiConfig } from '../shared/documentation-config.js';
import {
  buildCanonicalDocsPath,
  buildDocsContentPath,
  buildDocsRouteVariants,
} from '../shared/docsRouting.js';
import { getDefaultDocumentPath } from '../shared/seo.js';
import { buildOpenApiRoutePath } from '../shared/openapiRouting.js';
import { assertValidOpenApiConfig, normalizeLocalOpenApiPath } from '../shared/openapiSpecUrls.js';
import { assertBuildManifest } from './lib/buildIdentity.mjs';
import { routeHtmlPath } from './lib/routeHtmlPaths.mjs';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const distDocsContentDir = join(distDir, 'docs-content');
const distDocsIndexPath = join(distDir, 'docs-index.json');
const distDocsCollectionPath = join(distDir, 'docs-collection.json');
const distDocsReferencesPath = join(distDir, 'docs-references.json');
const distOpenApiArtifactsPath = join(distDir, 'openapi-artifacts.json');
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
  return routeHtmlPath(routePath, distDir);
}

function ensureRouteHtml(routePath) {
  const filePath = toDistHtmlPath(routePath);
  assert(existsSync(filePath), `Missing generated route HTML: ${routePath}`);
  return readText(filePath);
}

function main() {
  assertValidOpenApiConfig(openapiConfig);
  assertBuildManifest(distDir, { expectedBuildMode: 'production' });
  assert(existsSync(distDir), 'Missing dist/ output. Run `npm run build` first.');
  assert(existsSync(distDocsIndexPath), 'Missing dist/docs-index.json.');
  assert(existsSync(distDocsCollectionPath), 'Missing dist/docs-collection.json.');
  assert(existsSync(distDocsReferencesPath), 'Missing dist/docs-references.json.');
  assert(existsSync(distOpenApiArtifactsPath), 'Missing dist/openapi-artifacts.json.');
  assert(existsSync(join(distDir, 'robots.txt')), 'Missing dist/robots.txt.');
  assert(existsSync(join(distDir, 'sitemap.xml')), 'Missing dist/sitemap.xml.');
  assert(existsSync(join(distDir, 'llms.html')), 'Missing dist/llms.html.');
  assert(existsSync(join(distDir, 'skill.html')), 'Missing dist/skill.html.');
  assert(existsSync(join(distDir, '404.html')), 'Missing dist/404.html.');
  assert(existsSync(distHeadersPath), 'Missing dist/_headers.');
  assert(existsSync(join(distDir, 'pagefind')), 'Missing dist/pagefind/.');

  const indexHtml = ensureRouteHtml('/');
  assert(indexHtml.includes('/js/theme-init.js'), 'index.html is missing the local theme init script.');
  assert(!indexHtml.includes('code.iconify.design'), 'index.html still references the external Iconify CDN.');

  const headers = readText(distHeadersPath);
  assert(headers.includes("script-src 'self'"), 'CSP is missing self-only script-src.');

  const docsIndex = JSON.parse(readText(distDocsIndexPath));
  const docsCollection = JSON.parse(readText(distDocsCollectionPath));
  const docsReferences = JSON.parse(readText(distDocsReferencesPath));
  const openapiArtifacts = JSON.parse(readText(distOpenApiArtifactsPath));
  assert(docsCollection.schemaVersion === 1, 'Typed docs collection manifest has an invalid schema version.');
  assert(Array.isArray(docsCollection.entries), 'Typed docs collection manifest is missing entries.');
  assert(docsReferences.schemaVersion === 1, 'Docs reference graph has an invalid schema version.');
  assert(Array.isArray(docsReferences.edges), 'Docs reference graph is missing edges.');
  assert(openapiArtifacts.schemaVersion === 1, 'OpenAPI artifact manifest has an invalid schema version.');
  assert(Array.isArray(openapiArtifacts.specs), 'OpenAPI artifact manifest is missing specs.');
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

  const defaultDocsHtml = ensureRouteHtml('/docs');
  assert(
    defaultDocsHtml.includes(
      `<link rel="canonical" href="${buildCanonicalDocsPath(defaultDocPath)}" />`
    ),
    'Canonical tag mismatch for /docs.'
  );

  for (const routePath of ['/docs/llms', '/docs/skill']) {
    ensureRouteHtml(routePath);
  }

  for (const spec of openapiConfig.specs) {
    const routePath = buildOpenApiRoutePath(
      openapiConfig,
      spec.id === openapiConfig.defaultSpecId ? null : spec.id
    );
    const html = ensureRouteHtml(routePath);
    assert(
      html.includes(`<link rel="canonical" href="${routePath}" />`),
      `Canonical tag mismatch for OpenAPI route ${routePath}.`
    );

    if (spec.url.startsWith('/')) {
      assert(
        existsSync(join(distDir, normalizeLocalOpenApiPath(spec.url).replace(/^\/+/, ''))),
        `Missing OpenAPI asset: ${spec.url}`
      );
    }
  }

  const sampleDocPath = docsIndex.paths.find((path) => path !== 'llms') || defaultDocPath;
  const sampleDocJsonPath = join(distDocsContentDir, `${buildDocsContentPath(sampleDocPath)}.json`);
  assert(existsSync(sampleDocJsonPath), `Missing generated docs JSON for ${sampleDocPath}.`);
  const sampleDocument = JSON.parse(readText(sampleDocJsonPath));
  assert(typeof sampleDocument.sourcePath === 'string', 'Generated docs JSON is missing sourcePath metadata.');

  console.log('Release smoke checks passed.');
}

main();
