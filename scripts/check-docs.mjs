import { existsSync, readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

import { documentationTree, homepageConfig } from '../shared/documentation-config.js';
import { buildDocsContentPath } from '../shared/docsRouting.js';
import { getDirectoryAliasEntries } from '../shared/seo.js';
import { serializeArtifactJson } from './lib/docsArtifacts.mjs';
import { createGeneratedDocsArtifacts } from './lib/docsGeneration.mjs';
import {
  GENERATED_DOCS_SOURCE_ENV,
  diffMarkdownFileMaps,
  getGeneratedDocsSourceDir,
  readMarkdownFileMap,
} from './lib/generatedDocsSync.mjs';
import { createLlmsArtifacts } from './lib/llmsArtifacts.mjs';
import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import {
  createDefaultSocialImageManifest,
  createRobotsTxt,
  createSeoRouteEntries,
  createSitemapXml,
} from './lib/seoArtifacts.mjs';

const rootDir = process.cwd();
const publicDir = join(rootDir, 'public');
const docsContentDir = join(publicDir, 'docs-content');
const docsIndexPath = join(publicDir, 'docs-index.json');
const generatedDocsDir = join(rootDir, 'src', 'docs', 'content', 'generated');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readFileText(filePath) {
  return readFileSync(filePath, 'utf8');
}

async function listJsonFiles(dir, prefix = '') {
  if (!existsSync(dir)) {
    return [];
  }

  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listJsonFiles(absolutePath, relativePath)));
      continue;
    }

    if (entry.name.endsWith('.json')) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

function collectLikelyDocsRouteTypos(documentationTree) {
  const docRoots = new Set();

  for (const item of documentationTree) {
    const [firstSegment] = String(item.path || '').split('/').filter(Boolean);
    if (firstSegment) {
      docRoots.add(firstSegment);
    }
  }

  return Array.from(docRoots).sort();
}

function collectTreeSourcePaths(items, paths = []) {
  for (const item of items) {
    if (item.type === 'file') {
      paths.push(join(rootDir, 'src', 'docs', 'content', `${item.path}.md`));
      paths.push(join(rootDir, 'src', 'docs', 'content', `${item.path}.mdx`));
      continue;
    }

    if (item.type === 'directory' && item.children) {
      collectTreeSourcePaths(item.children, paths);
    }
  }

  return paths;
}

function checkAbsoluteDocsLinks(documentationTree) {
  const suspiciousRoots = collectLikelyDocsRouteTypos(documentationTree);
  const pattern = new RegExp(`\\]\\(/(${suspiciousRoots.join('|')})(?:/|\\)|#)`, 'g');
  const problems = [];

  for (const candidate of collectTreeSourcePaths(documentationTree)) {
    if (!existsSync(candidate)) {
      continue;
    }

    const content = readFileText(candidate);
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        problems.push(`${candidate}:${index + 1} uses a docs-like absolute link without /docs`);
      }
      pattern.lastIndex = 0;
    });
  }

  return problems;
}

async function main() {
  assert(existsSync(docsIndexPath), 'Missing public/docs-index.json. Run `npm run build` or the generators first.');
  assert(existsSync(docsContentDir), 'Missing public/docs-content/. Run `npm run build` or the generators first.');

  const existingIndex = JSON.parse(readFileText(docsIndexPath));
  const { documents, index } = await createGeneratedDocsArtifacts({
    documentationTree,
    previousIndex: existingIndex,
    rootDir,
  });

  const expectedIndex = serializeArtifactJson(index);
  const actualIndex = readFileText(docsIndexPath);
  assert(actualIndex === expectedIndex, 'public/docs-index.json is out of date. Run `npm run generate:docs`.');

  const expectedDocumentKeys = Object.keys(documents).sort();
  const actualDocumentFiles = await listJsonFiles(docsContentDir);
  const actualDocumentKeys = actualDocumentFiles.map((filePath) => filePath.replace(/\.json$/, ''));
  const extraDocumentKeys = actualDocumentKeys.filter((key) => !expectedDocumentKeys.includes(key));
  const missingDocumentKeys = expectedDocumentKeys.filter((key) => !actualDocumentKeys.includes(key));

  assert(
    missingDocumentKeys.length === 0,
    `public/docs-content is missing generated docs: ${missingDocumentKeys.join(', ')}.`
  );
  assert(
    extraDocumentKeys.length === 0,
    `public/docs-content has stale generated docs: ${extraDocumentKeys.join(', ')}.`
  );

  for (const [documentKey, document] of Object.entries(documents)) {
    const filePath = join(docsContentDir, `${documentKey}.json`);
    const expectedDocument = serializeArtifactJson(document);
    const actualDocument = readFileText(filePath);
    assert(
      actualDocument === expectedDocument,
      `${filePath} is out of date. Run \`npm run generate:docs\`.`
    );
  }

  const { llmsTxt, llmsFullTxt } = createLlmsArtifacts({
    documentationTree,
    homepageConfig,
    rootDir,
  });

  assert(
    readFileText(join(publicDir, 'llms.txt')) === llmsTxt,
    'public/llms.txt is out of date. Run `npm run generate:llms`.'
  );
  assert(
    readFileText(join(publicDir, 'llms-full.txt')) === llmsFullTxt,
    'public/llms-full.txt is out of date. Run `npm run generate:llms`.'
  );

  const mode = resolveEnvMode('production');
  const viteEnv = loadViteEnv(rootDir, mode);
  const siteName = viteEnv.VITE_SITE_NAME || homepageConfig.hero?.title || 'Phantasy Docs';
  const siteUrl = viteEnv.VITE_SITE_URL || '';
  const siteSubtitle = homepageConfig.hero?.subtitle || 'Documentation';
  const siteDescription = homepageConfig.hero?.description || '';
  const routeEntries = createSeoRouteEntries(index, documents, {
    siteName,
    siteSubtitle,
    siteDescription,
  });
  const socialImages = createDefaultSocialImageManifest({
    siteName,
    siteSubtitle,
    siteDescription,
  });

  assert(
    readFileText(join(publicDir, 'robots.txt')) === `${createRobotsTxt(siteUrl)}\n`,
    'public/robots.txt is out of date. Run `npm run generate:seo`.'
  );
  assert(
    readFileText(join(publicDir, 'sitemap.xml')) === `${createSitemapXml(routeEntries, siteUrl)}\n`,
    'public/sitemap.xml is out of date. Run `npm run generate:seo`.'
  );
  assert(
    readFileText(join(publicDir, socialImages.ogImagePath.replace(/^\//, ''))) ===
      `${socialImages.ogImageContent}\n`,
    `public${socialImages.ogImagePath} is out of date. Run \`npm run generate:seo\`.`
  );
  assert(
    readFileText(join(publicDir, socialImages.twitterImagePath.replace(/^\//, ''))) ===
      `${socialImages.twitterImageContent}\n`,
    `public${socialImages.twitterImagePath} is out of date. Run \`npm run generate:seo\`.`
  );

  const sourceDir = getGeneratedDocsSourceDir({ rootDir });
  if (sourceDir) {
    const sourceFiles = await readMarkdownFileMap(sourceDir);
    const destinationFiles = await readMarkdownFileMap(generatedDocsDir);
    const diff = diffMarkdownFileMaps(sourceFiles, destinationFiles);
    const hasDiff = diff.missing.length > 0 || diff.extra.length > 0 || diff.changed.length > 0;

    assert(
      !hasDiff,
      [
        `Generated docs drifted from ${sourceDir}. Run \`npm run sync:generated\` with ${GENERATED_DOCS_SOURCE_ENV} set.`,
        diff.missing.length > 0 ? `Missing: ${diff.missing.join(', ')}` : null,
        diff.extra.length > 0 ? `Extra: ${diff.extra.join(', ')}` : null,
        diff.changed.length > 0 ? `Changed: ${diff.changed.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  const absoluteLinkProblems = checkAbsoluteDocsLinks(documentationTree);
  assert(
    absoluteLinkProblems.length === 0,
    `Suspicious absolute docs links found:\n${absoluteLinkProblems.join('\n')}`
  );

  const aliasPaths = getDirectoryAliasEntries(documentationTree).map((entry) => entry.routePath);
  const duplicateAliases = aliasPaths.filter((value, index) => aliasPaths.indexOf(value) !== index);
  assert(duplicateAliases.length === 0, `Duplicate directory aliases found: ${duplicateAliases.join(', ')}`);

  const sourcePathCheck = Object.keys(documents).find((documentKey) => {
    const defaultKey = buildDocsContentPath(documents[documentKey].path);
    return documentKey === defaultKey && typeof documents[documentKey].sourcePath !== 'string';
  });
  assert(!sourcePathCheck, `Generated doc ${sourcePathCheck} is missing sourcePath metadata.`);

  console.log('Docs artifact checks passed.');
}

main().catch((error) => {
  console.error('Docs artifact checks failed:', error.message);
  process.exit(1);
});
