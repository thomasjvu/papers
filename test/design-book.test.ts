import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

import { parseDesignBook } from '../scripts/lib/designBook.mjs';

const fixture = (name: string) => new URL(`./fixtures/design-book/${name}`, import.meta.url);

export const designBookTests = [
  {
    name: 'parseDesignBook pins tokens parsed from the frontmatter subset',
    run: async () => {
      const parsed = parseDesignBook(await readFile(fixture('input.md'), 'utf8'));
      const actual = `${JSON.stringify(parsed, null, 2)}\n`;
      if (process.env.UPDATE_DESIGN_BOOK_GOLDEN === '1') {
        await writeFile(fixture('expected.json'), actual);
      }
      assert.equal(actual, await readFile(fixture('expected.json'), 'utf8'));
    },
  },
  {
    name: 'parseDesignBook falls back to defaults without frontmatter',
    run: () => {
      const parsed = parseDesignBook('# Just a body\r\n');
      assert.equal(parsed.name, 'Design System');
      assert.equal(parsed.version, 'alpha');
      assert.equal(parsed.description, '');
      assert.deepEqual(parsed.tokens.colors, []);
      assert.equal(parsed.body, '# Just a body\r\n');
      const crlf = parseDesignBook('---\r\nname: X\r\n---\r\n\r\nBody');
      assert.equal(crlf.name, 'X');
      assert.equal(crlf.body, 'Body');
    },
  },
];
