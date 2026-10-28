import assert from 'node:assert/strict';

import {
  getBrandInitial,
  getFloatingButtonMotion,
  getPendingPathLabel,
  getRightRailTransition,
  getRightRailView,
  getShortcutLabel,
  getSidebarMotionVariants,
  getSidebarTransition,
  isMobileViewport,
  RIGHT_RAIL_PANEL_VARIANTS,
} from '../src/components/docs/documentationPageView.ts';

const ui = {
  interactiveMap: 'Map',
  onThisPage: 'On this page',
  showTableOfContents: 'Show TOC',
  showInteractiveMap: 'Show map',
};

export const documentationPageViewTests = [
  {
    name: 'documentation page labels: viewport, shortcut, pending path and brand initial',
    run: () => {
      assert.equal(isMobileViewport(767), true);
      assert.equal(isMobileViewport(768), false);
      assert.equal(getShortcutLabel('MacIntel'), 'Cmd + K');
      assert.equal(getShortcutLabel('Win32'), 'Ctrl + K');
      assert.equal(getShortcutLabel(undefined), 'Ctrl + K');
      assert.equal(getPendingPathLabel('guides/getting-started-now'), 'getting started now');
      assert.equal(getPendingPathLabel('intro'), 'intro');
      assert.equal(getPendingPathLabel(undefined), undefined);
      assert.equal(getBrandInitial('papers'), 'P');
      assert.equal(getBrandInitial(''), '');
    },
  },
  {
    name: 'getSidebarMotionVariants slides the mobile sidebar unless motion is reduced',
    run: () => {
      assert.deepEqual(getSidebarMotionVariants(false), {
        mobile: {
          initial: { opacity: 0, x: -96, position: 'fixed' },
          animate: { opacity: 1, x: 0, position: 'fixed' },
          exit: { opacity: 0, x: -96, position: 'fixed' },
        },
        desktop: {
          initial: { opacity: 1, x: 0, position: 'relative' },
          animate: { opacity: 1, x: 0, position: 'relative' },
          exit: { opacity: 1, x: 0, position: 'relative' },
        },
      });
      assert.deepEqual(getSidebarMotionVariants(true), {
        mobile: {
          initial: { opacity: 0, position: 'fixed' },
          animate: { opacity: 1, position: 'fixed' },
          exit: { opacity: 0, position: 'fixed' },
        },
        desktop: {
          initial: { opacity: 1, position: 'relative' },
          animate: { opacity: 1, position: 'relative' },
          exit: { opacity: 1, position: 'relative' },
        },
      });
      assert.deepEqual(getSidebarTransition(false), { duration: 0.25 });
      assert.deepEqual(getSidebarTransition(true), { duration: 0.05 });
    },
  },
  {
    name: 'getFloatingButtonMotion and right rail motion match the reduced-motion setting',
    run: () => {
      assert.deepEqual(getFloatingButtonMotion(true), {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0.05 },
      });
      assert.deepEqual(getFloatingButtonMotion(false), {
        whileHover: { scale: 1.06 },
        whileTap: { scale: 0.96 },
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
        transition: { duration: 0.2 },
      });
      assert.deepEqual(RIGHT_RAIL_PANEL_VARIANTS, {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      });
      assert.deepEqual(getRightRailTransition(false), { duration: 0.12, ease: 'easeOut' });
      assert.deepEqual(getRightRailTransition(true), { duration: 0.05, ease: 'easeOut' });
    },
  },
  {
    name: 'getRightRailView swaps title, colour, toggle label and icon',
    run: () => {
      assert.deepEqual(getRightRailView(true, ui), {
        title: 'Map',
        titleColor: 'var(--mindmap-text-color)',
        toggleLabel: 'Show TOC',
        toggleIcon: 'mingcute:sitemap-fill',
      });
      assert.deepEqual(getRightRailView(false, ui), {
        title: 'On this page',
        titleColor: 'var(--toc-text-color)',
        toggleLabel: 'Show map',
        toggleIcon: 'mingcute:brain-fill',
      });
    },
  },
];
