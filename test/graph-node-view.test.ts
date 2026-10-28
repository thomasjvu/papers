import assert from 'node:assert/strict';

import {
  getGraphNodeFlags,
  getGraphNodeLayout,
  getGraphNodeMotion,
  getGraphSwitchMotion,
  truncateGraphNodeTitle,
} from '../src/components/DocumentationGraph/graphNodeView.ts';

export const graphNodeViewTests = [
  {
    name: 'truncateGraphNodeTitle keeps 6 chars in the sidebar and 12 elsewhere',
    run: () => {
      assert.equal(truncateGraphNodeTitle('abcdef', true), 'abcdef');
      assert.equal(truncateGraphNodeTitle('abcdefg', true), 'abcdef...');
      assert.equal(truncateGraphNodeTitle('abcdefghijkl', false), 'abcdefghijkl');
      assert.equal(truncateGraphNodeTitle('abcdefghijklm', false), 'abcdefghijkl...');
    },
  },
  {
    name: 'getGraphNodeFlags prefers the focused node and hides the switch on the current page',
    run: () => {
      assert.deepEqual(getGraphNodeFlags('a', { currentPath: 'a' }), {
        isActive: true,
        showSwitch: false,
      });
      assert.deepEqual(getGraphNodeFlags('a', { currentPath: 'a', focusedNodeId: 'b' }), {
        isActive: false,
        showSwitch: false,
      });
      assert.deepEqual(
        getGraphNodeFlags('b', { currentPath: 'a', focusedNodeId: 'b', pendingSwitchNodeId: 'b' }),
        { isActive: true, showSwitch: true }
      );
      assert.deepEqual(getGraphNodeFlags('a', { currentPath: 'a', pendingSwitchNodeId: 'a' }), {
        isActive: true,
        showSwitch: false,
      });
      assert.deepEqual(getGraphNodeFlags('a', {}), { isActive: false, showSwitch: false });
    },
  },
  {
    name: 'getGraphNodeMotion staggers entry unless motion is reduced',
    run: () => {
      assert.deepEqual(getGraphNodeMotion(false, 3), {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0, opacity: 0 },
        transition: { duration: 0.5, delay: 0.15000000000000002 },
        whileHover: { scale: 1.1, transition: { duration: 0.2 } },
        whileTap: { scale: 0.95 },
      });
      assert.deepEqual(getGraphNodeMotion(true, 3), {
        initial: { scale: 1, opacity: 1 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 1, opacity: 1 },
        transition: { duration: 0.01, delay: 0 },
        whileHover: {},
        whileTap: {},
      });
      assert.deepEqual(getGraphSwitchMotion(false), {
        transition: { duration: 0.3, delay: 0.4 },
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
      });
      assert.deepEqual(getGraphSwitchMotion(true), {
        transition: { duration: 0.01, delay: 0 },
        whileHover: {},
        whileTap: {},
      });
    },
  },
  {
    name: 'getGraphNodeLayout sizes labels and the jump button per view',
    run: () => {
      assert.deepEqual(getGraphNodeLayout({ x: 100, y: 50, radius: 10, isSidebarView: false }), {
        labelY: 72,
        labelFontSize: 'var(--papers-text-2xs)',
        switchRect: { x: 76, y: 12, width: 48, height: 18, rx: 9 },
        switchLabelY: 21,
        switchLabelFontSize: 'var(--papers-text-xs)',
      });
      assert.deepEqual(getGraphNodeLayout({ x: 100, y: 50, radius: 10, isSidebarView: true }), {
        labelY: 68,
        labelFontSize: '0.75rem',
        switchRect: { x: 82, y: 20, width: 36, height: 14, rx: 7 },
        switchLabelY: 26,
        switchLabelFontSize: 'var(--papers-text-2xs)',
      });
    },
  },
];
