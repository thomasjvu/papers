import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { generateDocsContent } from '../scripts/generate-docs.mjs';
import { createAllLlmsArtifacts } from '../scripts/lib/llmsArtifacts.mjs';
import { resolveDocFileInfo } from '../scripts/lib/docsVariants.mjs';
import { createContentSchemaAdapter } from '../shared/contentSchema.js';
import { disabledVariantConfigs } from './helpers/validationFixtures.ts';

// Security regressions for the content build (audit F-2).
// Ways a content source could leak a build-host file, written before the fix:
// - a .md entry that is a symlink to a file outside the content root;
// - a regular-looking path whose parent directory is a symlink out of the root;
// - a symlink that discovery never sees (a variant or framework path that
//   resolveDocFileInfo finds directly);
// - a collection contentDir that is itself a symlink out of the repository;
// - llms-full.txt reading the same link through its own reader;
// - the rejection happening after artifacts were already written.
const MARKER = 'DUMMY_PRIVATE_MARKER=not-a-real-secret';

function alphaCollection() {
  return {
    id: 'alpha',
    label: 'Alpha',
    routePrefix: '/alpha',
    contentDir: 'content/alpha',
    artifactNamespace: 'alpha',
    schemaVersion: 1,
    schemaAdapter: createContentSchemaAdapter(),
    tree: [
      {
        type: 'directory' as const,
        name: 'Guide',
        path: 'guide',
        children: [{ type: 'file' as const, name: 'Intro.md', path: 'guide/intro' }],
      },
    ],
    frameworkDocPaths: [],
    variants: disabledVariantConfigs(),
    mdxComponents: ['Callout'],
  };
}

async function withSite(
  mode: 'regular' | 'file-symlink' | 'dir-symlink' | 'root-symlink',
  run: (rootDir: string) => Promise<void>
) {
  const temp = await mkdtemp(join(tmpdir(), 'papers-content-security-'));
  try {
    const rootDir = join(temp, 'site');
    const outside = join(temp, 'outside');
    await mkdir(join(outside, 'guide'), { recursive: true });
    await writeFile(join(outside, 'private.txt'), `${MARKER}\n`);
    await writeFile(join(outside, 'guide', 'intro.md'), `# Intro\n\n${MARKER}\n`);
    if (mode === 'root-symlink') {
      await mkdir(join(rootDir, 'content'), { recursive: true });
      await symlink(outside, join(rootDir, 'content', 'alpha'));
      await run(rootDir);
      return;
    }
    await mkdir(join(rootDir, 'content', 'alpha'), { recursive: true });
    const guide = join(rootDir, 'content', 'alpha', 'guide');
    if (mode === 'dir-symlink') {
      await symlink(join(outside, 'guide'), guide);
    } else {
      await mkdir(guide);
      if (mode === 'file-symlink') {
        await symlink('../../../../outside/private.txt', join(guide, 'intro.md'));
      } else {
        await writeFile(join(guide, 'intro.md'), '# Intro\n\nPublic content.\n');
      }
    }
    await run(rootDir);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

async function publishedText(publicDir: string): Promise<string> {
  if (!existsSync(publicDir)) return '';
  const parts: string[] = [];
  for (const entry of await readdir(publicDir, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) parts.push(await readFile(join(entry.parentPath, entry.name), 'utf8'));
  }
  return parts.join('\n');
}

export const contentSecurityTests = [
  {
    name: 'content build publishes a regular Markdown source (symlink control)',
    run: () =>
      withSite('regular', async (rootDir) => {
        const publicDir = join(rootDir, 'public');
        await generateDocsContent({ rootDir, publicDir, collections: [alphaCollection()] });
        const doc = JSON.parse(
          await readFile(join(publicDir, 'alpha-content', 'guide', 'intro.json'), 'utf8')
        );
        assert.match(doc.content, /Public content\./);
        const llms = createAllLlmsArtifacts({ rootDir, collections: [alphaCollection()] });
        assert.match(llms.llmsFullTxt, /Public content\./);
      }),
  },
  ...(['file-symlink', 'dir-symlink', 'root-symlink'] as const).map((mode) => ({
    name: `content build refuses a ${mode} source that points outside the content root`,
    run: () =>
      withSite(mode, async (rootDir) => {
        const publicDir = join(rootDir, 'public');
        await assert.rejects(
          generateDocsContent({ rootDir, publicDir, collections: [alphaCollection()] }),
          /symlink|regular file|escapes|outside/i
        );
        assert.doesNotMatch(await publishedText(publicDir), /DUMMY_PRIVATE_MARKER/);

        assert.throws(
          () => createAllLlmsArtifacts({ rootDir, collections: [alphaCollection()] }),
          /symlink|regular file|escapes|outside/i
        );

        // The resolver used for variants and framework paths checks too.
        assert.throws(
          () =>
            resolveDocFileInfo('guide/intro', {
              rootDir,
              contentDir: 'content/alpha',
            }),
          /symlink|regular file|escapes|outside/i
        );
      }),
  })),
];
