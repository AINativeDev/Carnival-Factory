import { expect, test } from './coverage';
import { frameOf, played, watch } from './support/carnival';

/**
 * Links straight to a square on the map, `#/?booth=<login>` or
 * `#/?attraction=<id>`, at phone and laptop width, and what a link to a booth
 * nobody has built says. Separate from playing the squares because a deep
 * link is about the map finding the square, not the square itself.
 */

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1200, height: 1000 },
]) {
  for (const { kind, id } of played) {
    test(`#/?${kind}=${id} opens the map on it at ${viewport.width} wide`, async ({ page }) => {
      const problems = watch(page);
      await page.setViewportSize(viewport);
      await page.goto(`#/?${kind}=${id}`);
      // The town only opens the squares it has in view.
      await expect(frameOf(page, kind, id)).toHaveAttribute('data-state', 'ready', {
        timeout: 5000,
      });
      await expect(page.locator('.map-note')).toBeHidden();
      expect(problems).toEqual([]);
    });
  }
}

test('a deep link to a booth nobody has built says so, as text', async ({ page }) => {
  await page.goto('#/?booth=nobody-here-yet');
  await expect(page.locator('.map-note')).toHaveText(
    "There's no booth for @nobody-here-yet yet. Claim it!",
  );
  await expect(page.locator('.map-note a')).toHaveAttribute('href', /01-your-booth/);
  await page.goto('#/?booth=%3Cb%3Ehi%3C%2Fb%3E');
  await expect(page.locator('.map-note')).toBeHidden();
  await expect(page.locator('.map-note b')).toHaveCount(0);
});
