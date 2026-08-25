#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { documentationTree, homepageConfig } from '../shared/documentation-config.js';
import { createAgentDiscoveryManifest } from '../shared/seo.js';
import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import { createHostedSkillArtifact, createLlmsArtifacts } from './lib/llmsArtifacts.mjs';

const rootDir = process.cwd();

async function main() {
  try {
    console.log('Generating llms.txt files...');

    const publicDir = path.join(rootDir, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const mode = resolveEnvMode('production');
    const viteEnv = loadViteEnv(rootDir, mode);
    const siteName = viteEnv.VITE_SITE_NAME || homepageConfig.hero?.title || 'papers';
    const siteUrl = viteEnv.VITE_SITE_URL || '';
    const siteDescription = homepageConfig.hero?.description || '';
    const { llmsTxt, llmsFullTxt, resolvedFileCount, expectedFileCount } = createLlmsArtifacts({
      documentationTree,
      homepageConfig,
      rootDir,
      siteUrl,
    });
    console.log(`Resolved ${resolvedFileCount}/${expectedFileCount} documentation source file(s)`);

    fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsTxt, 'utf8');
    console.log('Generated llms.txt');

    fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), llmsFullTxt, 'utf8');
    console.log('Generated llms-full.txt');

    const skillSource = fs.readFileSync(
      path.join(rootDir, 'src', 'docs', 'content', 'skill.md'),
      'utf8'
    );
    fs.writeFileSync(
      path.join(publicDir, 'skill.md'),
      createHostedSkillArtifact(skillSource, {
        name: `${siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-docs`,
      }),
      'utf8'
    );
    console.log('Generated skill.md');

    fs.writeFileSync(
      path.join(publicDir, 'agents.json'),
      `${JSON.stringify(createAgentDiscoveryManifest({ siteName, siteUrl, description: siteDescription }), null, 2)}\n`,
      'utf8'
    );
    console.log('Generated agents.json');

    console.log('Successfully generated llms.txt files.');
  } catch (error) {
    console.error('Failed to generate llms.txt files:', error);
    process.exit(1);
  }
}

main();
