import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { squareCraft } from '../scripts/build-data.ts';

// A square's panel shows the craft badges it earned and nothing it missed
// (docs/adr/0029-booth-craft.md).

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

// What each booth earns changes as booths improve, so the expectation comes from
// the same craft check the build runs, never from a booth's state on one day.
const LABELS: Record<string, string> = {
  'small-files': 'Small files',
  tested: 'Tested',
  documented: 'Documented',
  'clear-names': 'Clear names',
};
const craft = squareCraft(join(import.meta.dirname, '..'));
const booths = Object.keys(craft).filter((key) => key.startsWith('booth/'));

for (const key of booths) {
  test(`${key} shows exactly the badges it earned, and nothing it missed`, async ({ page }) => {
    await page.goto(`#/${key}`);
    const earned = (craft[key] ?? []).map((badge) => LABELS[badge] ?? badge);
    const line = page.locator('.visit .visit-craft');
    if (earned.length === 0) await expect(line).toBeHidden();
    else await expect(line.locator('.visit-craft-badge')).toHaveText(earned);
    await expect(page.locator('.visit')).not.toContainText(/not earned|missing|fail/i);
  });
}

test('craft badges fit on a phone, inside the panel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('#/attraction/ferris-wheel');
  const craft = page.locator('.visit .visit-craft');
  await expect(craft).toBeVisible();
  const box = await craft.boundingBox();
  expect(box && box.x >= 0 && box.x + box.width <= 390).toBe(true);
});
