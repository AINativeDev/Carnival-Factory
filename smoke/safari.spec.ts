import { expect, test } from './coverage';

/**
 * Safari reads a sandboxed frame's content security policy differently from
 * Chrome: every square once showed "broken" there and nowhere else. This runs
 * in WebKit, as an iPhone, and checks the squares in view open and draw.
 */
test('on an iPhone in Safari, the squares in view open and draw', async ({ page }) => {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console error: ${message.text()}`);
  });
  await page.goto('#/?booth=jedi4ever');
  await expect(page.locator('iframe[data-kind]').first()).toBeAttached({ timeout: 10_000 });
  await expect(page.locator('iframe[data-kind="booth"][data-id="jedi4ever"]')).toHaveAttribute(
    'data-state',
    'ready',
    { timeout: 15_000 },
  );
  const states = await page
    .locator('iframe[data-kind]')
    .evaluateAll((frames) =>
      frames.map((f) => `${(f as HTMLElement).dataset.id}: ${(f as HTMLElement).dataset.state}`),
    );
  expect(states.filter((state) => state.endsWith(': broken'))).toEqual([]);
  expect(problems).toEqual([]);
});
