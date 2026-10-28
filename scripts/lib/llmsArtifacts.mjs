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

function readDocSource(docPath, options) {
  const filePath = getDocFilePath(docPath, options);

  try {
    if (!filePath) {
      throw new Error('File not found');
    }

    return stripUtf8Bom(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.warn(`Could not read file ${docPath}:`, error);
    return null;
  }
}

function getDocTitle(name) {
  return name.replace(/\.(md|mdx)$/, '');
}

function describeDoc(docPath, options) {
  const content = readDocSource(docPath, options);
  if (content === null) {
    return '';
  }

  try {
    const parsed = parseFrontmatter(content, options.schemaAdapter || options.frontmatterSchema);
    return getAgentDescription(content, parsed.frontmatter) || '';
  } catch (error) {
    console.warn(`Could not read file ${docPath}:`, error);
    return '';
  }
}

/** One section per directory; nested directories are emitted before their parent. */
function collectLlmsSections(items, options, sections = []) {
  for (const item of items) {
    if (item.type !== 'directory' || !item.children) {
      continue;
    }

    const section = { title: item.name, items: [] };

    for (const child of item.children) {
      if (child.type === 'file') {
        section.items.push({
          title: getDocTitle(child.name),
          path: getDocUrl(child.path, options),
          description: describeDoc(child.path, options),
        });
      } else if (child.type === 'directory' && child.children) {
        collectLlmsSections([child], options, sections);
      }
    }

    if (section.items.length > 0) {
      sections.push(section);
    }
  }

  return sections;
}

function renderLlmsIndex({ siteName, siteSubtitle, siteDescription, sections, openapiSections }) {
  const lines = [`# ${siteName} Documentation\n\n`];

  if (siteSubtitle) {
    lines.push(`> ${siteSubtitle}\n\n`);
  }

  if (siteDescription) {
    lines.push(`${siteDescription}\n\n`);
  }

  for (const section of sections) {
    lines.push(`## ${section.title}\n\n`);
    for (const item of section.items) {
      const suffix = item.description ? `: ${item.description}` : '';
      lines.push(`- [${item.title}](${item.path})${suffix}\n`);
    }
    lines.push('\n');
  }

  if (openapiSections.length > 0) {
    lines.push('## API Reference\n\n');
    for (const section of openapiSections) {
      lines.push(`### ${section.title}\n\n`);
      for (const item of [...section.operations, ...section.models]) {
        lines.push(`- [${item.title}](${item.path}): ${item.description}\n`);
      }
      lines.push('\n');
    }
  }

  return lines.join('');
}

function renderFullTree(items, options, counter) {
  let content = '';

  for (const item of items) {
    if (item.type === 'directory' && item.children) {
      content += `\n## ${item.name}\n\n`;
      content += renderFullTree(item.children, options, counter);
    } else if (item.type === 'file') {
      const fileContent = readDocSource(item.path, options);
      if (fileContent === null) {
        continue;
      }

      counter.resolved += 1;
      content += `\n### ${getDocTitle(item.name)}\n\n`;
      content += `URL: ${getDocUrl(item.path, options)}\n\n`;
      content += fileContent + '\n\n';
      content += '---\n\n';
    }
  }

  return content;
}

function listOrNone(values) {
  return values.join(', ') || 'none';
}

function renderOpenApiFullContent(specs, siteUrl) {
  let content = '\n## API Reference\n\n';

  for (const spec of specs) {
    content += `### ${spec.label}\n\n`;
    for (const operation of spec.operations || []) {
      content += `#### ${operation.method} ${operation.path}\n\n`;
      content += `URL: ${buildAbsoluteUrl(operation.routePath, siteUrl)}\n\n`;
      if (operation.summary) content += `${operation.summary}\n\n`;
      if (operation.description) content += `${operation.description}\n\n`;
      content += `Parameters: ${listOrNone(operation.parameters.map((parameter) => `${parameter.in}.${parameter.name}`))}\n\n`;
      content += `Responses: ${listOrNone(operation.responses.map((response) => response.status))}\n\n`;
      content += '```bash\n' + operation.codeSamples.curl + '\n```\n\n';
    }
    for (const model of spec.schemas || []) {
      content += `#### ${model.name}\n\nURL: ${buildAbsoluteUrl(model.routePath, siteUrl)}\n\n`;
      content += `\`\`\`typescript\n${model.typescript}\n\`\`\`\n\n`;
    }
  }

  return content;
}

function finalizeLlmsText(content) {
  return ensureTrailingNewline(content.replace(/[ \t]+$/gm, ''));
}

export function createLlmsArtifacts(options = {}) {
  const documentationTree = options.documentationTree || [];
  const homepageConfig = options.homepageConfig || {};
  const hero = homepageConfig.hero || {};
  const siteUrl = options.siteUrl || '';
  const siteName = options.collection?.label || hero.title || 'Documentation';
  const openapiSections = createOpenApiLlmsSection(options.openapiArtifacts, siteUrl);

  const llmsTxt = renderLlmsIndex({
    siteName,
    siteSubtitle: hero.subtitle || '',
    siteDescription: hero.description || '',
    sections: collectLlmsSections(documentationTree, options),
    openapiSections,
  });

  const counter = { resolved: 0 };
  let llmsFullTxt = `# ${siteName} Documentation - Full Content\n\n`;
  llmsFullTxt +=
    '> Complete documentation content for AI ingestion. This file contains all documentation in a single, structured format.\n\n';
  llmsFullTxt += renderFullTree(documentationTree, options, counter);

  if (openapiSections.length > 0) {
    llmsFullTxt += renderOpenApiFullContent(options.openapiArtifacts.specs, siteUrl);
  }

  const expectedFileCount = countTreeFiles(documentationTree);
  if (expectedFileCount > 0 && counter.resolved === 0) {
    const rootDir = options.rootDir || process.cwd();
    throw new Error(
      `generate:llms resolved 0 documentation sources under ${rootDir}/src/docs/content (expected ${expectedFileCount})`
    );
  }

  return {
    llmsTxt: finalizeLlmsText(llmsTxt),
    llmsFullTxt: finalizeLlmsText(llmsFullTxt),
    resolvedFileCount: counter.resolved,
    expectedFileCount,
  };
}

/**
 * Remove exactly the header renderLlmsIndex wrote (title, optional subtitle,
 * optional description) so a collection's first section heading survives.
 */
function stripLlmsIndexHeader(llmsTxt, siteSubtitle, siteDescription) {
  let body = llmsTxt.replace(/^# [^\n]*\n\n/, '');
  for (const line of [siteSubtitle ? `> ${siteSubtitle}` : '', siteDescription]) {
    // Outputs are already finalized, so compare without trailing spaces.
    const prefix = `${line}\n\n`.replace(/[ \t]+$/gm, '');
    if (line && body.startsWith(prefix)) body = body.slice(prefix.length);
  }
  return body;
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
      const body = stripLlmsIndexHeader(output.llmsTxt, siteSubtitle, siteDescription);
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
