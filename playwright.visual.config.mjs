import { defineConfig, devices } from '@playwright/test';

import baseConfig from './playwright.config.mjs';

/**
 * Visual regression snapshots, per build-time theme. Usage:
 *   VITE_PAPERS_THEME=gba npm run build
 *   PAPERS_VISUAL_THEME=gba npx playwright test -c playwright.visual.config.mjs [--update-snapshots]
 * See scripts/visual-check.mjs to run every theme.
 */
export default defineConfig({
  ...baseConfig,
  testDir: './test/visual',
  fullyParallel: true,
  retries: 0,
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide' },
  },
  use: { ...baseConfig.use, ...devices['Desktop Chrome'], video: 'off', trace: 'off' },
});
