import { expect, test, type Page } from './coverage';
import theFactory from '../carnival/levels/the-factory/level';
import { levelWorld } from '../src/northpole/level';
import { FACTORY_TOUR } from '../src/factory-tour';
import { stillCamera, walkToDoor } from './level-walk';

/**
 * The Factory, end to end (docs/specs/levels.md, ADR 0035): its landmark on
 * the home map takes the sleigh into the level, and the walk passes each
 * stall in order, whose panel tells its step of the build loop with a link to
 * the real thing. At a laptop's width and a phone's.
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
  test(`The Factory's landmark opens its level, and the walk passes every stall (${viewport.name})`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(viewport);
    const problems = watch(page);
    const canvas = page.locator('.map-canvas');

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
    });

    const world = levelWorld(theFactory);
    // On a phone the Controls panel covers the map's lower corner, where the walk clicks; fold it, as a visitor would.
    const controls = page.locator('.hud-controls');
    // A level hides the panel on a phone altogether; fold it only where it shows.
    if (
      (await controls.isVisible()) &&
      (await controls.evaluate((panel) => (panel as HTMLDetailsElement).open))
    )
      await controls.locator('summary').click();
    await expect(canvas).toHaveAttribute('data-player', `${world.start.x},${world.start.y}`);
    await stillCamera(page);
    await canvas.focus();
    for (const { id } of theFactory.squares ?? []) {
      const stall = world.plots.find((plot) => plot.kind === 'attraction' && plot.id === id);
      const stop = Object.entries(FACTORY_TOUR).find(([key]) => key === id)?.[1];
      if (!stall || !stop) throw new Error(`The Factory's ${id} has no stall or no step`);
      await test.step(`the ${id} stall`, async () => {
        await walkToDoor(page, world, stall);
        await page.keyboard.press('e');
        await expect(page).toHaveURL(new RegExp(`#/level/the-factory/${id}$`));
        const panel = page.locator('.visit');
        await expect(panel.locator('.tour-story')).toHaveText(stop.story);
        await expect(panel.locator('.tour-link')).toHaveAttribute('href', stop.href);
        // The North Pole's own stalls credit nobody: no participant made them.
        await expect(panel).not.toContainText('@the-factory');
        await page.keyboard.press('Escape');
        await expect(panel).toHaveCount(0);
        await expect(canvas).not.toHaveAttribute('data-room', /.*/);
        await canvas.focus();
      });
    }

    await test.step('the sleigh home', async () => {
      const home = world.plots.find((plot) => plot.kind === 'exit');
      if (!home) throw new Error('The Factory has no sleigh home');
      await walkToDoor(page, world, home);
      await page.keyboard.press('e');
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
