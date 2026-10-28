import assert from 'node:assert/strict';

import {
  findDefaultSnippetIndex,
  getCodeLineProps,
  getCodeView,
  getSnippetLabel,
  normalizeLanguage,
  resolveLineNumbersVisible,
} from '../src/components/codeBlockView.ts';

const classNames = { line: 'L', highlighted: 'H', added: 'A', removed: 'R' };

export const codeBlockViewTests = [
  {
    name: 'normalizeLanguage maps aliases to registered Prism grammars',
    run: () => {
      const cases: Record<string, string | undefined> = {
        env: 'bash',
        sh: 'bash',
        Shell: 'bash',
        py: 'python',
        yml: 'yaml',
        rs: 'rust',
        HTML: 'markup',
        xml: 'markup',
        js: 'javascript',
        md: 'markdown',
        ts: 'typescript',
        TSX: 'tsx',
        css: 'css',
        json: 'json',
        diff: 'diff',
        sql: 'sql',
        go: 'go',
        jsx: undefined,
        toml: undefined,
        '': undefined,
      };
      for (const [input, expected] of Object.entries(cases)) {
        assert.equal(normalizeLanguage(input), expected, input);
      }
    },
  },
  {
    name: 'findDefaultSnippetIndex only applies to multi-tab blocks',
    run: () => {
      const snippets = [{ language: 'bash' }, { language: 'TypeScript' }];
      assert.equal(findDefaultSnippetIndex(snippets, 'typescript'), 1);
      assert.equal(findDefaultSnippetIndex(snippets, 'BASH'), 0);
      assert.equal(findDefaultSnippetIndex(snippets, 'go'), -1);
      assert.equal(findDefaultSnippetIndex(snippets, undefined), -1);
      assert.equal(findDefaultSnippetIndex(snippets, ''), -1);
      assert.equal(findDefaultSnippetIndex([{ language: 'bash' }], 'bash'), -1);
    },
  },
  {
    name: 'getSnippetLabel prefers the label, then a display name',
    run: () => {
      assert.equal(getSnippetLabel({ label: 'npm', language: 'bash' }), 'npm');
      assert.equal(getSnippetLabel({ language: 'typescript' }), 'TypeScript');
      assert.equal(getSnippetLabel({ label: '', language: 'zig' }), 'ZIG');
    },
  },
  {
    name: 'getCodeView trims code, detects diffs and only wraps lines with metadata',
    run: () => {
      const plain = getCodeView(
        { language: 'ts', code: '\n a\nb \n', title: 'file.ts' },
        undefined
      );
      assert.deepEqual(
        { ...plain, highlighted: [...plain.highlighted] },
        {
          isDiff: false,
          normalizedLanguage: 'typescript',
          snippetTitle: 'file.ts',
          trimmedCode: 'a\nb',
          codeLines: ['a', 'b'],
          highlighted: [],
          needsLineProps: false,
        }
      );
      const diff = getCodeView({ language: 'diff-js', code: '+a\n-b' }, 'Override');
      assert.equal(diff.isDiff, true);
      assert.equal(diff.normalizedLanguage, 'javascript');
      assert.equal(diff.snippetTitle, 'Override');
      assert.equal(diff.needsLineProps, true);
      const highlightedOnly = getCodeView({ language: 'txt', code: 'x', highlightLines: [1] }, '');
      assert.equal(highlightedOnly.needsLineProps, true);
      assert.equal(highlightedOnly.normalizedLanguage, undefined);
      assert.equal(highlightedOnly.snippetTitle, '');
    },
  },
  {
    name: 'resolveLineNumbersVisible lets the toggle beat the fence beat the default',
    run: () => {
      assert.equal(resolveLineNumbersVisible(false, { showLineNumbers: true }, true), false);
      assert.equal(resolveLineNumbersVisible(true, { showLineNumbers: false }, false), true);
      assert.equal(resolveLineNumbersVisible(null, { showLineNumbers: false }, true), false);
      assert.equal(resolveLineNumbersVisible(null, {}, false), false);
      assert.equal(resolveLineNumbersVisible(null, {}, true), true);
    },
  },
  {
    name: 'getCodeLineProps marks highlighted, added and removed lines',
    run: () => {
      const view = getCodeView(
        { language: 'diff', code: '+add\n-del\n+++ file\n--- file\n ctx', highlightLines: [1, 5] },
        undefined
      );
      const props = [1, 2, 3, 4, 5, 6].map((line) => getCodeLineProps(line, view, classNames));
      assert.deepEqual(props, [
        { className: 'L H A', style: { display: 'block' }, 'data-line-kind': 'added' },
        { className: 'L R', style: { display: 'block' }, 'data-line-kind': 'removed' },
        { className: 'L', style: { display: 'block' } },
        { className: 'L', style: { display: 'block' } },
        { className: 'L H', style: { display: 'block' } },
        { className: 'L', style: { display: 'block' } },
      ]);
      const notDiff = getCodeView({ language: 'js', code: '+x' }, undefined);
      assert.deepEqual(getCodeLineProps(1, notDiff, classNames), {
        className: 'L',
        style: { display: 'block' },
      });
    },
  },
];
