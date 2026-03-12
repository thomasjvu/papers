import { existsSync, readFileSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as pagefind from 'pagefind';
import { buildCanonicalDocsPath, buildDocsContentPath, getDocsVariantContexts } from '../shared/docsRouting.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const pagefindOutputDir = join(distDir, 'pagefind');
const searchPagesDir = join(distDir, 'search-pages');
const docsIndexPath = join(rootDir, 'public', 'docs-index.json');
const docsContentDir = join(rootDir, 'public', 'docs-content');

console.log('Generating Pagefind search index...');

if (!existsSync(distDir)) {
  console.error('dist directory not found. Run build first.');
  process.exit(1);
}

if (!existsSync(docsIndexPath) || !existsSync(docsContentDir)) {
  console.error('Generated docs artifacts not found. Run generate:docs first.');
  process.exit(1);
}

if (existsSync(pagefindOutputDir)) {
  rmSync(pagefindOutputDir, { recursive: true, force: true });
}

if (existsSync(searchPagesDir)) {
  rmSync(searchPagesDir, { recursive: true, force: true });
}

const docsIndex = JSON.parse(readFileSync(docsIndexPath, 'utf-8'));

function stripUtf8Bom(content) {
  return content.replace(/^\uFEFF/, '');
}

function getTitle(docPath, content) {
  const titleMatch = stripUtf8Bom(content).match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : docPath;
}

function stripMarkdown(content) {
  return stripUtf8Bom(content)
    .replace(/^```[\s\S]*?^```$/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#+\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r?\n{2,}/g, '\n\n')
    .trim();
}

function getSearchUrl(docPath, context) {
  if (docPath === 'llms') {
    return '/llms';
  }

  return buildCanonicalDocsPath(docPath, {
    version: context.version,
    locale: context.locale,
  });
}

function getGeneratedDocumentPath(docPath, context) {
  const key = buildDocsContentPath(docPath, {
    version: context.version,
    locale: context.locale,
  });

  return join(docsContentDir, `${key}.json`);
}

async function buildSearchIndex() {
  const { index } = await pagefind.createIndex();
  const variantContexts = getDocsVariantContexts();
  const indexedDocumentPaths = new Set();
  let indexedCount = 0;

  for (const context of variantContexts) {
    for (const docPath of docsIndex.paths) {
      if (docPath === 'llms' && !context.isDefault) {
        continue;
      }

      const documentPath = getGeneratedDocumentPath(docPath, context);
      const documentKey = `${getSearchUrl(docPath, context)}::${documentPath}`;

      if (indexedDocumentPaths.has(documentKey)) {
        continue;
      }

      indexedDocumentPaths.add(documentKey);

      if (!existsSync(documentPath)) {
        console.warn(`Skipping missing generated document: ${documentPath}`);
        continue;
      }

      const documentData = JSON.parse(readFileSync(documentPath, 'utf-8'));
      const rawContent = documentData.content ?? '';
      const title = documentData.title || docsIndex.titles?.[docPath] || getTitle(docPath, rawContent);
      const searchableContent = stripMarkdown(rawContent);

      await index.addCustomRecord({
        url: getSearchUrl(docPath, context),
        content: `${title}\n\n${searchableContent}`,
        language: context.locale || 'en',
        meta: { title },
      });

      indexedCount += 1;
    }
  }

  await index.writeFiles({ outputPath: pagefindOutputDir });
  await pagefind.close();

  console.log(`Indexed ${indexedCount} documentation pages.`);
  console.log(`Wrote Pagefind assets to ${pagefindOutputDir}`);
}

buildSearchIndex()
  .then(() => {
    console.log('Pagefind search index generated successfully.');
  })
  .catch(async (error) => {
    console.error('Failed to generate Pagefind search index:', error);
    await pagefind.close();
    process.exit(1);
  });