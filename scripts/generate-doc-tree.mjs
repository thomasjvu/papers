import { readdir, writeFile } from 'fs/promises';
import path from 'path';

const rootDir = process.cwd();
const contentRoot = path.join(rootDir, 'src', 'docs', 'content');
const outputPath = path.join(rootDir, 'shared', 'documentation-tree.generated.js');
const DOC_EXTENSIONS = new Set(['.md', '.mdx']);
const SPECIAL_WORDS = new Map([
  ['api', 'API'],
  ['auth', 'Auth'],
  ['cli', 'CLI'],
  ['cms', 'CMS'],
  ['cors', 'CORS'],
  ['faq', 'FAQ'],
  ['github', 'GitHub'],
  ['gitlab', 'GitLab'],
  ['hq', 'HQ'],
  ['infisical', 'Infisical'],
  ['live2d', 'Live2D'],
  ['mcp', 'MCP'],
  ['neon', 'Neon'],
  ['openclaw', 'OpenClaw'],
  ['opensource', 'OpenSource'],
  ['opensourcefaq', 'Open Source FAQ'],
  ['party', 'Party'],
  ['pgvector', 'pgvector'],
  ['phala', 'Phala'],
  ['phantasy', 'Phantasy'],
  ['prod', 'Prod'],
  ['r2', 'R2'],
  ['seo', 'SEO'],
  ['sso', 'SSO'],
  ['storage', 'Storage'],
  ['typescript', 'TypeScript'],
  ['ui', 'UI'],
  ['vtuber', 'VTuber'],
  ['websocket', 'WebSocket'],
]);

const SECTION_ORDER = {
  '': [
    'index',
    'getting-started',
    'guides',
    'workspaces',
    'avatars',
    'website-mode',
    'features',
    'integrations',
    'plugins',
    'api',
    'architecture',
    'deployment',
    'development',
    'generated',
    'cli',
    'configuration',
    'debugging',
    'install',
    'local-models',
    'maintenance',
    'voice-input',
    'KNOWN_LIMITATIONS',
    'TYPESCRIPT_GUIDELINES',
    'workflows',
  ],
  'getting-started': [
    'getting-started',
    'quickstart',
    'introduction',
    'use-cases',
    'installation',
    'first-run',
    'configuration',
    'bootstrapping',
  ],
  guides: [
    'BUSINESS_AGENT_CMS_10_MINUTES',
    'AUTHENTICATION_SETUP',
    'DEPLOY',
    'CONSUMING_PHANTASY',
    'LIVE2D_SETUP',
    'LIVE2D_PROD_READY',
    'CUSTOM_INTEGRATION_GUIDE',
    'ENVIRONMENT_SETUP',
    'STORAGE_OPTIONS',
    'OPEN_SOURCE_FAQ',
    'OPENCLAW_MIGRATION',
    'MIGRATION_NOTES',
    'COOLIFY_COMPOSE',
    'NEON_SETUP',
    'INFISICAL_SETUP',
    'R2_QUICK_SETUP',
    'R2_CORS_SETUP',
    'RELEASE_POLICY',
    'multi-agent-setup',
  ],
  architecture: [
    'architecture',
    'design-principles',
    'agent-compatibility',
    'runtime-packages',
    'system-design',
    'repo-standards',
    'provider-routing',
    'framework-audit',
    'memory-system',
    'websocket-system',
    'heartbeat',
  ],
  api: ['api', 'rest-api', 'websocket-api', 'openai-compatible', 'standardization'],
  generated: [
    'defaults',
    'providers',
    'plugins',
    'skills',
    'themes',
    'workflows',
    'mcp',
    'presets',
    'admin-tabs',
    'cli-commands',
    'api-routes',
    'package-exports',
    'party-hq-protocol',
  ],
  plugins: ['overview', 'developing', 'developing-plugins', 'marketplace', 'troubleshooting'],
};

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function stripDocExtension(filename) {
  return filename.replace(/\.(md|mdx)$/i, '');
}

function titleizeSegment(segment) {
  return segment
    .replace(/\.(md|mdx)$/i, '')
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (SPECIAL_WORDS.has(lower)) {
        return SPECIAL_WORDS.get(lower);
      }

      if (/^[A-Z0-9]{2,}$/.test(part)) {
        if (part.length <= 4 || /\d/.test(part)) {
          return part;
        }

        return part.charAt(0) + part.slice(1).toLowerCase();
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

function createFileItem(relativePath) {
  const baseName = path.basename(relativePath);
  return {
    type: 'file',
    name: `${titleizeSegment(baseName)}.md`,
    path: toPosix(stripDocExtension(relativePath)),
  };
}

function sortNames(names, orderKey) {
  const order = SECTION_ORDER[orderKey] || [];
  return [...names].sort((left, right) => {
    const leftBase = stripDocExtension(left);
    const rightBase = stripDocExtension(right);
    const leftIndex = order.indexOf(leftBase);
    const rightIndex = order.indexOf(rightBase);

    if (leftIndex !== -1 || rightIndex !== -1) {
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    }

    return leftBase.localeCompare(rightBase);
  });
}

async function buildTree(relativeDir = '') {
  const absoluteDir = path.join(contentRoot, relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && DOC_EXTENSIONS.has(path.extname(entry.name)))
    .map((entry) => entry.name);
  const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const overviewFiles = new Set(
    directories.filter((directory) =>
      files.some((file) => stripDocExtension(file) === directory)
    )
  );
  const items = [];
  const standaloneFileNames = files.filter((file) => !overviewFiles.has(stripDocExtension(file)));
  const orderedEntryNames = sortNames(
    [...standaloneFileNames, ...directories],
    relativeDir || ''
  );

  for (const entryName of orderedEntryNames) {
    if (directories.includes(entryName)) {
      const directoryName = entryName;
      const childRelativeDir = relativeDir
        ? path.join(relativeDir, directoryName)
        : directoryName;
      const children = [];
      const overviewFileName = files.find(
        (file) => stripDocExtension(file) === directoryName
      );

      if (overviewFileName) {
        children.push(
          createFileItem(relativeDir ? path.join(relativeDir, overviewFileName) : overviewFileName)
        );
      }

      children.push(...(await buildTree(childRelativeDir)));

      items.push({
        type: 'directory',
        name: titleizeSegment(directoryName),
        path: toPosix(childRelativeDir),
        children,
      });
      continue;
    }

    const fileName = entryName;
    items.push(createFileItem(relativeDir ? path.join(relativeDir, fileName) : fileName));
  }

  return items;
}

async function main() {
  const documentationTree = await buildTree();
  const fileContents = `/**
 * This file is generated by scripts/generate-doc-tree.mjs.
 * Do not edit by hand.
 */

export const documentationTree = ${JSON.stringify(documentationTree, null, 2)};
`;

  await writeFile(outputPath, fileContents, 'utf8');
  console.log(`Generated documentation tree: ${outputPath}`);
}

main().catch((error) => {
  console.error('Documentation tree generation failed:', error);
  process.exit(1);
});
