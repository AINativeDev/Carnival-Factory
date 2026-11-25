import type { Locator } from '@playwright/test';
import { expect, test } from './coverage';
import { CLAIM_URL } from '../src/northpole/links';
import { frameOf, present, watch } from './support/carnival';
import { FLAGS } from './support/feature-flags';

/**
 * Going inside a square and coming back out: E at the stall, a shared link
 * that starts inside, the panel that tells who made it, and every way out
 * (Esc, Back, the doorway, the pill's corner). The room itself, not what a
 * visitor takes away from it, which smoke/sharing.spec.ts holds.
 */

/** The visit's panel for jedi4ever's booth: whose it is, its story and its remix link. */
async function expectJedi4everPanel(card: Locator) {
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { level: 2 })).toBeFocused();
  await expect(card).toContainText('@jedi4ever');
  await expect(card.locator('.story-step').first()).toHaveText('Made by @jedi4ever');
  await expect(card.locator('.story-person')).toHaveAttribute(
    'href',
    'https://github.com/jedi4ever',
  );
  // Remix this booth waits for its feature flag; smoke/feature-flags.spec.ts checks it's gone.
  if (FLAGS.remix)
    await expect(card.getByRole('link', { name: 'Remix this booth' })).toHaveAttribute(
      'href',
      /template=01-your-booth\.yml&title=.+&what=Start%20from%20%40jedi4ever's%20/,
    );
  await expect(card.getByRole('link', { name: 'Get a booth', exact: true })).toBeHidden(); // a shared link: the spot next door instead
  await expect(card).toContainText('Esc or walk out to leave');
}

test('pressing E at a booth goes inside it, and Esc, Back or walking out leaves', async ({
  page,
}) => {
  const problems = watch(page);
  await page.goto('#/?booth=jedi4ever');
  const canvas = page.locator('.map-canvas');
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever');
  await expect(page.locator('.map-prompt')).toBeVisible();
  // Standing at the stall invites the player in.
  await expect(page.locator('.map-prompt')).toHaveAttribute('data-plot', 'booth:jedi4ever');
  await expect(page.locator('.map-prompt')).toContainText("Visit Santa's Toy Factory");
  const at = present(await canvas.getAttribute('data-player'), 'player on the map');
  await canvas.focus();
  await page.keyboard.press('e');
  await expect(page).toHaveURL(/#\/booth\/jedi4ever$/);
  const card = page.locator('.visit');
  await expectJedi4everPanel(card);
  await expect(page.locator('.map-frame')).toHaveAttribute('data-visiting', 'booth:jedi4ever');
  // After the fade, the room is drawn, with the player just inside its doorway.
  await expect(canvas).toHaveAttribute('data-room', '0.50,0.85');
  await expect(page.locator('.hud-booths')).toBeHidden();
  await expect(frameOf(page, 'booth', 'jedi4ever')).toHaveAttribute('data-state', 'ready');
  // A link to the map counts as a shared link: the invitation shows, once a visit.
  await expect(card.locator('.visit-claim')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  await expect(page).toHaveURL(/#\/\?booth=jedi4ever$/);
  await expect(page.locator('.map-frame')).not.toHaveAttribute('data-visiting', /.*/);
  await expect(canvas).not.toHaveAttribute('data-room', /.*/);
  await expect(canvas).toHaveAttribute('data-player', at);
  await expect(canvas).toBeFocused();

  // The back button leaves too, and so does walking out through the doorway.
  await page.keyboard.press('e');
  await expect(card).toBeVisible();
  await expect(card.locator('.visit-claim')).toBeHidden();
  await page.goBack();
  await expect(card).toHaveCount(0);
  await canvas.focus();
  await page.keyboard.press('e');
  await expect(card).toBeVisible();
  await expect(canvas).toHaveAttribute('data-room', /.*/);
  // Walking about inside stays inside.
  await page.keyboard.down('a');
  await page.waitForTimeout(400);
  await page.keyboard.up('a');
  await expect(card).toBeVisible();
  await expect(canvas).not.toHaveAttribute('data-room', '0.50,0.85');
  await page.keyboard.down('d');
  await page.waitForTimeout(400);
  await page.keyboard.up('d');
  await page.keyboard.down('s');
  await expect(card).toHaveCount(0);
  await page.keyboard.up('s');
  await expect(page).toHaveURL(/#\/\?booth=jedi4ever$/);
  await expect(canvas).toHaveAttribute('data-player', at);
  expect(problems).toEqual([]);
});

test('a shared link starts inside the booth, and invites the visitor to the spot next door', async ({
  page,
  context,
}) => {
  const problems = watch(page);
  await context.route('https://github.com/**', (route) => route.fulfill({ body: 'claim form' }));
  await page.goto('#/booth/jedi4ever');
  const card = page.locator('.visit');
  await expect(card).toBeVisible();
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-room', '0.50,0.85');
  const invite = card.locator('.visit-want');
  await expect(invite).toContainText('Want one too?');
  await expect(invite.getByRole('link', { name: 'Get a booth', exact: true })).toBeHidden();
  await invite.getByRole('button', { name: 'Get the spot next door' }).click();
  await expect(card).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
  const canvas = page.locator('.map-canvas');
  await expect(canvas).toHaveAttribute('data-near', /^open:/, { timeout: 20_000 });
  const form = context.waitForEvent('page');
  await page.keyboard.press('e');
  expect((await form).url()).toBe(CLAIM_URL);
  // The invitation shows once a visit: opening the booth again doesn't nag.
  await page.locator('.hud-all button[data-kind="booth"][data-id="jedi4ever"]').click();
  await page.keyboard.press('e');
  await expect(card).toBeVisible();
  await expect(card.locator('.visit-claim')).toBeHidden();
  expect(problems).toEqual([]);
});

test("inside a square, the pill's corner is a way back to the map", async ({ page }) => {
  const problems = watch(page);
  await page.goto('#/booth/jedi4ever');
  await expect(page.locator('.visit')).toBeVisible();
  await expect(page.locator('.hud-tessl')).toBeHidden();
  await page.getByRole('button', { name: 'Back to the map' }).click();
  await expect(page.locator('.visit')).toBeHidden();
  await expect(page.locator('.hud-tessl')).toBeVisible();
  await expect(page.locator('.hud-back')).toBeHidden();
  expect(page.url()).not.toContain('#/booth/');
  expect(problems).toEqual([]);
});

test("a square's build story lists each step as a block, not in columns", async ({ page }) => {
  await page.goto('#/booth/jedi4ever');
  const steps = page.locator('.visit .story-step');
  await expect(steps.first()).toBeVisible();
  await expect(steps.first()).toHaveCSS('display', 'block');
  await expect(page.locator('.visit .visit-title')).toHaveCSS('position', 'absolute');
});
