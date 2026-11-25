import { expect, test } from './coverage';
import type { Page } from '@playwright/test';
import { BOOTH_REQUEST_URL, FEEDBACK_URL } from '../src/northpole/links';

/**
 * The top bar's menu (docs/specs/top-bar-menu.md), at laptop and phone width:
 * every place opens from the bar, the current one is marked, the bar never
 * scrolls sideways, and it covers none of the map's own controls.
 */

const VIEWPORTS = [
  { width: 1500, height: 900, phone: false },
  { width: 390, height: 844, phone: true },
];

const bar = (page: Page) => page.getByRole('navigation', { name: 'Places' });

/** The place's item, through Menu on a phone. */
async function item(page: Page, phone: boolean, name: string) {
  if (phone) await bar(page).getByRole('button', { name: 'Menu' }).click();
  return bar(page).getByRole(name === 'Booths' || name === 'About' ? 'button' : 'link', { name });
}

const overlaps = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

for (const { phone, ...viewport } of VIEWPORTS) {
  test.describe(`at ${viewport.width} wide`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewport);
    });

    test('the bar fits, marks the map, and covers none of the map controls', async ({ page }) => {
      await page.goto('#/');
      await expect(page.locator('.map-canvas')).toHaveAttribute('data-camera', /./);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        viewport.width,
      );
      const banner = await page.locator('.banner').boundingBox();
      expect(banner && banner.height).toBeLessThanOrEqual(48);
      const controls = page.locator('.hud-zoom, .hud-overview, .hud-controls');
      for (const control of await controls.all()) {
        const box = await control.boundingBox();
        if (box && banner) expect(overlaps(box, banner)).toBe(false);
      }
      const map = await item(page, phone, 'Map');
      await expect(map).toHaveAttribute('aria-current', 'page');
      if (!phone) await expect(map).toContainText('Map');
    });

    test('Map leaves a square for the map', async ({ page }) => {
      await page.goto('#/booth/jedi4ever');
      await expect(page.locator('.visit')).toBeVisible();
      await (await item(page, phone, 'Map')).click();
      await expect(page).toHaveURL(/#\/$/);
      await expect(page.locator('.visit')).toHaveCount(0);
    });

    test('Booths opens the Booths panel, from a square too', async ({ page }) => {
      await page.goto('#/booth/jedi4ever');
      await expect(page.locator('.visit')).toBeVisible();
      await (await item(page, phone, 'Booths')).click();
      await expect(page).toHaveURL(/#\/$/);
      await expect(page.locator('.hud-booths')).toHaveAttribute('open', '');
      await expect(page.locator('.hud-search-input')).toBeFocused();
    });

    for (const [name, url] of [
      ['Get a booth', BOOTH_REQUEST_URL],
      ['Feedback', FEEDBACK_URL],
    ] as const) {
      test(`${name} opens its form in a new tab`, async ({ page }) => {
        await page.goto('#/');
        const link = await item(page, phone, name);
        await expect(link).toHaveAttribute('href', url);
        await expect(link).toHaveAttribute('target', '_blank');
      });
    }

    test('About opens the intro', async ({ page }) => {
      await page.goto('#/');
      await (await item(page, phone, 'About')).click();
      await expect(page.getByRole('dialog')).toBeVisible();
    });
  });
}

test('on a phone, Escape closes Menu and gives it focus back', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('#/');
  const menu = bar(page).getByRole('button', { name: 'Menu' });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(bar(page).getByRole('link', { name: 'Map' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
  await expect(bar(page).getByRole('link', { name: 'Map' })).toBeHidden();
});
