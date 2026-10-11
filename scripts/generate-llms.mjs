#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import {
  contentCollections,
  getCollectionVariants,
  validateContentCollections,
} from '../shared/content-collections.js';
import { homepageConfig } from '../shared/documentation-config.js';
import { createAgentDiscoveryManifest } from '../shared/seo.js';
import { loadViteEnv, resolveEnvMode } from './lib/loadViteEnv.mjs';
import { createHostedSkillArtifact, createAllLlmsArtifacts } from './lib/llmsArtifacts.mjs';
import { resolveCollectionContentRoot } from './lib/collectionContentRoot.mjs';

const rootDir = process.cwd();

async function main() {
  try {
    console.log('Generating llms.txt files...');

    const publicDir = path.join(rootDir, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const collections = validateContentCollections(contentCollections, { rootDir });
    const mode = resolveEnvMode('production');
    const viteEnv = loadViteEnv(rootDir, mode);
    const siteName = viteEnv.VITE_SITE_NAME || homepageConfig.hero?.title || 'papers';
    const siteUrl = viteEnv.VITE_SITE_URL || '';
    const siteDescription = homepageConfig.hero?.description || '';
    const openapiArtifactsPath = path.join(publicDir, 'openapi-artifacts.json');
    const openapiArtifacts = fs.existsSync(openapiArtifactsPath)
      ? JSON.parse(fs.readFileSync(openapiArtifactsPath, 'utf8'))
      : null;
    const llmsArtifacts = createAllLlmsArtifacts({
      collections,
      homepageConfig,
      rootDir,
      siteUrl,
      openapiArtifacts,
      getCollectionVariants,
    });

    console.log(
      `Resolved ${llmsArtifacts.resolvedFileCount}/${llmsArtifacts.expectedFileCount} documentation source file(s)`
    );

    fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsArtifacts.llmsTxt, 'utf8');
    console.log('Generated llms.txt');

    fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), llmsArtifacts.llmsFullTxt, 'utf8');
    console.log('Generated llms-full.txt');

    const primaryCollection =
      collections.find((collection) => collection.id === 'docs') || collections[0];
    const skillRoot = primaryCollection
      ? resolveCollectionContentRoot(primaryCollection, rootDir)
      : path.join(rootDir, 'src', 'docs', 'content');
    const skillSource = fs.readFileSync(path.join(skillRoot, 'skill.md'), 'utf8');
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
      `${JSON.stringify(
        createAgentDiscoveryManifest({
          siteName,
          siteUrl,
          description: siteDescription,
          collections,
        }),
        null,
        2
      )}\n`,
      'utf8'
    );
    console.log('Generated agents.json');
  } catch (error) {
    console.error('Failed to generate llms.txt files:', error);
    process.exit(1);
  }
}

main();
