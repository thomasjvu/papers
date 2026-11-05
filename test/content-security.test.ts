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

// Stale-collection cleanup (audit F-3). public/collections.json from the last
// build decides which old artifacts are deleted. Ways it could delete outside
// public/, written before the fix:
// - an artifactNamespace with "../" segments;
// - an id with "../" segments and no artifactNamespace;
// - an absolute namespace;
// - a valid-looking namespace whose paths still resolve outside public/.
// The control proves a real retired collection is still cleaned up.
async function withStaleManifest(
  previous: unknown[],
  run: (paths: { rootDir: string; publicDir: string; victim: string }) => Promise<void>
) {
  await withSite('regular', async (rootDir) => {
    const publicDir = join(rootDir, 'public');
    const victim = join(rootDir, '..', 'victim');
    await mkdir(join(victim, 'data-content', 'nested'), { recursive: true });
    await writeFile(join(victim, 'data-content', 'nested', 'keep.txt'), 'keep\n');
    for (const name of ['data-index.json', 'data-collection.json', 'data-references.json']) {
      await writeFile(join(victim, name), '{}\n');
    }
    await mkdir(join(publicDir, 'old-content'), { recursive: true });
    await writeFile(join(publicDir, 'old-content', 'page.json'), '{}\n');
    await writeFile(join(publicDir, 'old-index.json'), '{}\n');
    await writeFile(
      join(publicDir, 'collections.json'),
      JSON.stringify({ collections: previous }) + '\n'
    );
    await run({ rootDir, publicDir, victim });
  });
}

function assertVictimIntact(victim: string) {
  assert.ok(existsSync(join(victim, 'data-content', 'nested', 'keep.txt')));
  for (const name of ['data-index.json', 'data-collection.json', 'data-references.json']) {
    assert.ok(existsSync(join(victim, name)), `${name} was deleted`);
  }
}

export const staleCleanupSecurityTests = [
  {
    name: 'stale cleanup still removes a retired collection inside public/ (control)',
    run: () =>
      withStaleManifest([{ id: 'old' }], async ({ rootDir, publicDir, victim }) => {
        await generateDocsContent({ rootDir, publicDir, collections: [alphaCollection()] });
        assert.equal(existsSync(join(publicDir, 'old-content')), false);
        assert.equal(existsSync(join(publicDir, 'old-index.json')), false);
        assertVictimIntact(victim);
      }),
  },
  ...[
    {
      label: 'a ../ artifactNamespace',
      entry: { id: 'old', artifactNamespace: '../../victim/data' },
    },
    { label: 'a ../ id', entry: { id: '../../victim/data' } },
    { label: 'an absolute namespace', entry: { id: 'old', artifactNamespace: '/ABS/data' } },
  ].map(({ label, entry }) => ({
    name: `stale cleanup ignores ${label} from public/collections.json`,
    run: () =>
      withStaleManifest([], async ({ rootDir, publicDir, victim }) => {
        const resolved = JSON.parse(
          JSON.stringify(entry).replace(
            '/ABS',
            join(victim, '..').replaceAll('\\', '/') + '/victim'
          )
        );
        await writeFile(
          join(publicDir, 'collections.json'),
          JSON.stringify({ collections: [resolved] }) + '\n'
        );
        await generateDocsContent({ rootDir, publicDir, collections: [alphaCollection()] });
        assertVictimIntact(victim);
        assert.ok(existsSync(join(publicDir, 'alpha-index.json')));
      }),
  })),
];
