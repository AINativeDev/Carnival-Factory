import { expect, test, type Page } from './coverage';
import { CLAIM_URL } from '../src/northpole/links';

/**
 * The top bar's menu (docs/specs/top-bar.md), opened item by item from the
 * bar, on a laptop and on a phone, where the items fold behind one button.
 */
const VIEWPORTS = [
  { name: 'desktop', width: 1200, height: 1000 },
  // From 720 to 1179 the items show their icons alone.
  { name: 'tablet', width: 900, height: 1000 },
  { name: 'phone', width: 390, height: 844 },
];

const bar = (page: Page) => page.getByRole('navigation', { name: 'Pages' });

for (const viewport of VIEWPORTS) {
  const phone = viewport.name === 'phone';

  /** The link named `name`, unfolding the phone's list first. */
  const item = async (page: Page, name: string) => {
    if (phone) await bar(page).getByRole('button', { name: 'Menu' }).click();
    return bar(page).getByRole('link', { name });
  };

  test.describe(`the top bar's menu on a ${viewport.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewport);
    });

    test('the bar never scrolls sideways', async ({ page }) => {
      await page.goto('#/');
      const widths = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        bar: document.querySelector('.banner')?.scrollWidth ?? Infinity,
      }));
      expect(widths.page).toBeLessThanOrEqual(viewport.width);
      expect(widths.bar).toBeLessThanOrEqual(viewport.width);
      // A wide screen shows every label, a tablet the icons alone, and a phone
      // one menu button until it opens.
      const map = bar(page).getByRole('link', { name: 'Map' });
      if (phone) await expect(map).toBeHidden();
      else if (viewport.name === 'tablet') {
        await expect(map.locator('svg')).toBeVisible();
        await expect(map.locator('.top-menu-label')).toBeHidden();
        await expect(map).toHaveAttribute('title', /\S/);
      } else await expect(map.locator('.top-menu-label')).toBeVisible();
    });

    test('Map, Factory stats and Advent go to their pages, and the current one is marked', async ({
      page,
    }) => {
      await page.goto('#/advent');
      await (await item(page, 'Factory stats')).click();
      await expect(page).toHaveURL(/#\/factory$/);
      await expect(page.locator('.factory:not(.advent)')).toBeVisible();
      await expect(bar(page).locator('[data-item="factory"]')).toHaveAttribute(
        'aria-current',
        'page',
      );
      await (await item(page, 'Advent')).click();
      await expect(page).toHaveURL(/#\/advent$/);
      await expect(page.locator('.advent')).toBeVisible();
      await (await item(page, 'Map')).click();
      await expect(page.locator('.factory')).toHaveCount(0);
      await expect(bar(page).locator('[data-item="map"]')).toHaveAttribute('aria-current', 'page');
    });

    test('Booths opens the Booths panel, from inside a square too', async ({ page }) => {
      await page.goto('#/booth/jedi4ever');
      await expect(page.locator('.visit')).toBeVisible();
      if (phone) await bar(page).getByRole('button', { name: 'Menu' }).click();
      await bar(page).getByRole('button', { name: 'Booths' }).click();
      await expect(page.locator('.visit')).toHaveCount(0);
      await expect(page.locator('.hud-booths')).toHaveAttribute('open', '');
      await expect(page.locator('.hud-search-input')).toBeFocused();
    });

    test("People's Choice opens the list below the map, when the build has one", async ({
      page,
    }) => {
      await page.goto('#/');
      const choice = bar(page).locator('[data-item="choice"]');
      if (await page.locator('.choice').isHidden()) {
        await expect(choice).toHaveCount(0);
        return;
      }
      if (phone) await bar(page).getByRole('button', { name: 'Menu' }).click();
      await choice.click();
      await expect(page.locator('.choice')).toHaveAttribute('open', '');
    });

    test('Your booth opens the booth form in a new tab', async ({ page, context }) => {
      // The form itself is GitHub's: the test only needs to see the tab open at its address.
      await context.route('https://github.com/**', (route) => route.fulfill({ body: '' }));
      await page.goto('#/');
      const [form] = await Promise.all([
        page.waitForEvent('popup'),
        (await item(page, 'Your booth')).click(),
      ]);
      await form.waitForLoadState();
      expect(form.url()).toBe(CLAIM_URL);
    });

    test('About opens the intro, and closing it gives focus back to the bar', async ({ page }) => {
      await page.goto('#/');
      const menu = bar(page).getByRole('button', { name: 'Menu' });
      if (phone) await menu.click();
      const about = bar(page).getByRole('button', { name: 'About' });
      await about.focus();
      await page.keyboard.press('Enter');
      const intro = page.getByRole('dialog', { name: 'Welcome to the North Pole Carnival' });
      await expect(intro).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(intro).toBeHidden();
      // On a phone the list has folded, so focus goes to the Menu button it folded into.
      await expect(phone ? menu : about).toBeFocused();
    });
  });
}

test('on a phone, the menu opens with Enter or Space and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('#/');
  const toggle = bar(page).getByRole('button', { name: 'Menu' });
  const list = bar(page).getByRole('list');
  for (const key of ['Enter', ' ']) {
    await toggle.focus();
    await page.keyboard.press(key);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(list).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(bar(page).getByRole('link', { name: 'Map' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    await expect(toggle).toBeFocused();
  }
  // Escape still folds it once Tab has gone past the list to the GitHub link.
  await toggle.click();
  await page.locator('.repo-link').focus();
  await page.keyboard.press('Escape');
  await expect(list).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('on a laptop, Tab reaches every item in the bar', async ({ page }) => {
  await page.goto('#/');
  const names: string[] = [];
  await page.locator('.brand').focus();
  for (let step = 0; step < 7; step++) {
    await page.keyboard.press('Tab');
    names.push(await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? ''));
  }
  expect(names).toEqual(
    expect.arrayContaining(['Map', 'Booths', 'Factory stats', 'Advent', 'Your booth', 'About']),
  );
});
