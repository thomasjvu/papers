import fs from 'fs';

import { buildCanonicalDocsPath } from '../../shared/docsRouting.js';
import { getDefaultDocsVariantContext, resolveDocFileInfo } from './docsVariants.mjs';

function stripUtf8Bom(content) {
  return content.replace(/^\uFEFF/, '');
}

function ensureTrailingNewline(content) {
  return content.endsWith('\n') ? content : `${content}\n`;
}

function getDocFilePath(docPath, options = {}) {
  const defaultVariantContext = getDefaultDocsVariantContext(options);
  const fileInfo = resolveDocFileInfo(docPath, {
    ...options,
    version: defaultVariantContext.version,
    locale: defaultVariantContext.locale,
  });

  return fileInfo?.filePath || null;
}

function getDocUrl(docPath, options = {}) {
  const defaultVariantContext = getDefaultDocsVariantContext(options);

  return buildCanonicalDocsPath(docPath, {
    ...options,
    version: defaultVariantContext.version,
    locale: defaultVariantContext.locale,
  });
}

export function createLlmsArtifacts(options = {}) {
  const documentationTree = options.documentationTree || [];
  const homepageConfig = options.homepageConfig || {};
  const siteName = homepageConfig.hero?.title || 'Documentation';
  const siteSubtitle = homepageConfig.hero?.subtitle || '';
  const siteDescription = homepageConfig.hero?.description || '';
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
            const filePath = getDocFilePath(child.path, options);
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
              path: getDocUrl(child.path, options),
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

  let llmsTxt = `# ${siteName} Documentation\n\n`;

  if (siteSubtitle) {
    llmsTxt += `> ${siteSubtitle}\n\n`;
  }

  if (siteDescription) {
    llmsTxt += `${siteDescription}\n\n`;
  }

  sections.forEach((section) => {
    llmsTxt += `## ${section.title}\n\n`;
    section.items.forEach((item) => {
      llmsTxt += `- [${item.title}](${item.path})`;
      if (item.description) {
        llmsTxt += `: ${item.description}`;
      }
      llmsTxt += '\n';
    });
    llmsTxt += '\n';
  });

  let llmsFullTxt = `# ${siteName} Documentation - Full Content\n\n`;
  llmsFullTxt +=
    '> Complete documentation content for AI ingestion. This file contains all documentation in a single, structured format.\n\n';

  function processTreeForFullContent(items) {
    let content = '';

    items.forEach((item) => {
      if (item.type === 'directory' && item.children) {
        content += `\n## ${item.name}\n\n`;
        content += processTreeForFullContent(item.children);
      } else if (item.type === 'file') {
        const filePath = getDocFilePath(item.path, options);

        try {
          if (!filePath) {
            throw new Error('File not found');
          }

          const fileContent = stripUtf8Bom(fs.readFileSync(filePath, 'utf8'));
          content += `\n### ${item.name.replace(/\.(md|mdx)$/, '')}\n\n`;
          content += `URL: ${getDocUrl(item.path, options)}\n\n`;
          content += fileContent + '\n\n';
          content += '---\n\n';
        } catch (error) {
          console.warn(`Could not read file ${item.path}:`, error);
        }
      }
    });

    return content;
  }

  llmsFullTxt += processTreeForFullContent(documentationTree);

  return {
    llmsTxt: ensureTrailingNewline(llmsTxt.replace(/[ \t]+$/gm, '')),
    llmsFullTxt: ensureTrailingNewline(llmsFullTxt.replace(/[ \t]+$/gm, '')),
  };
}
