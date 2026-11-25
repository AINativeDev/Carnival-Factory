import { join } from 'node:path';
import { expect, test } from './coverage';
import { SHOTS, booths, watch } from './support/carnival';

/**
 * The factory's numbers page, `#/factory`, at laptop and phone width: reached
 * from the map and from a visit, left by Esc or Leave, and its share page.
 * A page of its own over the map, so it has a spec of its own.
 */

for (const viewport of [
  { width: 1200, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`#/factory shows the factory's numbers at ${viewport.width} wide, and Esc goes back to the map`, async ({
    page,
    request,
  }) => {
    const problems = watch(page);
    await page.setViewportSize(viewport);
    await page.goto('#/');
    await page.getByRole('link', { name: 'Built with Tessl' }).click();
    await expect(page).toHaveURL(/#\/factory$/);
    const panel = page.locator('.factory');
    await expect(panel.getByRole('heading')).toHaveText('The factory behind Carnival Factory');
    await expect(panel.getByRole('heading')).toBeFocused();
    await expect(panel.locator('.factory-figure').first()).toContainText(`${booths.length} booth`);
    await expect(panel.getByRole('link', { name: 'Run this on your own repo' })).toBeVisible();
    // A build without the deploy's numbers says where they appear.
    await expect(panel.locator('.factory-note')).toContainText('appear on the live map');
    // The numbers wrap: nothing scrolls sideways.
    const widths = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      panel: document.querySelector('.factory')?.scrollWidth ?? Infinity,
      inside: document.querySelector('.factory')?.clientWidth ?? 0,
    }));
    expect(widths.page).toBeLessThanOrEqual(viewport.width);
    expect(widths.panel).toBeLessThanOrEqual(widths.inside);
    await page.screenshot({ path: join(SHOTS, `factory-${viewport.width}.png`) });
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(page).toHaveURL(/#\/$/);

    await page.goto('#/booth/jedi4ever'); // The visit's More links to it too.
    await page.locator('.visit-more summary').click();
    await page
      .locator('.visit-more')
      .getByRole('link', { name: "See the factory's numbers" })
      .click();
    await expect(page).toHaveURL(/#\/factory$/);
    await expect(page.locator('.visit')).toHaveCount(0);
    await expect(panel).toBeVisible();
    await panel.getByRole('button', { name: 'Leave' }).click();
    await expect(panel).toHaveCount(0);

    const share = await (await request.get('share/factory.html')).text();
    expect(share).toContain('<title>The factory behind Carnival Factory</title>');
    expect(share).toContain('url=../#/factory');
    expect(share).not.toMatch(/<script/i);
    expect(problems).toEqual([]);
  });
}
