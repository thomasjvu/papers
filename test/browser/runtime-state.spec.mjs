import { expect, test } from '@playwright/test';

test('document transitions recover from a missing page and ignore an older response', async ({
  page,
}) => {
  await page.goto('/docs/getting-started/introduction');
  await expect(page.getByRole('heading', { name: /^Introduction/ })).toBeVisible();

  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  let requested;
  const started = new Promise((resolve) => {
    requested = resolve;
  });
  await page.route('**/docs-content/getting-started/installation.json', async (route) => {
    requested();
    await held;
    await route.fulfill({
      json: {
        path: 'getting-started/installation',
        title: 'Old response',
        content: '# Old response',
      },
    });
  });
  await page.locator('a[href="/docs/getting-started/installation"]').first().click();
  await started;
  // A second navigation supersedes the still-pending installation request.
  await page.getByRole('link', { name: 'introduction.md', exact: true }).first().click();
  await expect(page).toHaveURL(/\/docs\/getting-started\/introduction$/);
  const response = page.waitForResponse('**/docs-content/getting-started/installation.json');
  release();
  await (await response).finished();
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
  await expect(page.getByRole('heading', { name: /^Introduction/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Old response', exact: true })).toHaveCount(0);

  await page.goto('/docs/does-not-exist');
  await expect(page.getByText('404', { exact: true })).toBeVisible();
  await page.goto('/docs/getting-started/introduction');
  await expect(page.getByRole('heading', { name: /^Introduction/ })).toBeVisible();
});

test('Mermaid lightbox closes and reopens after rendering', async ({ page }) => {
  await page.goto('/docs/developer-guides/math-and-diagrams');
  const trigger = page.getByRole('button', { name: 'Expand diagram' }).first();
  await trigger.click();
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.mermaid-lightbox__content svg')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await trigger.click();
  await expect(page.locator('dialog[open] .mermaid-lightbox__content svg')).toBeVisible();
  await page.getByRole('button', { name: 'Close diagram' }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});
