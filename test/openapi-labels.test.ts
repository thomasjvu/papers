import assert from 'node:assert/strict';

import { schemaLabel, valueLabel } from '../src/lib/openapiLabels.ts';

export const openapiLabelTests = [
  {
    name: 'schemaLabel renders references, arrays, unions, objects, enums and primitives',
    run: () => {
      assert.equal(schemaLabel(undefined), 'unknown');
      assert.equal(schemaLabel({ kind: 'reference', name: 'Pet', ref: '#/Pet' }), 'Pet');
      assert.equal(schemaLabel({ kind: 'reference', ref: '#/Pet' }), '#/Pet');
      assert.equal(schemaLabel({ kind: 'reference' }), 'unknown');
      assert.equal(
        schemaLabel({ kind: 'array', items: { kind: 'primitive', type: 'string' } }),
        'Array<string>'
      );
      assert.equal(schemaLabel({ kind: 'array' }), 'Array<unknown>');
      const parts = [
        { kind: 'reference' as const, name: 'A' },
        { kind: 'primitive' as const, type: 'number' },
      ];
      assert.equal(schemaLabel({ kind: 'union', variant: 'oneOf', schemas: parts }), 'A | number');
      assert.equal(schemaLabel({ kind: 'union', variant: 'anyOf', schemas: parts }), 'A | number');
      assert.equal(schemaLabel({ kind: 'union', variant: 'allOf', schemas: parts }), 'A & number');
      assert.equal(schemaLabel({ kind: 'union', schemas: [] }), 'unknown');
      assert.equal(schemaLabel({ kind: 'union' }), 'unknown');
      assert.equal(schemaLabel({ kind: 'object', type: 'object-ish' }), 'object');
      assert.equal(
        schemaLabel({ kind: 'primitive', type: 'string', enum: ['a', 1, null] }),
        '"a" | 1 | null'
      );
      assert.equal(schemaLabel({ kind: 'primitive', type: 'string', enum: [] }), 'string');
      assert.equal(schemaLabel({ kind: 'primitive' }), 'unknown');
      assert.equal(schemaLabel({ kind: 'unknown', type: 'mystery', enum: ['x'] }), 'mystery');
      assert.equal(schemaLabel({ kind: 'unknown' }), 'unknown');
    },
  },
  {
    name: 'valueLabel keeps strings, pretty-prints JSON and falls back to String()',
    run: () => {
      assert.equal(valueLabel('raw'), 'raw');
      assert.equal(valueLabel({ a: 1 }), '{\n  "a": 1\n}');
      assert.equal(valueLabel(undefined), '');
      const cyclic: Record<string, unknown> = {};
      cyclic.self = cyclic;
      assert.equal(valueLabel(cyclic), '[object Object]');
      assert.equal(valueLabel(BigInt(5)), '5');
    },
  },
];
