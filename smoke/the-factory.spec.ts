import { expect, test, type Page } from './coverage';
import theFactory from '../carnival/levels/the-factory/level';
import { levelWorld } from '../src/northpole/level';
import { FACTORY_TOUR } from '../src/factory-tour';
import { rideTo } from './level-ride';

/**
 * The Factory, end to end (docs/specs/levels.md, ADR 0035, ADR 0041): its
 * landmark on the home map takes the sleigh into the level, where the visitor
 * rides its roller coaster in the golden ticket car instead of walking. The
 * car stops at each stall's station in turn, whose panel tells its step of
 * the build loop with a link to the real thing, and comes round to the sleigh
 * home. At a laptop's width, riding on with the keys, and at a phone's,
 * riding on with the "Ride on" button.
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1200, height: 1000 },
  { name: 'phone', width: 390, height: 844 },
];

/** Collects what the page did wrong. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console error: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
  return problems;
}

for (const viewport of VIEWPORTS) {
  const phone = viewport.name === 'phone';
  test(`The Factory's landmark opens its level, and the ride stops at every stall (${viewport.name})`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize(viewport);
    const problems = watch(page);
    const canvas = page.locator('.map-canvas');
    const button = page.locator('.ride-on');

    await test.step('the landmark takes the sleigh', async () => {
      await page.goto('#/?attraction=the-factory');
      await expect(canvas).toHaveAttribute('data-selected', 'attraction:the-factory');
      const prompt = page.locator('.map-prompt');
      await expect(prompt).toHaveAttribute('data-plot', 'attraction:the-factory');
      await expect(prompt).toContainText('The Factory');
      await canvas.focus();
      await page.keyboard.press('e');
      await expect(page).toHaveURL(/#\/level\/the-factory$/);
      await expect(page.locator('.hud-level')).toContainText('The Factory');
      await expect(page.locator('.hud-level')).toContainText('A level by the North Pole');
      await expect(page.locator('.hud-level')).toContainText('Ride the build loop');
    });

    const world = levelWorld(theFactory);
    await test.step('the car waits at the boarding station', async () => {
      await expect(canvas).toHaveAttribute('data-player', `${world.start.x},${world.start.y}`);
      await expect(canvas).toHaveAttribute('data-ride', '0 stopped');
      await expect(canvas).toHaveAttribute('data-near', 'exit:north-pole');
      await expect(button).toBeVisible();
      await expect(button).toContainText('Start the ride');
      // The walking keys don't walk anyone off the track.
      await canvas.focus();
      for (const key of ['ArrowUp', 'ArrowLeft', 'w', 's']) await page.keyboard.press(key);
      await expect(canvas).toHaveAttribute('data-ride', '0 stopped');
    });

    // At a laptop, each stop rides on with another of the keys; on a phone, with the button.
    const keys = ['Space', 'ArrowRight', 'd'];
    let rides = 0;
    const rideOn = async () => {
      if (phone) await button.click();
      else await page.keyboard.press(keys[rides++ % keys.length] ?? 'Space');
    };
    for (const { id } of theFactory.squares ?? []) {
      const stall = world.plots.find((plot) => plot.kind === 'attraction' && plot.id === id);
      const stop = Object.entries(FACTORY_TOUR).find(([key]) => key === id)?.[1];
      if (!stall || !stop) throw new Error(`The Factory's ${id} has no stall or no step`);
      await test.step(`the ${id} station`, async () => {
        await rideTo(page, world, stall, rideOn);
        const prompt = page.locator('.map-prompt');
        await expect(prompt).toHaveAttribute('data-plot', `attraction:${id}`);
        // The call to action bobs gently, so it never stands still for a click to wait for.
        if (phone) await prompt.click({ force: true });
        else await page.keyboard.press('e');
        await expect(page).toHaveURL(new RegExp(`#/level/the-factory/${id}$`));
        const panel = page.locator('.visit');
        await expect(panel.locator('.tour-story')).toHaveText(stop.story);
        await expect(panel.locator('.tour-link')).toHaveAttribute('href', stop.href);
        // The North Pole's own stalls credit nobody: no participant made them.
        await expect(panel).not.toContainText('@the-factory');
        await page.keyboard.press('Escape');
        await expect(panel).toHaveCount(0);
        await expect(canvas).not.toHaveAttribute('data-room', /.*/);
        // Back out, the car still stands at the stall's station.
        await expect(canvas).toHaveAttribute('data-near', `attraction:${id}`);
        await canvas.focus();
      });
    }

    await test.step('round to the sleigh home', async () => {
      const home = world.plots.find((plot) => plot.kind === 'exit');
      if (!home) throw new Error('The Factory has no sleigh home');
      await rideTo(page, world, home, rideOn);
      await expect(button).toContainText('Start the ride');
      if (phone) await page.locator('.map-prompt').click({ force: true });
      else await page.keyboard.press('e');
      await expect(page).toHaveURL(/#\/$/);
    });
    expect(problems).toEqual([]);
  });
}

test("The landmark's own room offers the sleigh into the level", async ({ page }) => {
  const problems = watch(page);
  await page.goto('#/attraction/the-factory');
  const panel = page.locator('.visit');
  await panel.locator('.visit-more summary').click();
  await panel.getByRole('link', { name: 'Take the sleigh inside' }).click();
  await expect(page).toHaveURL(/#\/level\/the-factory$/);
  await expect(page.locator('.hud-level')).toContainText('A level by the North Pole');
  expect(problems).toEqual([]);
});
