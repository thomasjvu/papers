#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { documentationTree, homepageConfig } from '../shared/documentation-config.js';
import { createLlmsArtifacts } from './lib/llmsArtifacts.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function main() {
  try {
    console.log('Generating llms.txt files...');

    const publicDir = path.join(rootDir, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const { llmsTxt, llmsFullTxt } = createLlmsArtifacts({
      documentationTree,
      homepageConfig,
      rootDir,
    });
    fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsTxt, 'utf8');
    console.log('Generated llms.txt');

    fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), llmsFullTxt, 'utf8');
    console.log('Generated llms-full.txt');

    console.log('Successfully generated llms.txt files.');
  } catch (error) {
    console.error('Failed to generate llms.txt files:', error);
    process.exit(1);
  }
}

main();
