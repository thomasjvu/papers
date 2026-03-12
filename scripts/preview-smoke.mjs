import { createServer } from 'http';
import { existsSync, readFileSync, statSync } from 'fs';
import { join, extname, normalize } from 'path';

import { documentationTree } from '../shared/documentation-config.js';
import {
  buildCanonicalDocsPath,
  buildDocsContentPath,
  buildDocsRouteVariants,
} from '../shared/docsRouting.js';
import { getDefaultDocumentPath } from '../shared/seo.js';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const host = '127.0.0.1';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function getContentType(filePath) {
  const extension = extname(filePath).toLowerCase();

  switch (extension) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
    case '.mjs':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
    case '.pf_meta':
      return 'application/json; charset=utf-8';
    case '.txt':
      return 'text/plain; charset=utf-8';
    case '.xml':
      return 'application/xml; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.wasm':
    case '.pagefind':
      return 'application/wasm';
    default:
      return 'application/octet-stream';
  }
}

function resolveDistFile(pathname) {
  const normalizedPathname = normalize(decodeURIComponent(pathname)).replace(/^\\+/, '');
  const relativePath = normalizedPathname.replace(/^([/\\])+/, '');
  const directFilePath = join(distDir, relativePath);

  if (existsSync(directFilePath) && statSync(directFilePath).isFile()) {
    return directFilePath;
  }

  const indexFilePath = join(distDir, relativePath, 'index.html');
  if (existsSync(indexFilePath) && statSync(indexFilePath).isFile()) {
    return indexFilePath;
  }

  if (!extname(relativePath)) {
    const htmlFilePath = join(distDir, `${relativePath}.html`);
    if (existsSync(htmlFilePath) && statSync(htmlFilePath).isFile()) {
      return htmlFilePath;
    }
  }

  return null;
}

async function withStaticPreviewServer(run) {
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
    const targetPath = requestUrl.pathname === '/' ? join(distDir, 'index.html') : resolveDistFile(requestUrl.pathname);

    if (!targetPath) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': getContentType(targetPath),
      'Cache-Control': 'no-store',
    });
    response.end(readFileSync(targetPath));
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, host, resolve);
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : null;
  assert(port, 'Could not determine the preview server port.');

  try {
    await run(`http://${host}:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

async function fetchText(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.text();

  assert(response.ok, `Expected ${path} to return 200, received ${response.status}.`);

  return {
    body,
    headers: response.headers,
  };
}

function extractAssetPaths(html) {
  const scriptMatch = html.match(/<script[^>]+src="([^"]*assets\/[^"]+\.js)"/i);
  const stylesheetMatch = html.match(/<link[^>]+href="([^"]*assets\/[^"]+\.css)"/i);

  return {
    scriptPath: scriptMatch?.[1] || null,
    stylesheetPath: stylesheetMatch?.[1] || null,
  };
}

async function main() {
  assert(existsSync(distDir), 'Missing dist/ output. Run `npm run build` first.');

  const docsIndex = JSON.parse(readText(join(distDir, 'docs-index.json')));
  const defaultDocPath = getDefaultDocumentPath(documentationTree);
  const sampleDocPath = docsIndex.paths.find((path) => path !== 'llms') || defaultDocPath;

  assert(defaultDocPath, 'Could not resolve the default documentation path.');
  assert(sampleDocPath, 'Could not resolve a sample documentation path.');

  await withStaticPreviewServer(async (baseUrl) => {
    const home = await fetchText(baseUrl, '/');
    assert(home.body.includes('/js/theme-init.js'), 'Homepage is missing the local theme init script.');

    const { scriptPath, stylesheetPath } = extractAssetPaths(home.body);
    assert(scriptPath, 'Could not locate the built JavaScript asset in the homepage HTML.');
    assert(stylesheetPath, 'Could not locate the built CSS asset in the homepage HTML.');

    await fetchText(baseUrl, scriptPath);
    await fetchText(baseUrl, stylesheetPath);

    const docsAlias = await fetchText(baseUrl, '/docs');
    assert(
      docsAlias.body.includes(
        `<link rel="canonical" href="${buildCanonicalDocsPath(defaultDocPath)}" />`
      ),
      'Docs landing route is missing the expected canonical tag.'
    );

    for (const routePath of buildDocsRouteVariants(sampleDocPath)) {
      const routeHtml = await fetchText(baseUrl, routePath);
      assert(
        routeHtml.body.includes(
          `<link rel="canonical" href="${buildCanonicalDocsPath(sampleDocPath)}" />`
        ),
        `Served route ${routePath} is missing the expected canonical tag.`
      );
    }

    const llmsRoute = await fetchText(baseUrl, '/llms');
    assert(llmsRoute.body.includes('<title>LLMs.txt |'), 'Served /llms route has unexpected metadata.');

    await fetchText(baseUrl, '/llms.txt');
    await fetchText(baseUrl, '/robots.txt');
    await fetchText(baseUrl, '/sitemap.xml');
    await fetchText(baseUrl, '/docs-index.json');
    await fetchText(baseUrl, `/docs-content/${buildDocsContentPath(sampleDocPath)}.json`);
    await fetchText(baseUrl, '/pagefind/pagefind.js');
  });

  console.log('Preview smoke checks passed.');
}

main().catch((error) => {
  console.error('Preview smoke checks failed:', error);
  process.exit(1);
});