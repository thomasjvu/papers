import { expect, test } from '@playwright/test';

const theme = process.env.PAPERS_VISUAL_THEME || 'default';
const pages = [
  ['home', '/'],
  ['intro', '/docs/getting-started/introduction'],
  ['math', '/docs/developer-guides/math-and-diagrams'],
  ['code', '/docs/developer-guides/code-examples'],
  ['openapi', '/docs/api-reference/openapi'],
];
const viewports = [
  ['desktop', { width: 1280, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
];

for (const mode of ['light', 'dark']) {
  for (const [viewportName, viewport] of viewports) {
    for (const [pageName, url] of pages) {
      test(`${theme} ${mode} ${viewportName} ${pageName}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: mode });
        await page.addInitScript((dark) => {
          localStorage.setItem('darkMode', String(dark));
          localStorage.setItem('prefersReducedMotion', 'true');
        }, mode === 'dark');
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        if (pageName === 'math') {
          await expect(page.locator('.mermaid-block svg')).toHaveCount(2, { timeout: 20_000 });
          await expect(page.locator('.math-display[data-math-rendered="true"]')).toHaveCount(2);
        }
        await page.waitForTimeout(400);
        await expect(page).toHaveScreenshot(`${theme}/${mode}-${viewportName}-${pageName}.png`, {
          fullPage: false,
        });
      });
    }
  }
}
