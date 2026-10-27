import assert from 'node:assert/strict';
import { join } from 'node:path';

import { assertCondition, parseNpmPackJson, runCommand } from '../scripts/lib/processRun.mjs';
import { splitTargetSuffix } from '../scripts/lib/linkTargets.mjs';
import { getCollectionArtifactFiles } from '../scripts/lib/collectionArtifacts.mjs';
import { resolveSiteMetadata } from '../scripts/lib/siteMetadata.mjs';
import { createCollectionDocumentPaths } from '../scripts/generate-docs.mjs';

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
];
