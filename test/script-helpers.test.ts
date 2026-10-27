import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { assertCondition, parseNpmPackJson, runCommand } from '../scripts/lib/processRun.mjs';
import { splitTargetSuffix } from '../scripts/lib/linkTargets.mjs';
import { getCollectionArtifactFiles } from '../scripts/lib/collectionArtifacts.mjs';
import { resolveSiteMetadata } from '../scripts/lib/siteMetadata.mjs';
import { createCollectionDocumentPaths } from '../scripts/generate-docs.mjs';
import { validateDocumentationContent } from '../scripts/lib/contentValidation.mjs';

type TestCase = { name: string; run: () => void | Promise<void> };

export const scriptHelperTests: TestCase[] = [
  {
    name: 'runCommand returns stdout, merges env and reports failing commands with output',
    run: () => {
      const node = process.execPath;
      assert.equal(runCommand(node, ['-e', 'process.stdout.write("ok")']), 'ok');
      assert.equal(
        runCommand(node, ['-e', 'process.stdout.write(process.env.PAPERS_X + process.cwd())'], {
          cwd: '/',
          env: { PAPERS_X: 'v' },
        }),
        'v/'
      );
      assert.throws(
        () => runCommand(node, ['-e', 'console.log("out");console.error("err");process.exit(3)']),
        (error: Error) =>
          error.message.startsWith(`${node} -e `) && error.message.includes('failed:\nout\n\nerr\n')
      );
      assert.throws(() => runCommand('papers-command-that-does-not-exist', []), /ENOENT/);
    },
  },
  {
    name: 'parseNpmPackJson skips npm noise before the JSON array and rejects missing JSON',
    run: () => {
      assert.deepEqual(parseNpmPackJson('npm notice\n[{"name":"x"}]'), [{ name: 'x' }]);
      assert.throws(() => parseNpmPackJson('no json'), /npm pack did not return JSON:\nno json/);
    },
  },
  {
    name: 'assertCondition throws the given message only for falsy conditions',
    run: () => {
      assertCondition(true, 'unused');
      assert.throws(() => assertCondition(0, 'boom'), /^Error: boom$/);
    },
  },
  {
    name: 'splitTargetSuffix splits at the first hash or query',
    run: () => {
      assert.deepEqual(splitTargetSuffix('a/b'), { pathname: 'a/b', suffix: '' });
      assert.deepEqual(splitTargetSuffix('a#h?q'), { pathname: 'a', suffix: '#h?q' });
      assert.deepEqual(splitTargetSuffix('a?q#h'), { pathname: 'a', suffix: '?q#h' });
      assert.deepEqual(splitTargetSuffix('a#h'), { pathname: 'a', suffix: '#h' });
      assert.deepEqual(splitTargetSuffix('a?q'), { pathname: 'a', suffix: '?q' });
    },
  },
  {
    name: 'getCollectionArtifactFiles maps artifact URLs into the public directory',
    run: () => {
      const files = getCollectionArtifactFiles('/pub', { id: 'docs' });
      assert.deepEqual(files, {
        indexPath: join('/pub', 'docs-index.json'),
        contentDir: join('/pub', 'docs-content'),
        manifestPath: join('/pub', 'docs-collection.json'),
        referencesPath: join('/pub', 'docs-references.json'),
      });
    },
  },
  {
    name: 'resolveSiteMetadata prefers Vite env values over homepage defaults',
    run: () => {
      const defaults = { siteName: 'D', siteSubtitle: 'S', siteDescription: 'Desc' };
      assert.deepEqual(resolveSiteMetadata({}, defaults), {
        siteName: 'D',
        siteUrl: '',
        siteSubtitle: 'S',
        siteDescription: 'Desc',
      });
      assert.deepEqual(
        resolveSiteMetadata({ VITE_SITE_NAME: 'N', VITE_SITE_URL: 'https://x' }, defaults),
        { siteName: 'N', siteUrl: 'https://x', siteSubtitle: 'S', siteDescription: 'Desc' }
      );
      assert.equal(typeof resolveSiteMetadata({}).siteName, 'string');
    },
  },
  {
    name: 'createCollectionDocumentPaths dedupes and sorts tree and framework paths',
    run: () => {
      const collection = {
        id: 'guides',
        tree: [
          { type: 'file', path: 'b' },
          { type: 'file', path: 'a' },
        ],
        frameworkDocPaths: ['b', 'c'],
      };
      assert.deepEqual(createCollectionDocumentPaths(collection), {
        collection,
        documentationTree: collection.tree,
        documentPaths: ['a', 'b', 'c'],
      });
      assert.deepEqual(
        createCollectionDocumentPaths({ id: 'x', frameworkDocPaths: [] }).documentPaths,
        []
      );
    },
  },
  {
    name: 'content validation resolves route, relative, asset and anchor link targets',
    run: async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'papers-link-targets-'));
      const links = [
        '[query](?tab=1)',
        '[bad encoding](%E0%A4%A)',
        '[route](/docs/guide/other#intro)',
        '[route bad anchor](/docs/guide/other#nope)',
        '[route missing](/docs/guide/missing)',
        '[public asset](/logo.png)',
        '[relative](./other#intro)',
        '[relative bad anchor](./other.md#nope)',
        '[relative missing](./missing)',
        '[sibling asset](./diagram.svg)',
        '[escape](../../outside.png)',
      ];
      try {
        await mkdir(join(tempDir, 'content', 'guide'), { recursive: true });
        await mkdir(join(tempDir, 'public'), { recursive: true });
        await writeFile(join(tempDir, 'public', 'logo.png'), '');
        await writeFile(join(tempDir, 'content', 'guide', 'diagram.svg'), '<svg/>');
        await writeFile(join(tempDir, 'content', 'guide', 'other.md'), '# Other\n\n## Intro\n');
        await writeFile(
          join(tempDir, 'content', 'guide', 'page.md'),
          ['# Page', '', ...links].join('\n')
        );
        const result = await validateDocumentationContent({
          rootDir: tempDir,
          contentRoot: 'content',
          publicDir: 'public',
          documentationTree: [
            { type: 'file' as const, name: 'Page.md', path: 'guide/page' },
            { type: 'file' as const, name: 'Other.md', path: 'guide/other' },
          ],
          versionConfig: { enabled: false, current: '1.0', versions: ['1.0'], labels: {} },
          i18nConfig: { enabled: false, defaultLocale: 'en', locales: ['en'] },
          openapiConfig: {
            enabled: false,
            pagePath: 'api-reference/openapi',
            defaultSpecId: 'public',
            specs: [],
          },
        });
        assert.deepEqual(result.issues, [
          'content/guide/page.md:4: invalid encoded link target "%E0%A4%A"',
          'content/guide/page.md:6: unresolved heading anchor "#nope"',
          'content/guide/page.md:7: unresolved internal link target "/docs/guide/missing"',
          'content/guide/page.md:10: unresolved heading anchor "#nope"',
          'content/guide/page.md:11: unresolved internal link target "./missing"',
          'content/guide/page.md:13: unresolved internal link target "../../outside.png"',
        ]);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    },
  },
];
