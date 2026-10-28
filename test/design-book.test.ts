import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

import { parseDesignBook, resolveDesignBookSource } from '../scripts/lib/designBook.mjs';

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
  {
    name: 'parseDesignBook parses only strict scalars and skips comments',
    run: () => {
      const raw = parseDesignBook(
        [
          '---',
          'name: "Quoted',
          'version: 1.25',
          'build: v12',
          'size: 12px',
          'neg: -3',
          'enabled: true',
          '# comment: ignored',
          'note: a:b',
          '---',
          'Body\uFEFF',
        ].join('\n')
      );
      assert.deepEqual(raw.rawFrontmatter, {
        name: '"Quoted',
        version: 1.25,
        build: 'v12',
        size: '12px',
        neg: -3,
        enabled: true,
        note: 'a:b',
      });
      assert.equal(raw.body, 'Body\uFEFF');
      assert.equal(parseDesignBook('\uFEFF---\nname: Bom\n---\n').name, 'Bom');
      assert.equal(parseDesignBook('intro\n---\nname: X\n---\n').name, 'Design System');
    },
  },
  {
    name: 'resolveDesignBookSource prefers env, then config, then DESIGN.md',
    run: () => {
      const saved = process.env.PAPERS_DESIGN_BOOK_SOURCE;
      try {
        delete process.env.PAPERS_DESIGN_BOOK_SOURCE;
        assert.equal(resolveDesignBookSource('/r', undefined), '/r/DESIGN.md');
        assert.equal(resolveDesignBookSource('/r', { sourcePath: 'x/D.md' }), '/r/x/D.md');
        assert.equal(resolveDesignBookSource('/r', { sourcePath: '/abs/D.md' }), '/abs/D.md');
        process.env.PAPERS_DESIGN_BOOK_SOURCE = 'env.md';
        assert.equal(resolveDesignBookSource('/r', { sourcePath: 'x/D.md' }), '/r/env.md');
      } finally {
        if (saved === undefined) delete process.env.PAPERS_DESIGN_BOOK_SOURCE;
        else process.env.PAPERS_DESIGN_BOOK_SOURCE = saved;
      }
    },
  },
];
