#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { documentationTree } from '../shared/documentation-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

function stripUtf8Bom(content) {
  return content.replace(/^\uFEFF/, '');
}

function getDocFilePath(docPath) {
  return path.join(rootDir, 'src', 'docs', 'content', `${docPath}.md`);
}

function getDocUrl(docPath) {
  return docPath === 'llms' ? '/llms' : `/docs/${docPath}`;
}

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
              console.warn(`Could not read file ${filePath}:`, error);
            }

            section.items.push({
              title: child.name.replace('.md', ''),
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

  let content = '# Papers Documentation\n\n';
  content +=
    '> A modern, customizable documentation framework built with React, Vite, TypeScript, and Tailwind CSS.\n\n';
  content +=
    'Papers is a static documentation site template with fast client-side navigation, Pagefind search, interactive documentation maps, and generated llms.txt outputs for AI-friendly discovery.\n\n';

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
  let fullContent = '# Papers Documentation - Full Content\n\n';
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
          const fileContent = stripUtf8Bom(fs.readFileSync(filePath, 'utf8'));
          content += `\n### ${item.name.replace('.md', '')}\n\n`;
          content += `URL: ${getDocUrl(item.path)}\n\n`;
          content += fileContent + '\n\n';
          content += '---\n\n';
        } catch (error) {
          console.warn(`Could not read file ${filePath}:`, error);
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

    const llmsTxt = (await generateLLMSTxt()).replace(/[ \t]+$/gm, '');
    fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsTxt, 'utf8');
    console.log('Generated llms.txt');

    const llmsFullTxt = (await generateLLMSFullTxt()).replace(/[ \t]+$/gm, '');
    fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), llmsFullTxt, 'utf8');
    console.log('Generated llms-full.txt');

    console.log('Successfully generated llms.txt files.');
  } catch (error) {
    console.error('Failed to generate llms.txt files:', error);
    process.exit(1);
  }
}

main();
