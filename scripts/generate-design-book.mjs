#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { designBookConfig } from '../shared/documentation-config.js';
import { loadDesignBook } from './lib/designBook.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(projectRoot, 'public', 'design-book.json');

function main() {
  if (!designBookConfig?.enabled) {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    console.log('design book: disabled');
    return;
  }

  const book = loadDesignBook(projectRoot, designBookConfig);
  if (!book) {
    console.warn(`design book: source not found (${designBookConfig.sourcePath})`);
    return;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    route: designBookConfig.route || '/design',
    title: designBookConfig.title || 'Design Book',
    subtitle: designBookConfig.subtitle || 'Visual identity',
    sourcePath: path.relative(projectRoot, book.sourcePath),
    name: book.name,
    description: book.description,
    version: book.version,
    tokens: book.tokens,
    body: book.body,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`design book: wrote ${path.relative(projectRoot, outputPath)}`);
}

main();