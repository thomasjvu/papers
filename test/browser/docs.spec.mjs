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

test('KaTeX math and Mermaid diagrams render in MDX pages', async ({ page }) => {
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

test('hover and focus states match the Tailwind 3 baseline', async ({ page }) => {
  // Expected values were measured on the Tailwind 3 build before the v4 migration.
  const errors = collectRuntimeErrors(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('darkMode', 'false');
    localStorage.setItem('prefersReducedMotion', 'true');
  });
  const style = (locator, property) =>
    locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

  await page.goto('/docs/getting-started/introduction', { waitUntil: 'networkidle' });
  const sidebarItem = page.getByText('quick-start.md', { exact: true }).locator('xpath=..');
  await page.mouse.move(1279, 899);
  expect(await style(sidebarItem, 'background-color')).toBe('rgba(0, 0, 0, 0)');
  await sidebarItem.hover();
  await expect.poll(() => style(sidebarItem, 'background-color')).toBe('rgba(0, 0, 0, 0.05)');

  const search = page.getByRole('button', { name: /Search docs/i });
  await page.mouse.move(1279, 899);
  await page.keyboard.press('Shift');
  await search.focus();
  await expect.poll(() => style(search, 'outline-style')).toBe('solid');
  expect(await style(search, 'outline-width')).toBe('2px');
  expect(await style(search, 'box-shadow')).toBe('rgba(17, 17, 17, 0.16) 0px 0px 0px 2px');

  await page.goto('/', { waitUntil: 'networkidle' });
  const hero = page.getByRole('link', { name: /Installation/ }).first();
  await hero.hover();
  // Tailwind 4 scales with the `scale` property instead of `transform`.
  await expect.poll(() => style(hero, 'scale')).toBe('1.05');
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

test('callouts, GitHub alerts, and code fence metadata render accessibly', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/developer-guides/callouts-and-code', { waitUntil: 'networkidle' });
  for (const type of ['note', 'tip', 'info', 'warning', 'danger']) {
    await expect(page.locator(`.admonition-${type}`).first()).toBeVisible();
  }
  await expect(page.getByRole('note', { name: 'Breaking change' })).toBeVisible();
  await expect(page.getByRole('note', { name: 'Caution' })).toBeVisible();
  await expect(page.locator('.admonition-info .admonition-tip')).toHaveCount(1);

  await expect(page.locator('[data-code-title]', { hasText: 'src/greet.ts' })).toBeVisible();
  const highlighted = page.locator('[class*="codeLineHighlighted"]');
  await expect(highlighted).toHaveCount(3);
  await expect(highlighted.first()).toContainText('@vitejs/plugin-react');
  const packageDiff = page
    .locator('[data-code-title]', { hasText: /^package\.json$/ })
    .locator('xpath=../..');
  await expect(packageDiff.locator('[data-line-kind="added"]')).toHaveCount(1);
  await expect(packageDiff.locator('[data-line-kind="removed"]')).toHaveCount(1);

  // Diff lines take their colors from the theme tokens, in both color modes.
  const diffColors = async (dark) => {
    await page.evaluate((value) => localStorage.setItem('darkMode', String(value)), dark);
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveClass(dark ? /\bdark\b/ : /^(?!.*\bdark\b)/);
    return packageDiff.evaluate((block) => {
      const added = block.querySelector('[data-line-kind="added"]');
      const removed = block.querySelector('[data-line-kind="removed"]');
      // The default theme writes these tokens as rgba(); the build may shorten 0.1 to .1.
      const token = (name) => getComputedStyle(added).getPropertyValue(name).trim();
      return {
        added: getComputedStyle(added).backgroundColor,
        removed: getComputedStyle(removed).backgroundColor,
        addedEdge: getComputedStyle(added).borderLeftColor,
        insertedBg: token('--code-inserted-bg'),
        deletedBg: token('--code-deleted-bg'),
      };
    });
  };
  const channels = (color) => (color.match(/[\d.]+/g) ?? []).map(Number);
  const light = await diffColors(false);
  expect(channels(light.added)).toEqual(channels(light.insertedBg));
  expect(channels(light.removed)).toEqual(channels(light.deletedBg));
  expect(light.added).not.toBe(light.removed);
  const dark = await diffColors(true);
  expect(channels(dark.added)).toEqual(channels(dark.insertedBg));
  expect(dark.addedEdge).not.toBe(light.addedEdge);
  await assertNoRuntimeErrors(errors);
});

test('MDX pages render callouts and code fence metadata', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/developer-guides/callouts-in-mdx', { waitUntil: 'networkidle' });
  await expect(page.getByRole('note', { name: 'Breaking change' })).toBeVisible();
  await expect(page.getByRole('note', { name: 'Shortcode form' })).toBeVisible();
  await expect(page.locator('.admonition-info .admonition-tip')).toHaveCount(1);
  await expect(page.locator('.admonition-tip', { hasText: 'GitHub alert' })).toBeVisible();
  await expect(page.locator('[data-code-title]', { hasText: 'setup.sh' })).toBeVisible();
  await expect(page.locator('[data-line-kind="added"]')).toHaveCount(1);
  await expect(page.locator('[data-line-kind="removed"]')).toHaveCount(1);
  await assertNoRuntimeErrors(errors);
});

test('MDX code blocks get the copy button and syntax highlighting', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/developer-guides/callouts-in-mdx', { waitUntil: 'networkidle' });
  const setup = page.locator('[data-code-title]', { hasText: 'setup.sh' });
  await expect(setup).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy to clipboard' }).first()).toBeVisible();
  await expect(page.locator('[class*="codeLineHighlighted"]')).toContainText(
    'npm run generate:docs'
  );
  await expect(page.locator('[data-line-kind="added"]')).toHaveCount(1);
  await assertNoRuntimeErrors(errors);
});

test('doc pages show a build-time last-updated date', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/getting-started/introduction', { waitUntil: 'networkidle' });
  const updated = page.locator('.doc-page-updated');
  await expect(updated).toContainText('Last updated');
  const iso = await updated.locator('time').getAttribute('datetime');
  expect(Number.isNaN(Date.parse(iso))).toBe(false);
  await assertNoRuntimeErrors(errors);
});

test('grouped content tabs sync across the page and persist after reload', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/developer-guides/callouts-and-code', { waitUntil: 'networkidle' });
  const sets = page.locator('.md-tabs[data-tabs-group="pkg"]');
  // Two top-level sets plus the inner set of the nested tabs example.
  await expect(sets).toHaveCount(3);
  await expect(sets.nth(1).getByRole('tab', { name: 'npm', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  );

  await sets.nth(0).getByRole('tab', { name: 'pnpm', exact: true }).click();
  await expect(sets.nth(1).getByRole('tab', { name: 'pnpm', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await expect(sets.nth(1).getByRole('tabpanel')).toContainText('pnpm dev');

  await sets.nth(1).getByRole('tab', { name: 'pnpm', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(sets.nth(0).getByRole('tab', { name: 'npm', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await page.keyboard.press('ArrowRight');

  await page.reload({ waitUntil: 'networkidle' });
  await expect(sets.nth(0).getByRole('tab', { name: 'pnpm', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await assertNoRuntimeErrors(errors);
});

test('doc routes ship a per-page PNG social card with an SVG fallback', async ({
  page,
  request,
}) => {
  const response = await request.get('/docs/getting-started/introduction');
  const html = await response.text();
  const match = html.match(/property="og:image"\s+content="([^"]+)"/);
  expect(match?.[1]).toMatch(/\/images\/og\/docs\/getting-started\/introduction\.png$/);
  const imagePath = new URL(match[1], 'http://localhost').pathname;
  const image = await request.get(imagePath);
  expect(image.ok()).toBe(true);
  const png = await image.body();
  // PNG signature + IHDR dimensions (1200x630).
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
  test.info().attachments.push({ name: 'social-card.png', contentType: 'image/png', body: png });

  const fallback = await request.get(imagePath.replace(/\.png$/, '.svg'));
  expect(fallback.ok()).toBe(true);
  expect(await fallback.text()).toContain('Introduction');

  await page.goto('/docs/getting-started/introduction', { waitUntil: 'networkidle' });
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    /\/images\/og\/docs\/getting-started\/introduction\.png$/
  );
});

test('collapsible callouts open from the keyboard', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/developer-guides/callouts-and-code', { waitUntil: 'networkidle' });
  const details = page.locator('details.admonition-details').first();
  await expect(details).not.toHaveAttribute('open', '');
  await expect(details.locator('.admonition-content')).toBeHidden();
  await details.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(details.locator('.admonition-content')).toBeVisible();
  await assertNoRuntimeErrors(errors);
});

test('code blocks support word highlights, diff colours, and a line-number toggle', async ({
  page,
}) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/developer-guides/callouts-and-code', { waitUntil: 'networkidle' });
  await expect(page.locator('mark.code-word-highlight', { hasText: 'apiKey' })).toHaveCount(2);
  await expect(page.locator('mark.code-word-highlight', { hasText: 'fetchDocs' })).toHaveCount(1);

  const diffTs = page
    .locator('[data-code-title]', { hasText: /^greet\.ts$/ })
    .locator('xpath=../..');
  await expect(diffTs.locator('[data-line-kind="added"]')).toHaveCount(1);
  // diff-ts is tokenized as TypeScript, not as plain diff text.
  await expect(diffTs.locator('.token', { hasText: /^function$/ })).toHaveCount(1);

  const plain = page
    .locator('[data-code-title]', { hasText: 'src/greet.ts' })
    .locator('xpath=../..');
  await expect(plain.locator('.linenumber').first()).toBeVisible();
  const toggle = plain.getByRole('button', { name: 'Hide line numbers' });
  await toggle.click();
  await expect(plain.locator('.linenumber')).toHaveCount(0);
  await expect(plain.getByRole('button', { name: 'Show line numbers' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  await assertNoRuntimeErrors(errors);
});

test('MDX nested code blocks are interactive and MDX tabs sync with Markdown tabs', async ({
  page,
}) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/developer-guides/callouts-in-mdx', { waitUntil: 'networkidle' });
  const callout = page.getByRole('note', { name: 'Install command' });
  await expect(callout.locator('[data-code-title]', { hasText: 'install.sh' })).toBeVisible();
  await expect(callout.getByRole('button', { name: 'Copy to clipboard' })).toBeVisible();

  const tabs = page.locator('.papers-tabs[data-tabs-group="pkg"]').first();
  await tabs.getByRole('tab', { name: 'pnpm', exact: true }).click();
  await expect(tabs.getByRole('tabpanel')).toContainText('pnpm dev');
  await expect(tabs.getByRole('button', { name: 'Copy to clipboard' })).toBeVisible();

  await page.goto('/docs/developer-guides/callouts-and-code', { waitUntil: 'networkidle' });
  await expect(
    page
      .locator('.md-tabs[data-tabs-group="pkg"]')
      .first()
      .getByRole('tab', { name: 'pnpm', exact: true })
  ).toHaveAttribute('aria-selected', 'true');
  await assertNoRuntimeErrors(errors);
});

test('steps and cards render in Markdown and MDX', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/developer-guides/steps-and-cards', { waitUntil: 'networkidle' });
  await expect(page.locator('.papers-steps > ol > li')).toHaveCount(3);
  await expect(
    page.locator('.papers-steps').getByRole('button', { name: 'Copy to clipboard' })
  ).toHaveCount(2);
  const card = page.locator('.papers-card-grid .papers-card').first();
  await card.getByRole('link', { name: 'Callouts and code' }).click();
  await expect(page).toHaveURL(/\/docs\/developer-guides\/callouts-and-code$/);

  await page.goto('/docs/developer-guides/callouts-in-mdx', { waitUntil: 'networkidle' });
  await expect(page.locator('.papers-steps > ol > li')).toHaveCount(2);
  await expect(page.locator('.papers-card-grid .papers-card')).toHaveCount(2);
  await assertNoRuntimeErrors(errors);
});

test('search scope buttons and heading-level results jump to the matching section', async ({
  page,
}) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/docs/getting-started/introduction', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Search docs/i }).click();
  const scopes = page.getByRole('radiogroup', { name: 'Search scope' });
  await expect(scopes.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true');
  await scopes.getByRole('radio', { name: 'Docs' }).click();
  await expect(scopes.getByRole('radio', { name: 'Docs' })).toHaveAttribute('aria-checked', 'true');
  // Commands are hidden outside the "All" scope.
  await expect(page.getByRole('button', { name: /Switch to (Light|Dark) Mode/ })).toHaveCount(0);

  const input = page.getByPlaceholder('Search documentation or type a command...');
  await input.fill('collapsible callouts');
  const sectionResult = page
    .locator('[data-command-palette] button')
    .filter({ hasText: 'Collapsible Callouts' })
    .filter({ has: page.locator('[data-search-section]', { hasText: 'Callouts And Code Blocks' }) })
    .first();
  await expect(sectionResult).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: test.info().outputPath('search-section-results.png') });
  await sectionResult.click();
  await expect(page).toHaveURL(/\/docs\/developer-guides\/callouts-and-code#collapsible-callouts$/);
  await expect(page.locator('#collapsible-callouts')).toBeInViewport({ timeout: 10_000 });

  await page.getByRole('button', { name: /Search docs/i }).click();
  await scopes.getByRole('radio', { name: 'API' }).click();
  await input.fill('collapsible callouts');
  await expect(page.getByText(/No results found for/)).toBeVisible({ timeout: 15_000 });
  await assertNoRuntimeErrors(errors);
});

test('direct links to a heading scroll it into view after the page renders', async ({ page }) => {
  await page.goto('/docs/developer-guides/callouts-and-code#collapsible-callouts', {
    waitUntil: 'networkidle',
  });
  await expect(page.locator('#collapsible-callouts')).toBeInViewport({ timeout: 10_000 });
});

test('Pagefind index supports section filters for docs: and api: scopes', async ({ page }) => {
  await page.goto('/docs/getting-started/introduction', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Search docs/i }).click();
  await page
    .getByPlaceholder('Search documentation or type a command...')
    .fill('docs: content tabs');
  await expect(page.getByRole('button', { name: /Callouts And Code Blocks/i }).first()).toBeVisible(
    {
      timeout: 15_000,
    }
  );
  const counts = await page.evaluate(async () => {
    const pagefind = window.pagefind;
    const docs = await pagefind.search('character', { filters: { section: 'docs' } });
    const api = await pagefind.search('character', { filters: { section: 'api' } });
    const apiOnly = await pagefind.search('get', { filters: { section: 'api' } });
    const apiData = await Promise.all(apiOnly.results.slice(0, 5).map((result) => result.data()));
    return {
      docs: docs.results.length,
      api: api.results.length,
      apiKinds: Array.from(new Set(apiData.map((data) => data.meta.kind))),
    };
  });
  expect(counts.docs).toBeGreaterThan(0);
  expect(counts.api).toBe(0);
  for (const kind of counts.apiKinds) expect(kind).toMatch(/^openapi-/);
});

test('sidebar, mindmap and command labels come from the interface strings', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/getting-started/introduction', { waitUntil: 'networkidle' });
  await expect(page.getByRole('navigation', { name: 'Documentation' })).toBeVisible();
  const railHeading = page.locator('.right-rail-header h3');
  const initial = (await railHeading.textContent())?.trim();
  expect(['On This Page', 'Interactive Map']).toContain(initial);
  await page.locator('.right-rail-toggle').click();
  await expect(railHeading).toHaveText(
    initial === 'On This Page' ? 'Interactive Map' : 'On This Page'
  );
  if ((await railHeading.textContent())?.trim() !== 'Interactive Map') {
    await page.locator('.right-rail-toggle').click();
  }
  await expect(page.getByPlaceholder('Search docs...')).toBeVisible();
  await expect(page.locator('.graph-legend')).toContainText('Pages');
  await expect(page.locator('.graph-legend')).toContainText('Folder');

  await page.getByRole('button', { name: /Search docs/i }).click();
  await expect(page.getByRole('button', { name: /Switch to (Light|Dark) Mode/ })).toBeVisible();
  await expect(page.getByText('to open or preview')).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('interface-labels.png') });
  await assertNoRuntimeErrors(errors);
});

test('nested tab sets switch independently in Markdown and MDX', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  for (const route of [
    '/docs/developer-guides/callouts-and-code',
    '/docs/developer-guides/callouts-in-mdx',
  ]) {
    await page.goto(route, { waitUntil: 'networkidle' });
    const outer = page.locator('.md-tabs[data-tabs-group="os"]').first();
    await outer.scrollIntoViewIfNeeded();
    const outerTabs = outer.locator(':scope > .md-tabs__list > [role="tab"]');
    await expect(outerTabs).toHaveText(['macOS', 'Linux']);
    // The os group is saved, so the MDX page opens on the Linux tab chosen below.
    if (route.endsWith('callouts-in-mdx')) {
      await expect(outerTabs.nth(1)).toHaveAttribute('aria-selected', 'true');
      await outerTabs.first().click();
    }
    const inner = outer.locator('.md-tabs[data-tabs-group="pkg"]');
    await expect(inner).toBeVisible();
    await inner.getByRole('tab', { name: 'pnpm', exact: true }).click();
    await expect(inner.getByText(/pnpm add papers/)).toBeVisible();
    await expect(outerTabs.first()).toHaveAttribute('aria-selected', 'true');

    await outer.getByRole('tab', { name: 'Linux', exact: true }).click();
    await expect(outer.getByText(/Install Node\.js/)).toBeVisible();
    await expect(inner).toBeHidden();
    await outer.screenshot({
      path: test.info().outputPath(`nested-tabs-${route.split('/').pop()}.png`),
    });
  }
  await assertNoRuntimeErrors(errors);
});
