import { expect, test, type Page } from './coverage';
import theAcademy from '../carnival/levels/the-academy/level';
import theStudio from '../carnival/levels/the-studio/level';
import { levelWorld, type NorthPoleLevel } from '../src/northpole/level';
import { northPoleLinks } from '../src/northpole/north-pole-links';
import { stillCamera, walkToDoor } from './level-walk';

/**
 * The Academy and the Recording Studio, end to end (docs/specs/levels.md,
 * ADR 0035, ADR 0038): each landmark on the home map takes the sleigh into its
 * level, whose panel shows its links out as buttons to a new tab, and every
 * item's panel shows them too: on a laptop the walk reaches each item and the
 * sleigh home, and on a phone each item opens by its own link (ADR 0040).
 */

/** Where the walk runs: the same laptop and phone as smoke/the-factory.spec.ts, whose walk helper they share. */
const VIEWPORTS = [
  { name: 'desktop', width: 1200, height: 1000 },
  { name: 'phone', width: 390, height: 844 },
];

const PLACES: { level: NorthPoleLevel; name: string }[] = [
  { level: theAcademy, name: 'The Academy' },
  { level: theStudio, name: 'The Recording Studio' },
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

/** Checks a panel's links out: each a button with its label, to its https address, in a new tab. */
async function expectLinks(page: Page, panel: string, id: string) {
  const links = page.locator(`${panel} .level-links a.level-link`);
  const expected = northPoleLinks(id);
  expect(expected.length).toBeGreaterThan(0);
  await expect(links).toHaveCount(expected.length);
  for (const [n, { label, href }] of expected.entries()) {
    const link = links.nth(n);
    await expect(link).toHaveText(label);
    await expect(link).toHaveAttribute('href', href);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener');
    await expect(link).toBeVisible();
  }
}

for (const { level, name } of PLACES)
  for (const viewport of VIEWPORTS) {
    test(`${name}'s landmark opens its level, its links show, and the walk reaches every stall (${viewport.name})`, async ({
      page,
    }) => {
      // A phone's close camera walks in many short steps.
      test.setTimeout(480_000);
      await page.setViewportSize(viewport);
      const problems = watch(page);
      const canvas = page.locator('.map-canvas');
      const { id } = level;

      await test.step('the landmark takes the sleigh', async () => {
        await page.goto(`#/?attraction=${id}`);
        await expect(canvas).toHaveAttribute('data-selected', `attraction:${id}`);
        const prompt = page.locator('.map-prompt');
        await expect(prompt).toHaveAttribute('data-plot', `attraction:${id}`);
        await expect(prompt).toContainText(name);
        await canvas.focus();
        await page.keyboard.press('e');
        await expect(page).toHaveURL(new RegExp(`#/level/${id}$`));
        await expect(page.locator('.hud-level')).toContainText(name);
        await expect(page.locator('.hud-level')).toContainText('A level by the North Pole');
        await expectLinks(page, '.hud-level', id);
      });

      const world = levelWorld(level);
      // On a phone the Controls panel covers the map's lower corner, where the walk clicks; fold it, as a visitor would.
      const controls = page.locator('.hud-controls');
      if (await controls.evaluate((panel) => (panel as HTMLDetailsElement).open))
        await controls.locator('summary').click();
      await expect(canvas).toHaveAttribute('data-player', `${world.start.x},${world.start.y}`);
      await stillCamera(page);
      await canvas.focus();
      for (const { id: stallId } of level.squares ?? []) {
        const stall = world.plots.find((plot) => plot.kind === 'attraction' && plot.id === stallId);
        if (!stall) throw new Error(`${name} has no stall ${stallId}`);
        await test.step(`the ${stallId} item`, async () => {
          // A phone's close camera in a furnished room is a long walk of short
          // steps: there each item opens by its own link, and the laptop walks.
          if (viewport.name === 'phone') await page.goto(`#/level/${id}/${stallId}`);
          else {
            await walkToDoor(page, world, stall);
            await page.keyboard.press('e');
          }
          await expect(page).toHaveURL(new RegExp(`#/level/${id}/${stallId}$`));
          const panel = page.locator('.visit');
          await expect(panel.locator('.visit-description')).not.toBeEmpty();
          await expectLinks(page, '.visit', id);
          await page.keyboard.press('Escape');
          await expect(panel).toHaveCount(0);
          await expect(canvas).not.toHaveAttribute('data-room', /.*/);
          await canvas.focus();
        });
      }

      await test.step('the sleigh home', async () => {
        const home = world.plots.find((plot) => plot.kind === 'exit');
        if (!home) throw new Error(`${name} has no sleigh home`);
        // On a phone, the way home is the link in the corner; the laptop walks to the sleigh.
        if (viewport.name === 'phone')
          await page.getByRole('link', { name: 'Back to the North Pole' }).click();
        else {
          await walkToDoor(page, world, home);
          await page.keyboard.press('e');
        }
        await expect(page).toHaveURL(/#\/$/);
      });
      expect(problems).toEqual([]);
    });
  }

test("The landmarks' own rooms show their links out", async ({ page }) => {
  const problems = watch(page);
  for (const { level } of PLACES) {
    await page.goto(`#/attraction/${level.id}`);
    await expectLinks(page, '.visit', level.id);
  }
  expect(problems).toEqual([]);
});

// A wide laptop and a phone: each landmark takes the sleigh in, and the level's panel shows its links.
for (const viewport of [
  { width: 1500, height: 900 },
  { width: 390, height: 844 },
])
  test(`Each landmark opens its level with its links out (${String(viewport.width)} wide)`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const problems = watch(page);
    const canvas = page.locator('.map-canvas');
    for (const { level, name } of PLACES) {
      await page.goto(`#/?attraction=${level.id}`);
      await expect(canvas).toHaveAttribute('data-selected', `attraction:${level.id}`);
      await canvas.focus();
      await page.keyboard.press('e');
      await expect(page).toHaveURL(new RegExp(`#/level/${level.id}$`));
      await expect(page.locator('.hud-level')).toContainText(name);
      await expectLinks(page, '.hud-level', level.id);
    }
    expect(problems).toEqual([]);
  });
