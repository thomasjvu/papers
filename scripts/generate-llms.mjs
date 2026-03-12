#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { documentationTree, homepageConfig } from '../shared/documentation-config.js';
import { buildCanonicalDocsPath } from '../shared/docsRouting.js';
import { getDefaultDocsVariantContext, resolveDocFileInfo } from './lib/docsVariants.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const defaultVariantContext = getDefaultDocsVariantContext();

function stripUtf8Bom(content) {
  return content.replace(/^\uFEFF/, '');
}

function ensureTrailingNewline(content) {
  return content.endsWith('\n') ? content : `${content}\n`;
}

function getDocFilePath(docPath) {
  const fileInfo = resolveDocFileInfo(docPath, {
    rootDir,
    version: defaultVariantContext.version,
    locale: defaultVariantContext.locale,
  });

  return fileInfo?.filePath || null;
}

function getDocUrl(docPath) {
  return docPath === 'llms'
    ? '/llms'
    : buildCanonicalDocsPath(docPath, {
        version: defaultVariantContext.version,
        locale: defaultVariantContext.locale,
      });
}

const siteName = homepageConfig.hero?.title || 'Documentation';
const siteSubtitle = homepageConfig.hero?.subtitle || '';
const siteDescription = homepageConfig.hero?.description || '';

async function generateLLMSTxt() {
  const sections = [];

  function processTree(items) {
    items.forEach((item) => {
      if (item.type === 'directory' && item.children) {
        const section = {
          title: item.name,
          items: [],
        };

        item.children.forEach((child) => {
          if (child.type === 'file') {
            const filePath = getDocFilePath(child.path);
            let description = '';

            try {
              if (!filePath) {
                throw new Error('File not found');
              }

              const content = stripUtf8Bom(fs.readFileSync(filePath, 'utf8'));
              const lines = content.split('\n');
              let foundTitle = false;
              for (const line of lines) {
                if (line.startsWith('# ')) {
                  foundTitle = true;
                  continue;
                }
                if (foundTitle && line.trim() && !line.startsWith('#')) {
                  description = line.trim();
                  break;
                }
              }
            } catch (error) {
              console.warn(`Could not read file ${child.path}:`, error);
            }

            section.items.push({
              title: child.name.replace(/\.(md|mdx)$/, ''),
              path: getDocUrl(child.path),
              description,
            });
          } else if (child.type === 'directory' && child.children) {
            processTree([child]);
          }
        });

        if (section.items.length > 0) {
          sections.push(section);
        }
      }
    });
  }

  processTree(documentationTree);

  let content = `# ${siteName} Documentation\n\n`;

  if (siteSubtitle) {
    content += `> ${siteSubtitle}\n\n`;
  }

  if (siteDescription) {
    content += `${siteDescription}\n\n`;
  }

  sections.forEach((section) => {
    content += `## ${section.title}\n\n`;
    section.items.forEach((item) => {
      content += `- [${item.title}](${item.path})`;
      if (item.description) {
        content += `: ${item.description}`;
      }
      content += '\n';
    });
    content += '\n';
  });

  return content;
}

async function generateLLMSFullTxt() {
  let fullContent = `# ${siteName} Documentation - Full Content\n\n`;
  fullContent +=
    '> Complete documentation content for AI ingestion. This file contains all documentation in a single, structured format.\n\n';

  function processTreeForFullContent(items) {
    let content = '';

    items.forEach((item) => {
      if (item.type === 'directory' && item.children) {
        content += `\n## ${item.name}\n\n`;
        content += processTreeForFullContent(item.children);
      } else if (item.type === 'file') {
        const filePath = getDocFilePath(item.path);

        try {
          if (!filePath) {
            throw new Error('File not found');
          }

          const fileContent = stripUtf8Bom(fs.readFileSync(filePath, 'utf8'));
          content += `\n### ${item.name.replace(/\.(md|mdx)$/, '')}\n\n`;
          content += `URL: ${getDocUrl(item.path)}\n\n`;
          content += fileContent + '\n\n';
          content += '---\n\n';
        } catch (error) {
          console.warn(`Could not read file ${item.path}:`, error);
        }
      }
    });

    return content;
  }

  fullContent += processTreeForFullContent(documentationTree);

  return fullContent;
}

async function main() {
  try {
    console.log('Generating llms.txt files...');

    const publicDir = path.join(rootDir, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const llmsTxt = ensureTrailingNewline((await generateLLMSTxt()).replace(/[ \t]+$/gm, ''));
    fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsTxt, 'utf8');
    console.log('Generated llms.txt');

    const llmsFullTxt = ensureTrailingNewline(
      (await generateLLMSFullTxt()).replace(/[ \t]+$/gm, '')
    );
    fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), llmsFullTxt, 'utf8');
    console.log('Generated llms-full.txt');

    console.log('Successfully generated llms.txt files.');
  } catch (error) {
    console.error('Failed to generate llms.txt files:', error);
    process.exit(1);
  }
}

main();