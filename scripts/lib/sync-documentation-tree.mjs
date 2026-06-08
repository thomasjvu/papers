import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { documentationTree } from '../shared/documentation-config.js';
import {
  addFileToTree,
  replaceDocumentationTreeExport,
} from './lib/documentationTreeWriter.mjs';

const contentRoot = join(process.cwd(), 'src/docs/content');
const configPath = join(process.cwd(), 'shared/documentation-config.js');

function collectTreePaths(items, paths = []) {
  for (const item of items) {
    if (item.type === 'file' && item.path) {
      paths.push(item.path);
      continue;
    }

    if (item.type === 'directory' && item.children) {
      collectTreePaths(item.children, paths);
    }
  }

  return paths;
}

function scanContentFiles(dir = contentRoot, base = '') {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    if (entry.startsWith('.')) {
      continue;
    }

    const absolutePath = join(dir, entry);
    const relativePath = base ? `${base}/${entry}` : entry;

    if (statSync(absolutePath).isDirectory()) {
      if (relativePath === 'variants') {
        continue;
      }

      files.push(...scanContentFiles(absolutePath, relativePath));
      continue;
    }

    if (/\.(md|mdx)$/i.test(entry)) {
      files.push(relativePath.replace(/\.(md|mdx)$/i, ''));
    }
  }

  return files.sort();
}

function titleCaseFromPath(path) {
  const leaf = path.split('/').pop() || path;
  return leaf
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function printSuggestedEntry(path) {
  console.log(`      {
        type: 'file',
        name: '${titleCaseFromPath(path)}.md',
        path: '${path}',
      },`);
}

const mode = process.argv.includes('--check')
  ? 'check'
  : process.argv.includes('--write')
    ? 'write'
    : 'report';

let tree = documentationTree;
const treePaths = new Set(collectTreePaths(tree));
const contentPaths = scanContentFiles();
let missingFromTree = contentPaths.filter((path) => !treePaths.has(path));
const missingFromDisk = [...treePaths].filter((path) => {
  const md = join(contentRoot, `${path}.md`);
  const mdx = join(contentRoot, `${path}.mdx`);
  return !existsSync(md) && !existsSync(mdx);
});

if (mode === 'write' && missingFromTree.length > 0) {
  for (const path of missingFromTree) {
    tree = addFileToTree(tree, path);
  }

  const source = readFileSync(configPath, 'utf8');
  const updated = replaceDocumentationTreeExport(source, tree);
  writeFileSync(configPath, updated, 'utf8');

  console.log(`Added ${missingFromTree.length} entr${missingFromTree.length === 1 ? 'y' : 'ies'} to documentationTree:`);
  for (const path of missingFromTree) {
    console.log(`  + ${path}`);
  }

  missingFromTree = [];
  treePaths.clear();
  collectTreePaths(tree, []).forEach((path) => treePaths.add(path));
}

if (missingFromDisk.length === 0 && (mode === 'check' || missingFromTree.length === 0)) {
  console.log('Published documentationTree entries are present on disk.');
  if (mode === 'report' && missingFromTree.length === 0) {
    console.log('No unpublished content files detected.');
  }
  process.exit(0);
}

if (missingFromDisk.length > 0) {
  console.log('Tree entries without a matching .md/.mdx file:');
  for (const path of missingFromDisk) {
    console.log(`  - ${path}`);
  }
}

if ((mode === 'report' || mode === 'write') && missingFromTree.length > 0) {
  console.log('\nUnpublished content files (not listed in documentationTree):');
  for (const path of missingFromTree) {
    console.log(`  - ${path}`);
  }

  console.log('\nSuggested entries:');
  for (const path of missingFromTree) {
    printSuggestedEntry(path);
  }

  if (mode === 'report') {
    console.log('\nRun `npm run sync:docs-tree -- --write` to append them automatically.');
  }
}

process.exit(mode === 'check' ? 1 : 0);