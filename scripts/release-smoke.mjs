import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

import { documentationTree, openapiConfig } from '../shared/documentation-config.js';
import {
  buildCanonicalDocsPath,
  buildDocsContentPath,
  buildDocsRouteVariants,
} from '../shared/docsRouting.js';
import {
  AGENT_ARTIFACTS,
  AGENT_DISCOVERY_PATH,
  buildAbsoluteUrl,
  getDefaultDocumentPath,
  normalizeSiteUrl,
} from '../shared/seo.js';
import { buildOpenApiRoutePath } from '../shared/openapiRouting.js';
import { assertValidOpenApiConfig, normalizeLocalOpenApiPath } from '../shared/openapiSpecUrls.js';
import { assertBuildManifest } from './lib/buildIdentity.mjs';
import { routeHtmlPath } from './lib/routeHtmlPaths.mjs';
import { docsBasePath, withDocsBasePath } from '../shared/docsBasePath.js';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const distDocsContentDir = join(distDir, 'docs-content');
const distDocsIndexPath = join(distDir, 'docs-index.json');
const distDocsCollectionPath = join(distDir, 'docs-collection.json');
const distDocsReferencesPath = join(distDir, 'docs-references.json');
const distOpenApiArtifactsPath = join(distDir, 'openapi-artifacts.json');
const distAgentManifestPath = join(distDir, 'agents.json');
const distHeadersPath = join(distDir, '_headers');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function collectHtmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectHtmlFiles(filePath);
    }

    return entry.isFile() && entry.name.endsWith('.html') ? [filePath] : [];
  });
}

function countOccurrences(value, needle) {
  return value.split(needle).length - 1;
}

function toDistHtmlPath(routePath) {
  return routeHtmlPath(routePath, distDir);
}

function ensureRouteHtml(routePath) {
  const filePath = toDistHtmlPath(routePath);
  assert(existsSync(filePath), `Missing generated route HTML: ${routePath}`);
  return readText(filePath);
}

function getOpenApiRouteHtmlPaths(openapiArtifacts) {
  const routeHtmlPaths = new Set();

  for (const spec of openapiConfig.specs) {
    const overviewRoutePath = buildOpenApiRoutePath(
      openapiConfig,
      spec.id === openapiConfig.defaultSpecId ? null : spec.id
    );
    routeHtmlPaths.add(routeHtmlPath(overviewRoutePath, distDir));

    const artifact = openapiArtifacts?.specs?.find((candidate) => candidate.id === spec.id);
    for (const route of [...(artifact?.operations || []), ...(artifact?.schemas || [])]) {
      if (route.routePath) {
        routeHtmlPaths.add(routeHtmlPath(route.routePath, distDir));
      }
    }
  }

  return routeHtmlPaths;
}

function main() {
  assertValidOpenApiConfig(openapiConfig);
  const manifest = assertBuildManifest(distDir, { expectedBuildMode: 'production' });
  assert(existsSync(distDir), 'Missing dist/ output. Run `npm run build` first.');
  assert(existsSync(distDocsIndexPath), 'Missing dist/docs-index.json.');
  assert(existsSync(distDocsCollectionPath), 'Missing dist/docs-collection.json.');
  assert(existsSync(distDocsReferencesPath), 'Missing dist/docs-references.json.');
  assert(existsSync(distOpenApiArtifactsPath), 'Missing dist/openapi-artifacts.json.');
  assert(existsSync(distAgentManifestPath), 'Missing dist/agents.json.');
  assert(existsSync(join(distDir, 'robots.txt')), 'Missing dist/robots.txt.');
  assert(existsSync(join(distDir, 'sitemap.xml')), 'Missing dist/sitemap.xml.');
  assert(existsSync(join(distDir, 'rss.xml')), 'Missing dist/rss.xml.');
  assert(
    readText(join(distDir, 'rss.xml')).includes('<item>'),
    'dist/rss.xml has no items; check dist/docs-last-updated.json.'
  );
  assert(existsSync(join(distDir, 'llms.html')), 'Missing dist/llms.html.');
  assert(existsSync(join(distDir, 'skill.html')), 'Missing dist/skill.html.');
  assert(existsSync(join(distDir, '404.html')), 'Missing dist/404.html.');
  assert(existsSync(distHeadersPath), 'Missing dist/_headers.');
  assert(existsSync(join(distDir, 'pagefind')), 'Missing dist/pagefind/.');
  if (process.env.REQUIRE_SITE_URL === 'true') {
    assert(
      normalizeSiteUrl(manifest.siteUrl),
      'Production release metadata requires a valid VITE_SITE_URL.'
    );
    assert(
      /<loc>https?:\/\//.test(readText(join(distDir, 'sitemap.xml'))),
      'Production release sitemap is empty; provide a valid VITE_SITE_URL.'
    );
  }
  const assetFiles = readdirSync(join(distDir, 'assets'));
  const openApiPageAsset = assetFiles.find((fileName) => /^OpenApiPage-[^/]+\.js$/.test(fileName));
  const openApiReferenceAsset = assetFiles.find((fileName) =>
    /^OpenApiReference-[^/]+\.js$/.test(fileName)
  );
  const scalarAsset = assetFiles.find((fileName) => /^esm-[^/]+\.js$/.test(fileName));
  assert(
    openApiPageAsset && openApiReferenceAsset && scalarAsset,
    'Missing the route-lazy OpenAPI, OpenAPI reference, or standalone Scalar chunk.'
  );
  assert(
    statSync(join(distDir, 'openapi-artifacts.json')).size <= 1_000_000,
    'Generated OpenAPI artifact exceeds the 1 MB release budget.'
  );
  assert(
    statSync(join(distDir, 'assets', scalarAsset)).size <= 3_000_000,
    'Standalone Scalar route asset exceeds the 3 MB release budget.'
  );
  const openapiArtifacts = JSON.parse(readText(distOpenApiArtifactsPath));
  const openApiRouteHtmlPaths = getOpenApiRouteHtmlPaths(openapiArtifacts);
  const canonicalUrl = (path) => buildAbsoluteUrl(path, manifest.siteUrl || '');
  const agentDiscoveryHref = canonicalUrl(AGENT_DISCOVERY_PATH);
  const openApiPageSource = readText(join(distDir, 'assets', openApiPageAsset));
  const openApiReferenceSource = readText(join(distDir, 'assets', openApiReferenceAsset));
  assert(
    openApiPageSource.includes(openApiReferenceAsset),
    'OpenAPI route does not reference its route-lazy reference chunk.'
  );
  assert(
    openApiReferenceSource.includes(scalarAsset),
    'Route-lazy OpenAPI reference does not reference the standalone Scalar chunk.'
  );

  const indexHtml = ensureRouteHtml('/');
  assert(
    indexHtml.includes('/js/theme-init.js'),
    'index.html is missing the local theme init script.'
  );
  assert(
    !indexHtml.includes('code.iconify.design'),
    'index.html still references the external Iconify CDN.'
  );
  assert(
    !indexHtml.includes('vendor-openapi-'),
    'index.html eagerly references the OpenAPI vendor chunk.'
  );
  assert(
    !indexHtml.includes(scalarAsset),
    'index.html eagerly references the standalone Scalar chunk.'
  );
  assert(
    indexHtml.includes('<script type="application/ld+json">'),
    'index.html is missing JSON-LD structured data.'
  );
  assert(
    indexHtml.includes(`href="${agentDiscoveryHref}"`),
    'index.html is missing the agent discovery alternate link.'
  );

  for (const htmlPath of collectHtmlFiles(distDir)) {
    const html = readText(htmlPath);
    assert(
      !html.includes(openApiReferenceAsset),
      `${htmlPath} eagerly references the route-lazy OpenAPI reference asset ${openApiReferenceAsset}.`
    );
    assert(
      !html.includes(scalarAsset),
      `${htmlPath} eagerly references the standalone Scalar asset ${scalarAsset}.`
    );
    if (!openApiRouteHtmlPaths.has(htmlPath)) {
      assert(
        !html.includes(openApiPageAsset),
        `${htmlPath} eagerly references the OpenAPI page asset ${openApiPageAsset}.`
      );
    }
    assert(
      countOccurrences(html, '<link rel="canonical"') === 1,
      `${htmlPath} must contain exactly one canonical link.`
    );
    assert(
      countOccurrences(html, '<script type="application/ld+json">') === 1,
      `${htmlPath} must contain exactly one JSON-LD block.`
    );
    assert(
      countOccurrences(html, `href="${agentDiscoveryHref}"`) === 1,
      `${htmlPath} must contain exactly one agent discovery link.`
    );
    assert(
      html.includes('property="og:image:alt"') && html.includes('name="twitter:image:alt"'),
      `${htmlPath} is missing social image alt metadata.`
    );
    for (const artifact of AGENT_ARTIFACTS) {
      assert(
        html.includes(`href="${canonicalUrl(artifact.path)}"`),
        `${htmlPath} is missing the ${artifact.path} alternate link.`
      );
    }
  }

  const headers = readText(distHeadersPath);
  assert(headers.includes("script-src 'self'"), 'CSP is missing self-only script-src.');
  // Pagefind needs WebAssembly, and the CSP font-src does not allow data: fonts.
  assert(headers.includes("'wasm-unsafe-eval'"), 'CSP blocks Pagefind WebAssembly search.');
  for (const name of readdirSync(join(distDir, 'assets')).filter((file) => file.endsWith('.css'))) {
    assert(
      !readText(join(distDir, 'assets', name)).includes('data:font/'),
      `dist/assets/${name} inlines a data: font that the CSP font-src blocks.`
    );
  }

  const docsIndex = JSON.parse(readText(distDocsIndexPath));
  const docsCollection = JSON.parse(readText(distDocsCollectionPath));
  const docsReferences = JSON.parse(readText(distDocsReferencesPath));
  const agentManifest = JSON.parse(readText(distAgentManifestPath));
  assert(
    docsCollection.schemaVersion === 1,
    'Typed docs collection manifest has an invalid schema version.'
  );
  assert(
    Array.isArray(docsCollection.entries),
    'Typed docs collection manifest is missing entries.'
  );
  assert(docsReferences.schemaVersion === 1, 'Docs reference graph has an invalid schema version.');
  assert(Array.isArray(docsReferences.edges), 'Docs reference graph is missing edges.');
  assert(
    openapiArtifacts.schemaVersion === 1,
    'OpenAPI artifact manifest has an invalid schema version.'
  );
  assert(
    openapiArtifacts.contractVersion === 2,
    'OpenAPI artifact manifest has an invalid contract version.'
  );
  assert(Array.isArray(openapiArtifacts.specs), 'OpenAPI artifact manifest is missing specs.');
  assert(
    agentManifest.schemaVersion === 1,
    'Agent discovery manifest has an invalid schema version.'
  );
  assert(
    agentManifest.kind === 'documentation-agent-index',
    'Agent discovery manifest has an invalid kind.'
  );
  assert(Array.isArray(agentManifest.artifacts), 'Agent discovery manifest is missing artifacts.');
  for (const expectedArtifact of AGENT_ARTIFACTS) {
    const actualArtifact = agentManifest.artifacts.find(
      (artifact) => artifact.id === expectedArtifact.id
    );
    assert(actualArtifact, 'Agent discovery manifest is missing ' + expectedArtifact.path + '.');
    assert(
      actualArtifact.path === expectedArtifact.path &&
        actualArtifact.contentType === expectedArtifact.contentType &&
        actualArtifact.href === canonicalUrl(expectedArtifact.path),
      'Agent discovery manifest has an invalid entry for ' + expectedArtifact.path + '.'
    );
  }
  const defaultDocPath = getDefaultDocumentPath(documentationTree);
  assert(defaultDocPath, 'Could not resolve the default documentation path.');
  assert(
    docsIndex.paths.includes(defaultDocPath),
    'Default documentation path is missing from docs-index.json.'
  );

  for (const routePath of buildDocsRouteVariants('')) {
    ensureRouteHtml(routePath);
  }

  for (const routePath of buildDocsRouteVariants(defaultDocPath)) {
    const html = ensureRouteHtml(routePath);
    assert(
      html.includes(
        `<link rel="canonical" href="${canonicalUrl(buildCanonicalDocsPath(defaultDocPath))}" />`
      ),
      `Canonical tag mismatch for ${routePath}.`
    );
  }

  // In root mode ('' base path) '/' is the homepage, so there is no docs alias.
  if (docsBasePath) {
    const defaultDocsHtml = ensureRouteHtml(docsBasePath);
    assert(
      defaultDocsHtml.includes(
        `<link rel="canonical" href="${canonicalUrl(buildCanonicalDocsPath(defaultDocPath))}" />`
      ),
      `Canonical tag mismatch for ${docsBasePath}.`
    );
  }

  for (const routePath of [withDocsBasePath('llms'), withDocsBasePath('skill')]) {
    ensureRouteHtml(routePath);
  }

  for (const spec of openapiConfig.specs) {
    const routePath = buildOpenApiRoutePath(
      openapiConfig,
      spec.id === openapiConfig.defaultSpecId ? null : spec.id
    );
    const html = ensureRouteHtml(routePath);
    assert(
      html.includes(`<link rel="canonical" href="${canonicalUrl(routePath)}" />`),
      `Canonical tag mismatch for OpenAPI route ${routePath}.`
    );
    assert(
      html.includes('<script type="application/ld+json">'),
      `Structured data missing for ${routePath}.`
    );

    if (spec.url.startsWith('/')) {
      assert(
        existsSync(join(distDir, normalizeLocalOpenApiPath(spec.url).replace(/^\/+/, ''))),
        `Missing OpenAPI asset: ${spec.url}`
      );
    }

    const artifact = openapiArtifacts.specs.find((candidate) => candidate.id === spec.id);
    assert(artifact, `Missing OpenAPI artifact for spec ${spec.id}.`);
    for (const route of [
      ...(artifact.operations || []).map((operation) => operation.routePath),
      ...(artifact.schemas || []).map((model) => model.routePath),
    ]) {
      const routeHtml = ensureRouteHtml(route);
      assert(
        routeHtml.includes(`<link rel="canonical" href="${canonicalUrl(route)}" />`),
        `Canonical tag mismatch for generated OpenAPI route ${route}.`
      );
      if (manifest.siteUrl) {
        assert(
          readText(join(distDir, 'sitemap.xml')).includes(canonicalUrl(route)),
          `Generated OpenAPI route is missing from the sitemap: ${route}`
        );
      }
    }
  }

  const sampleDocPath = docsIndex.paths.find((path) => path !== 'llms') || defaultDocPath;
  const sampleDocJsonPath = join(distDocsContentDir, `${buildDocsContentPath(sampleDocPath)}.json`);
  assert(existsSync(sampleDocJsonPath), `Missing generated docs JSON for ${sampleDocPath}.`);
  const sampleDocument = JSON.parse(readText(sampleDocJsonPath));
  assert(
    typeof sampleDocument.sourcePath === 'string',
    'Generated docs JSON is missing sourcePath metadata.'
  );

  console.log('Release smoke checks passed.');
}

main();
