import { openapiConfig } from '../shared/documentation-config.js';
import { buildDocsRouteVariants } from '../shared/docsRouting.js';
import { buildOpenApiRoutePath } from '../shared/openapiRouting.js';

const host = String(process.env.PAPERS_DEPLOY_HOST || '').replace(/\/+$/, '');
const expectedRevision = process.env.GITHUB_SHA || process.env.SOURCE_COMMIT || '';

if (!host) {
  throw new Error('PAPERS_DEPLOY_HOST is required for post-deploy verification.');
}

if (!expectedRevision) {
  throw new Error('GITHUB_SHA or SOURCE_COMMIT is required for post-deploy verification.');
}

let hostUrl;
try {
  hostUrl = new URL(host);
} catch {
  throw new Error('PAPERS_DEPLOY_HOST must be a valid HTTPS origin.');
}

if (
  hostUrl.protocol !== 'https:' ||
  hostUrl.username ||
  hostUrl.password ||
  hostUrl.search ||
  hostUrl.hash
) {
  throw new Error(
    'PAPERS_DEPLOY_HOST must be an HTTPS origin without credentials, query, or hash.'
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchWithRetry(path, attempts = 5) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(host + path, {
        headers: {
          'cache-control': 'no-cache',
        },
      });
      const body = await response.text();

      if (!response.ok) {
        throw new Error(path + ' returned ' + response.status + '.');
      }

      return { body, headers: response.headers };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError;
}

async function main() {
  const manifestResponse = await fetchWithRetry('/build-manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(manifestResponse.body);
  } catch {
    throw new Error('Deployed build manifest is not valid JSON.');
  }

  assert(
    manifest.sourceRevision === expectedRevision,
    'Deployed build revision ' +
      (manifest.sourceRevision || 'missing') +
      ' does not match ' +
      expectedRevision +
      '.'
  );
  assert(manifest.buildMode === 'production', 'Deployed artifact is not a production build.');
  assert(
    typeof manifest.siteName === 'string' && manifest.siteName,
    'Deployed build identity is missing siteName.'
  );
  assert(
    typeof manifest.defaultDocumentPath === 'string' && manifest.defaultDocumentPath,
    'Deployed build identity is missing defaultDocumentPath.'
  );

  const home = await fetchWithRetry('/');
  const requiredHeaders = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
  };

  for (const [name, expected] of Object.entries(requiredHeaders)) {
    assert(
      home.headers.get(name)?.toLowerCase() === expected.toLowerCase(),
      'Home response is missing ' + name + ' ' + expected + '.'
    );
  }

  assert(
    home.headers.get('x-xss-protection') === null,
    'Home response still emits the legacy X-XSS-Protection header.'
  );
  assert(
    home.headers.get('content-security-policy')?.includes("script-src 'self'"),
    'Home response is missing the self-only script policy.'
  );
  assert(
    home.body.includes(manifest.siteName),
    'Home response does not contain the deployed site name.'
  );
  if (manifest.siteUrl) {
    assert(
      home.body.includes(manifest.siteUrl),
      'Home response does not contain the configured canonical site URL.'
    );
  }
  if (manifest.githubUrl) {
    assert(
      home.body.includes(manifest.githubUrl),
      'Home response does not contain the configured GitHub URL.'
    );
  }

  const docsIndexResponse = await fetchWithRetry('/docs-index.json');
  let docsIndex;
  try {
    docsIndex = JSON.parse(docsIndexResponse.body);
  } catch {
    throw new Error('Deployed docs index is not valid JSON.');
  }
  assert(
    Array.isArray(docsIndex.paths) && docsIndex.paths.includes(manifest.defaultDocumentPath),
    'Deployed docs index does not contain the build default document path.'
  );

  const docsLanding = await fetchWithRetry('/docs');
  const deepDocs = await fetchWithRetry(buildDocsRouteVariants(manifest.defaultDocumentPath)[0]);
  assert(
    docsLanding.headers.get('content-type')?.includes('text/html'),
    'Documentation landing response is not HTML.'
  );
  assert(
    deepDocs.headers.get('content-type')?.includes('text/html'),
    'Deep documentation response is not HTML.'
  );
  await fetchWithRetry('/robots.txt');
  await fetchWithRetry('/sitemap.xml');
  await fetchWithRetry('/llms.txt');

  if (openapiConfig.enabled) {
    await fetchWithRetry(
      buildOpenApiRoutePath(
        openapiConfig,
        openapiConfig.defaultSpecId === openapiConfig.specs[0]?.id
          ? null
          : openapiConfig.defaultSpecId
      )
    );
  }

  console.log('Post-deploy smoke checks passed for ' + host + ' at ' + expectedRevision + '.');
}

main().catch((error) => {
  console.error('Post-deploy smoke checks failed: ' + error.message);
  process.exit(1);
});
