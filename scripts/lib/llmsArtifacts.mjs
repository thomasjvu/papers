import fs from 'fs';

import { buildCanonicalCollectionPath, buildCanonicalDocsPath } from '../../shared/docsRouting.js';
import { extractDescriptionFromMarkdown, buildAbsoluteUrl } from '../../shared/seo.js';
import { parseFrontmatter } from './docsArtifacts.mjs';
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

  const canonicalPath = options.collection
    ? buildCanonicalCollectionPath(options.collection, docPath, {
        ...options,
        version: defaultVariantContext.version,
        locale: defaultVariantContext.locale,
      })
    : buildCanonicalDocsPath(docPath, {
        ...options,
        version: defaultVariantContext.version,
        locale: defaultVariantContext.locale,
      });

  return buildAbsoluteUrl(canonicalPath, options.siteUrl || '');
}

function getAgentDescription(content, frontmatter) {
  if (typeof frontmatter.description === 'string' && frontmatter.description.trim()) {
    return frontmatter.description.trim();
  }

  const body = content.replace(/^---[\s\S]*?---\s*/m, '');
  for (const paragraph of body.split(/\n\s*\n/)) {
    const trimmed = paragraph.trim();

    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('```') ||
      trimmed.split('\n').every((line) => /^\s*(?:[-*+] |\d+\. |\|)/.test(line))
    ) {
      continue;
    }

    const description = extractDescriptionFromMarkdown(trimmed);
    if (description) {
      return description;
    }
  }

  return extractDescriptionFromMarkdown(content);
}

function countTreeFiles(items) {
  let count = 0;

  for (const item of items) {
    if (item.type === 'file') {
      count += 1;
      continue;
    }

    if (item.type === 'directory' && item.children) {
      count += countTreeFiles(item.children);
    }
  }

  return count;
}

function createOpenApiLlmsSection(openapiArtifacts, siteUrl) {
  const sections = [];

  for (const spec of openapiArtifacts?.specs || []) {
    const operations = (spec.operations || []).map((operation) => ({
      title: `${operation.method} ${operation.path}`,
      path: buildAbsoluteUrl(operation.routePath, siteUrl),
      description: operation.summary || operation.description || 'OpenAPI operation reference.',
    }));
    const models = (spec.schemas || []).map((model) => ({
      title: model.name,
      path: buildAbsoluteUrl(model.routePath, siteUrl),
      description: model.description || 'OpenAPI schema model.',
    }));

    if (operations.length || models.length) {
      sections.push({ title: spec.label, operations, models });
    }
  }

  return sections;
}

export function createLlmsArtifacts(options = {}) {
  const documentationTree = options.documentationTree || [];
  const homepageConfig = options.homepageConfig || {};
  const siteName = options.collection?.label || homepageConfig.hero?.title || 'Documentation';
  const siteSubtitle = homepageConfig.hero?.subtitle || '';
  const siteDescription = homepageConfig.hero?.description || '';
  const sections = [];
  let resolvedFileCount = 0;
  const openapiSections = createOpenApiLlmsSection(options.openapiArtifacts, options.siteUrl || '');

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
              const parsed = parseFrontmatter(
                content,
                options.schemaAdapter || options.frontmatterSchema
              );
              description = getAgentDescription(content, parsed.frontmatter) || '';
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

  if (openapiSections.length > 0) {
    llmsTxt += '## API Reference\n\n';
    openapiSections.forEach((section) => {
      llmsTxt += `### ${section.title}\n\n`;
      [...section.operations, ...section.models].forEach((item) => {
        llmsTxt += `- [${item.title}](${item.path}): ${item.description}\n`;
      });
      llmsTxt += '\n';
    });
  }

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
          resolvedFileCount += 1;
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

  if (openapiSections.length > 0) {
    llmsFullTxt += '\n## API Reference\n\n';
    for (const spec of options.openapiArtifacts?.specs || []) {
      llmsFullTxt += `### ${spec.label}\n\n`;
      for (const operation of spec.operations || []) {
        llmsFullTxt += `#### ${operation.method} ${operation.path}\n\n`;
        llmsFullTxt += `URL: ${buildAbsoluteUrl(operation.routePath, options.siteUrl || '')}\n\n`;
        if (operation.summary) llmsFullTxt += `${operation.summary}\n\n`;
        if (operation.description) llmsFullTxt += `${operation.description}\n\n`;
        llmsFullTxt += `Parameters: ${operation.parameters.map((parameter) => `${parameter.in}.${parameter.name}`).join(', ') || 'none'}\n\n`;
        llmsFullTxt += `Responses: ${operation.responses.map((response) => response.status).join(', ') || 'none'}\n\n`;
        llmsFullTxt += '```bash\n' + operation.codeSamples.curl + '\n```\n\n';
      }
      for (const model of spec.schemas || []) {
        llmsFullTxt += `#### ${model.name}\n\nURL: ${buildAbsoluteUrl(model.routePath, options.siteUrl || '')}\n\n`;
        llmsFullTxt += `\`\`\`typescript\n${model.typescript}\n\`\`\`\n\n`;
      }
    }
  }

  const expectedFileCount = countTreeFiles(documentationTree);
  if (expectedFileCount > 0 && resolvedFileCount === 0) {
    const rootDir = options.rootDir || process.cwd();
    throw new Error(
      `generate:llms resolved 0 documentation sources under ${rootDir}/src/docs/content (expected ${expectedFileCount})`
    );
  }

  return {
    llmsTxt: ensureTrailingNewline(llmsTxt.replace(/[ \t]+$/gm, '')),
    llmsFullTxt: ensureTrailingNewline(llmsFullTxt.replace(/[ \t]+$/gm, '')),
    resolvedFileCount,
    expectedFileCount,
  };
}

export function createAllLlmsArtifacts({ collections = [], ...options } = {}) {
  const outputs = collections.map((collection) =>
    createLlmsArtifacts({
      ...options,
      collection: collections.length === 1 && collection.id === 'docs' ? undefined : collection,
      documentationTree: collection.tree,
      contentDir: collection.contentDir,
      schemaAdapter: collection.schemaAdapter || collection.schema,
      frontmatterSchema: collection.frontmatterSchema,
      versionConfig: collection.variants?.versionConfig,
      i18nConfig: collection.variants?.i18nConfig,
    })
  );

  if (outputs.length === 0) {
    return createLlmsArtifacts(options);
  }

  if (outputs.length === 1) {
    return outputs[0];
  }

  const siteName = options.homepageConfig?.hero?.title || 'Documentation';
  const siteSubtitle = options.homepageConfig?.hero?.subtitle || '';
  const siteDescription = options.homepageConfig?.hero?.description || '';
  const llmsTxt = [
    `# ${siteName} Documentation`,
    siteSubtitle ? `> ${siteSubtitle}` : '',
    siteDescription,
    ...outputs.map((output, index) => {
      const label = collections[index]?.label || collections[index]?.id || 'Collection';
      const body = output.llmsTxt.replace(/^# .*?\n\n(?:> .*?\n\n)?(?:.*?\n\n)?/, '');
      return `## ${label}\n\n${body.trim()}`;
    }),
  ]
    .filter(Boolean)
    .join('\n\n');
  const llmsFullTxt = [
    `# ${siteName} Documentation - Full Content`,
    '> Complete documentation content for AI ingestion across all collections.',
    ...outputs.map((output, index) => {
      const label = collections[index]?.label || collections[index]?.id || 'Collection';
      return `\n## ${label}\n\n${output.llmsFullTxt.replace(/^# .*?\n\n/, '').trim()}`;
    }),
  ].join('\n\n');

  return {
    llmsTxt: ensureTrailingNewline(llmsTxt.replace(/[ \t]+$/gm, '')),
    llmsFullTxt: ensureTrailingNewline(llmsFullTxt.replace(/[ \t]+$/gm, '')),
    resolvedFileCount: outputs.reduce((sum, output) => sum + output.resolvedFileCount, 0),
    expectedFileCount: outputs.reduce((sum, output) => sum + output.expectedFileCount, 0),
  };
}

export function createHostedSkillArtifact(sourceContent, options = {}) {
  const parsed = parseFrontmatter(stripUtf8Bom(sourceContent));
  const name = options.name || 'documentation-agent';
  const description =
    options.description ||
    parsed.frontmatter.description ||
    'Agent guidance for navigating and maintaining this documentation site.';
  const body = parsed.body.trim();

  return ensureTrailingNewline(
    ['---', `name: ${name}`, `description: ${description}`, '---', '', body].join('\n')
  );
}
