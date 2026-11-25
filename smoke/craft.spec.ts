import { expect, test } from '@playwright/test';

// A square's panel shows the craft badges it earned and nothing it missed
// (docs/adr/0029-booth-craft.md). The ferris wheel meets every convention; a
// booth whose code is still one long file earns no small-files badge.

test('a square that meets every convention shows all four craft badges', async ({ page }) => {
  await page.goto('#/attraction/ferris-wheel');
  const craft = page.locator('.visit .visit-craft');
  await expect(craft).toBeVisible();
  await expect(craft.locator('.visit-craft-badge')).toHaveText([
    'Small files',
    'Tested',
    'Documented',
    'Clear names',
  ]);
  await expect(craft.locator('.visit-craft-badge').first()).toHaveAttribute('title', /200 lines/);
  await expect(craft.locator('.visit-craft-about')).toHaveAttribute('href', /booth-craft\.md$/);
});

test('a square shows only the badges it earned, never one it missed', async ({ page }) => {
  await page.goto('#/booth/chandler767');
  const badges = page.locator('.visit .visit-craft .visit-craft-badge');
  await expect(badges.first()).toBeVisible();
  await expect(badges).not.toContainText(['Small files']);
  await expect(page.locator('.visit')).not.toContainText(/not earned|missing|fail/i);
});

test('craft badges fit on a phone, inside the panel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('#/attraction/ferris-wheel');
  const craft = page.locator('.visit .visit-craft');
  await expect(craft).toBeVisible();
  const box = await craft.boundingBox();
  expect(box && box.x >= 0 && box.x + box.width <= 390).toBe(true);
});
