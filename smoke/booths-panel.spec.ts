import { expect, test } from './coverage';
import { booths, watch } from './support/carnival';

/**
 * The Booths panel beside the map: picking a booth or Featured to highlight
 * it, shift-click to walk to its door, and finding a login by search. Its own
 * spec because the panel is its own part of the page (docs/specs/booths-panel.md).
 */

test("shift-clicking a name in the Booths panel walks the player to a booth's door", async ({
  page,
}) => {
  await page.goto('#/');
  const canvas = page.locator('.map-canvas');
  await page
    .locator('.hud-all button[data-kind="booth"][data-id="jedi4ever"]')
    .click({ modifiers: ['Shift'] });
  await expect(canvas).toHaveAttribute('data-selected', 'booth:jedi4ever');
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever', { timeout: 20_000 });
});

test('picking from the Booths panel or Featured highlights the square, and its call to action goes inside', async ({
  page,
}) => {
  const problems = watch(page);
  await page.goto('#/');
  const canvas = page.locator('.map-canvas');
  const entry = page.locator('.hud-all button[data-kind="booth"][data-id="jedi4ever"]');
  await entry.click();
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever', { timeout: 1000 });
  await expect(canvas).toHaveAttribute('data-selected', 'booth:jedi4ever');
  await expect(entry).toHaveClass(/selected/);
  const prompt = page.locator('.map-prompt');
  await expect(prompt).toHaveAttribute('data-spot', 'booth:jedi4ever');
  await expect(prompt).toContainText('Visit');
  // Picking it again lets go of it, and so does Esc.
  await entry.click();
  await expect(canvas).toHaveAttribute('data-selected', '');
  await expect(entry).not.toHaveClass(/selected/);
  await entry.click();
  await page.keyboard.press('Escape');
  await expect(canvas).toHaveAttribute('data-selected', '');

  const featured = page.locator('.hud-featured button[data-kind]');
  await expect(featured).toContainText('Featured');
  await featured.click();
  const id = await featured.getAttribute('data-id');
  await expect(canvas).toHaveAttribute('data-near', `attraction:${id}`, { timeout: 1000 });
  await expect(canvas).toHaveAttribute('data-selected', `attraction:${id}`);
  await expect(prompt).toHaveAttribute('data-spot', `attraction:${id}`);
  await expect(prompt).toHaveCSS('opacity', '1');
  // It bobs gently, so it never stands still for the click.
  await prompt.click({ force: true });
  await expect(page).toHaveURL(new RegExp(`#/attraction/${id}$`));
  await expect(page.locator(`.visit[data-kind="attraction"][data-id="${id}"]`)).toBeVisible();
  await expect(page.locator('.visit')).toHaveCount(1);
  expect(problems).toEqual([]);
});

test('the Booths panel finds a login, and Enter jumps to it', async ({ page }) => {
  const problems = watch(page);
  await page.goto('#/');
  const canvas = page.locator('.map-canvas');
  await canvas.focus();
  await page.keyboard.press('/');
  const search = page.getByPlaceholder('Find a booth or @login');
  await expect(search).toBeFocused();
  await page.keyboard.type('@JEDI4');
  const found = page.locator('.hud-found button.hud-go');
  await expect(found).toHaveCount(1);
  await expect(found).toHaveAttribute('data-id', 'jedi4ever');
  await expect(page.locator('.hud-results-title')).toHaveText('Results (1)');
  await page.keyboard.press('Enter');
  await expect(canvas).toHaveAttribute('data-selected', 'booth:jedi4ever');
  await expect(canvas).toHaveAttribute('data-near', 'booth:jedi4ever', { timeout: 1000 });
  // The arrow keys move through the results, and Esc clears the search.
  await page.keyboard.press('ArrowDown');
  await expect(found).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(search).toHaveValue('');
  await expect(page.locator('.hud-section[data-section="all"] > summary')).toHaveText(
    `All booths (${booths.length})`,
  );
  expect(problems).toEqual([]);
});
