import { expect, test, type Page } from '@playwright/test';
import { INTRO_SEEN_KEY } from '../src/intro';
import { BOOTH_REQUEST_URL } from '../src/northpole/links';

/**
 * The first-visit intro (docs/specs/intro.md), from a browser that has never
 * seen it: the rest of the smoke test starts with it seen
 * (playwright.config.ts).
 */
test.use({ storageState: { cookies: [], origins: [] } });

const dialog = (page: Page) =>
  page.getByRole('dialog', { name: 'Welcome to the North Pole Carnival' });

const seen = (page: Page) => page.evaluate((key) => localStorage.getItem(key), INTRO_SEEN_KEY);

/** Whether the map's canvas has the page's focus, even while another tab is in front. */
const mapFocused = (page: Page) =>
  page.evaluate(() => !!document.activeElement?.matches('canvas.map-canvas'));

test('a first visit to the map shows the intro, and a reload does not', async ({ page }) => {
  await page.goto('#/');
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).locator('.intro-beat')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Explore the North Pole' })).toBeFocused();
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(dialog(page)).toHaveCount(0);
  expect(await seen(page)).toBe('1');
  await page.reload();
  await expect(page.locator('canvas.map-canvas')).toBeVisible();
  await expect(dialog(page)).toHaveCount(0);
});

for (const way of ['Skip', 'Escape', 'Explore the North Pole']) {
  test(`${way} closes the intro, and focus comes back`, async ({ page }) => {
    await page.goto('#/');
    await expect(dialog(page)).toBeVisible();
    if (way === 'Escape') await page.keyboard.press('Escape');
    else await page.getByRole('button', { name: way }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(page.locator('canvas.map-canvas')).toBeFocused();
  });
}

test('a click outside the intro closes it, marks it seen and gives focus back', async ({
  page,
}) => {
  await page.goto('#/');
  await expect(dialog(page)).toBeVisible();
  await page.locator('.intro-backdrop').click({ position: { x: 4, y: 4 } });
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.locator('canvas.map-canvas')).toBeFocused();
  expect(await seen(page)).toBe('1');
});

test('"Build your own booth" opens the booth form in a new tab and closes the intro', async ({
  page,
  context,
}) => {
  // The form itself is GitHub's: the test only needs to see the tab open at its address.
  await context.route('https://github.com/**', (route) => route.fulfill({ body: '' }));
  await page.goto('#/');
  await expect(dialog(page)).toBeVisible();
  const [form] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('link', { name: 'Build your own booth' }).click(),
  ]);
  await form.waitForLoadState();
  expect(form.url()).toBe(BOOTH_REQUEST_URL);
  await expect(dialog(page)).toHaveCount(0);
  expect(await seen(page)).toBe('1');
  expect(await mapFocused(page)).toBe(true);
});

test('keyboard focus stays inside the intro while it is open', async ({ page }) => {
  await page.goto('#/');
  await expect(dialog(page)).toBeVisible();
  for (let step = 0; step < 5; step++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('.intro'))).toBe(true);
  }
});

test('"What is this?" opens the intro again, and gives focus back to it', async ({ page }) => {
  await page.goto('#/');
  await page.keyboard.press('Escape');
  const reopen = page.getByRole('button', { name: 'What is this?' });
  await reopen.click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(reopen).toBeFocused();
});

test('a deep link to a booth never shows the intro', async ({ page }) => {
  await page.goto('#/booth/jedi4ever');
  await expect(page.locator('.visit')).toBeVisible();
  await expect(dialog(page)).toHaveCount(0);
});

test('the intro fits a phone 390 pixels wide without scrolling sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('#/');
  await expect(dialog(page)).toBeVisible();
  const box = await dialog(page).boundingBox();
  expect(box && box.x >= 0 && box.x + box.width <= 390).toBe(true);
  const sideways = await page.evaluate(() =>
    [...document.querySelectorAll('.intro, .intro-backdrop')].some(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  );
  expect(sideways).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  // Each beat is a row: its scene to the left of its line, side by side.
  for (const beat of await dialog(page).locator('.intro-beat').all()) {
    const scene = await beat.locator('.intro-scene').boundingBox();
    const line = await beat.locator('p').boundingBox();
    expect(scene && line && line.x >= scene.x + scene.width).toBe(true);
    expect(scene && line && line.y < scene.y + scene.height && scene.y < line.y + line.height).toBe(
      true,
    );
  }
});

test('on a phone, "What is this?" is just a question mark with the same name', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('#/');
  await page.keyboard.press('Escape');
  const reopen = page.getByRole('button', { name: 'What is this?' });
  await expect(reopen).toBeVisible();
  await expect(reopen.locator('.intro-open-mark')).toHaveText('?');
  await expect(reopen.locator('.intro-open-mark')).toBeVisible();
  await expect(reopen.locator('.intro-open-text')).toBeHidden();
  await reopen.click();
  await expect(dialog(page)).toBeVisible();
});

test('with reduced motion, the intro shows its beats still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('#/');
  await expect(dialog(page)).toBeVisible();
  const scenes = page.locator('.intro-scene');
  await expect(scenes).toHaveCount(3);
  const frame = () =>
    scenes.evaluateAll((all) => all.map((c) => (c as HTMLCanvasElement).toDataURL()));
  const before = await frame();
  await page.waitForTimeout(800);
  expect(await frame()).toEqual(before);
  const animating = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((one) => (one.effect as KeyframeEffect | null)?.target?.closest('.intro-backdrop'))
        .length,
  );
  expect(animating).toBe(0);
});
