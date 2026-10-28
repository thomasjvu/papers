import assert from 'node:assert/strict';

import { getContentType } from '../scripts/lib/contentTypes.mjs';
import { evaluateAssertion } from '../scripts/lib/lighthouseAssertions.mjs';

export const scriptLibTests = [
  {
    name: 'getContentType maps preview file extensions case-insensitively',
    run: () => {
      const expected: Record<string, string> = {
        'a/index.html': 'text/html; charset=utf-8',
        'app.JS': 'text/javascript; charset=utf-8',
        'mod.mjs': 'text/javascript; charset=utf-8',
        'site.css': 'text/css; charset=utf-8',
        'data.json': 'application/json; charset=utf-8',
        'pagefind/x.pf_meta': 'application/json; charset=utf-8',
        'llms.txt': 'text/plain; charset=utf-8',
        'doc.md': 'text/markdown; charset=utf-8',
        'sitemap.xml': 'application/xml; charset=utf-8',
        'logo.svg': 'image/svg+xml',
        'pf.wasm': 'application/wasm',
        'x.pagefind': 'application/wasm',
        'font.woff2': 'application/octet-stream',
        Makefile: 'application/octet-stream',
        toString: 'application/octet-stream',
        'x.constructor': 'application/octet-stream',
      };
      for (const [file, type] of Object.entries(expected)) {
        assert.equal(getContentType(file), type, file);
      }
    },
  },
  {
    name: 'evaluateAssertion scores categories and audits and rejects bad formats',
    run: () => {
      const lhr = {
        categories: { performance: { score: 0.9 } },
        audits: { 'total-byte-weight': { numericValue: 500 } },
      };
      assert.deepEqual(
        evaluateAssertion(lhr, 'categories:performance', ['error', { minScore: 0.9 }]),
        {
          id: 'categories:performance',
          level: 'error',
          actual: 0.9,
          passes: true,
        }
      );
      assert.equal(
        evaluateAssertion(lhr, 'categories:performance', ['warn', { minScore: 0.91 }]).passes,
        false
      );
      assert.deepEqual(evaluateAssertion(lhr, 'categories:seo', ['warn', { minScore: 0 }]), {
        id: 'categories:seo',
        level: 'warn',
        actual: undefined,
        passes: false,
      });
      assert.equal(
        evaluateAssertion(lhr, 'total-byte-weight', ['error', { maxNumericValue: 500 }]).passes,
        true
      );
      assert.equal(
        evaluateAssertion(lhr, 'total-byte-weight', ['error', { maxNumericValue: 499 }]).passes,
        false
      );
      assert.equal(
        evaluateAssertion({}, 'missing', ['error', { maxNumericValue: 1 }]).passes,
        false
      );
      assert.throws(
        () => evaluateAssertion(lhr, 'x', 'error'),
        /^Error: Unsupported assertion format for x$/
      );
      assert.throws(
        () => evaluateAssertion(lhr, 'x', ['error']),
        /Unsupported assertion format for x/
      );
      assert.throws(
        () => evaluateAssertion(lhr, 'x', ['off', {}]),
        /^Error: Unsupported assertion level for x: off$/
      );
    },
  },
];
