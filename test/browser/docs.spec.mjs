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
  expect(await page.locator('.mermaid-block svg path[d]').count()).toBeGreaterThan(0);
  await assertNoRuntimeErrors(errors);
});

test('KaTeX math and Mermaid diagrams with math labels render', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/developer-guides/math-and-diagrams', { waitUntil: 'networkidle' });

  const inline = page.locator('.math-inline[data-math-rendered="true"]');
  await expect(inline.first()).toBeVisible({ timeout: 15_000 });
  await expect(inline).toHaveCount(2);
  await expect(page.locator('.math-inline .katex math').first()).toBeAttached();
  // KaTeX layout relies on inline style sizing; it must survive sanitization.
  expect(await page.locator('.math-display .katex-html [style]').count()).toBeGreaterThan(0);
  await expect(page.getByText('this costs $5 and that costs $10.')).toBeVisible();

  const display = page.locator('.math-display[data-math-rendered="true"] .katex-display');
  await expect(display).toHaveCount(2);

  const diagrams = page.locator('.mermaid-block svg');
  await expect(diagrams).toHaveCount(2, { timeout: 20_000 });
  await expect(page.locator('.mermaid-block--error')).toHaveCount(0);
  // Geometry and labels must survive sanitization (regression: diagrams rendered empty).
  await expect(diagrams.first()).toContainText('Markdown source');
  expect(await diagrams.first().locator('path[d]').count()).toBeGreaterThan(0);
  const mathLabels = diagrams.nth(1).locator('foreignObject math');
  await expect(mathLabels.first()).toBeAttached();
  expect(await mathLabels.count()).toBeGreaterThanOrEqual(3);
  await expect(diagrams.nth(1).locator('script, a, [href^="javascript"]')).toHaveCount(0);
  await assertNoRuntimeErrors(errors);
});

test('KaTeX math renders in MDX pages', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/developer-guides/math-in-mdx', { waitUntil: 'networkidle' });
  await expect(page.locator('.math-inline[data-math-rendered="true"] .katex')).toHaveCount(1, {
    timeout: 15_000,
  });
  await expect(page.locator('.math-display[data-math-rendered="true"] .katex-display')).toHaveCount(
    2
  );
  await expect(page.getByText('Prices like $5 or $10')).toBeVisible();
  await expect(page.locator('.papers-callout')).toBeVisible();
  await assertNoRuntimeErrors(errors);
});

test('OpenAPI default and alternate specs use distinct routes', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  const scalarRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('/assets/esm-')) {
      scalarRequests.push(request.url());
    }
  });

  await page.goto('/docs/api-reference/openapi', { waitUntil: 'networkidle' });
  await expect(page.locator('.openapi-page')).toBeVisible();
  await expect(page.getByText('Public API', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('2 operations', { exact: true })).toBeVisible();
  await expect(
    page.locator('.openapi-overview').getByRole('heading', { name: 'Health check', exact: true })
  ).toBeVisible();
  await expect(scalarRequests).toHaveLength(0);
  await page.getByRole('button', { name: 'Load interactive viewer', exact: true }).click();
  await expect(page.locator('.scalar-api-reference')).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => scalarRequests.length).toBeGreaterThan(0);
  await page.getByRole('tab', { name: 'Internal API', exact: true }).click();
  await expect
    .poll(() => new URL(page.url()).pathname)
    .toBe('/docs/api-reference/openapi/internal');
  await expect(page.getByText('Internal API', { exact: true }).first()).toBeVisible();
  await expect(
    page
      .locator('.openapi-overview')
      .getByRole('heading', { name: 'Trigger docs build', exact: true })
  ).toBeVisible();
  await assertNoRuntimeErrors(errors);
});

test('generated OpenAPI operation route reloads with static reference parity', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/api-reference/openapi/operations/docs/get-docs/get-docs', {
    waitUntil: 'networkidle',
  });

  await expect(
    page.getByRole('heading', { name: 'List published docs', exact: true })
  ).toBeVisible();
  await expect(page.getByText('GET', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('/docs', { exact: true })).toBeVisible();
  await expect(page.locator('pre code').first()).toContainText('curl --request GET');
  await expect(page.locator('pre code').first()).toContainText(
    'https://api.example.com/docs?limit=20'
  );

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveCount(1);
  await expect(canonical).toHaveAttribute(
    'href',
    /\/docs\/api-reference\/openapi\/operations\/docs\/get-docs\/get-docs$/
  );
  await assertNoRuntimeErrors(errors);
});

test('generated OpenAPI model route reloads with its TypeScript definition', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/api-reference/openapi/models/docsmanifest', {
    waitUntil: 'networkidle',
  });

  await expect(page.getByRole('heading', { name: 'DocsManifest', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'TypeScript definition', exact: true })
  ).toBeVisible();
  const definition = page.locator('pre code').filter({ hasText: 'export interface DocsManifest' });
  await expect(definition).toBeVisible();
  await expect(definition).toContainText('count: number;');
  await expect(definition).toContainText('paths: Array<string>;');
  await assertNoRuntimeErrors(errors);
});

test('docs route supports reduced motion and keyboard focus', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/docs/getting-started/introduction', { waitUntil: 'networkidle' });

  await expect(page.locator('html')).toHaveClass(/reduce-motion/);
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus-visible');
  await expect(focused).toHaveCount(1);
  await expect(focused).toBeVisible();
  await expect(focused).toHaveAccessibleName(/papers/i);
  await expect(focused).toHaveCSS('outline-style', 'solid');
  await assertNoRuntimeErrors(errors);
});

test('generated reference graph renders backlinks on documentation pages', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/user-guide/configuration', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Referenced by' })).toBeVisible();
  await expect(page.getByText('user-guide/advanced-features', { exact: true })).toBeVisible();
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
  await expect(
    page.getByRole('button', { name: new RegExp(`Switch to ${nextMode} Mode`, 'i') })
  ).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/docs/getting-started/introduction', { waitUntil: 'networkidle' });
  const mobileMenu = page.getByRole('button', { name: 'Show documentation tree' });
  await mobileMenu.click();
  await expect(page.getByRole('button', { name: 'Close sidebar' }).first()).toBeVisible();

  await page.goto('/docs/does-not-exist', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'That page does not exist.' })).toBeVisible();
  await assertNoRuntimeErrors(errors);
});
