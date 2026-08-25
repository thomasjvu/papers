import { expect, test } from '@playwright/test';

function collectRuntimeErrors(page) {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  return { pageErrors, consoleErrors };
}

async function assertNoRuntimeErrors(errors) {
  expect(errors.pageErrors, `uncaught page errors: ${errors.pageErrors.join('\n')}`).toEqual([]);
  expect(errors.consoleErrors, `console errors: ${errors.consoleErrors.join('\n')}`).toEqual([]);
}

test('homepage and direct deep-doc reload render the configured shell', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'papers', exact: true })).toBeVisible();
  await expect(page.locator('a[href="/docs/getting-started/installation"]').first()).toBeVisible();

  await page.goto('/docs/getting-started/introduction', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: /^Introduction/ })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/docs\/getting-started\/introduction$/
  );
  await assertNoRuntimeErrors(errors);
});

test('sidebar navigation and Pagefind command-palette search reach another document', async ({
  page,
}) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/getting-started/introduction', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'User Guide', exact: true }).click();
  await page.getByText('advanced-features.md', { exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/user-guide\/advanced-features$/);

  await page.getByRole('button', { name: /Search docs/i }).click();
  const searchInput = page.getByPlaceholder('Search documentation or type a command...');
  await searchInput.fill('character notes');
  await expect(page.getByRole('button', { name: /Character Notes/i }).first()).toBeVisible({
    timeout: 15_000,
  });
  await page
    .getByRole('button', { name: /Character Notes/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/docs\/developer-guides\/character-notes$/);
  await assertNoRuntimeErrors(errors);
});

test('MDX blocks and Mermaid render in the static docs artifact', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/developer-guides/character-notes', { waitUntil: 'networkidle' });
  await expect(page.locator('.papers-character-note')).toHaveCount(5);
  await expect(page.locator('.papers-callout')).toBeVisible();
  await expect(page.locator('.papers-tabs__panel')).toHaveCount(2);

  await page.goto('/docs/developer-guides/best-practices', { waitUntil: 'networkidle' });
  await expect(page.locator('.mermaid-block')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.mermaid-block svg')).toBeVisible();
  await assertNoRuntimeErrors(errors);
});

test('OpenAPI default and alternate specs use distinct routes', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/api-reference/openapi', { waitUntil: 'networkidle' });
  await expect(page.locator('.openapi-page')).toBeVisible();
  await expect(page.getByText('Public API', { exact: true }).first()).toBeVisible();
  await page.getByRole('tab', { name: 'Internal API', exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/api-reference\/openapi\/internal$/);
  await expect(page.getByText('Internal API', { exact: true }).first()).toBeVisible();
  await assertNoRuntimeErrors(errors);
});

test('theme toggle, mobile shell, and explicit 404 behavior work', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/getting-started/introduction', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Open preferences' }).click();
  const themeButton = page.getByRole('button', { name: /Switch to (Light|Dark) Mode/i });
  const nextMode = (await themeButton.first().textContent()).includes('Light') ? 'Dark' : 'Light';
  await themeButton.first().click();
  await page.getByRole('button', { name: 'Open preferences' }).click();
  await expect(page.getByRole('button', { name: new RegExp(`Switch to ${nextMode} Mode`, 'i') })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/docs/getting-started/introduction', { waitUntil: 'networkidle' });
  const mobileMenu = page.getByRole('button', { name: 'Show documentation tree' });
  await mobileMenu.click();
  await expect(page.getByRole('button', { name: 'Close sidebar' }).first()).toBeVisible();

  await page.goto('/docs/does-not-exist', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'That page does not exist.' })).toBeVisible();
  await assertNoRuntimeErrors(errors);
});
