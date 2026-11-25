import { expect, test } from './coverage';
import { swatchBox } from '../carnival/attractions/gift-shop/wrapping';
import { frameOf, watch } from './support/carnival';
import { stageOf } from './support/map-canvas';

/**
 * Wrapping a present in the Gift Shop (docs/specs/attractions.md): inside its
 * room, three taps on the card's swatches pick the paper, the ribbon and the
 * bow, and the card turns into the wrapped gift's tag, which a tap anywhere
 * puts away. With a mouse at a laptop's width and with a finger at a phone's.
 */

for (const viewport of [
  { width: 1200, height: 1000, touch: false },
  { width: 390, height: 844, touch: true },
]) {
  test(`taps wrap a present in the Gift Shop at ${String(viewport.width)} wide`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ hasTouch: viewport.touch, viewport });
    const page = await context.newPage();
    const problems = watch(page);
    await page.goto('#/attraction/gift-shop');
    const frame = frameOf(page, 'attraction', 'gift-shop');
    await expect(frame).toHaveAttribute('data-state', 'ready');
    await expect(page.locator('.map-canvas')).toHaveAttribute('data-stage', /^\d+,\d+,\d+,\d+$/);
    await page.waitForTimeout(500);
    const stage = await stageOf(page);
    // The card, in the page's pixels: only taps change it, so a picture of it tells them apart.
    const cardClip = {
      x: stage.x + stage.w * 0.1,
      y: stage.y + stage.h * 0.79,
      width: stage.w * 0.8,
      height: stage.h * 0.17,
    };
    // The row of swatches alone: the papers show there only before the first pick.
    const rowClip = {
      x: stage.x + stage.w * 0.12,
      y: stage.y + stage.h * 0.84,
      width: stage.w * 0.75,
      height: stage.h * 0.102,
    };
    const before = await page.screenshot({ clip: cardClip });
    const papers = await page.screenshot({ clip: rowClip });
    const swatch = swatchBox(0);
    /** A tap or a click at (x, y) in the square's 0 to 100 units, then the pointer off the square. */
    const tapAt = async (x: number, y: number) => {
      const [px, py] = [stage.x + (stage.w * x) / 100, stage.y + (stage.h * y) / 100];
      if (viewport.touch) await page.touchscreen.tap(px, py);
      else await page.mouse.click(px, py);
      await page.waitForTimeout(300);
      if (!viewport.touch) await page.mouse.move(stage.x - 20, stage.y + stage.h / 2);
      await page.waitForTimeout(300);
    };
    for (let pick = 0; pick < 3; pick++)
      await tapAt(swatch.x + swatch.w / 2, swatch.y + swatch.h / 2);
    const after = await page.screenshot({ clip: cardClip });
    expect(after.equals(before), 'the card shows the wrapped gift’s tag').toBe(false);
    // A tap off the swatches does nothing while a present is half wrapped, and
    // puts the tag away once it's done: only then are the papers back for the next gift.
    await tapAt(50, 80);
    const next = await page.screenshot({ clip: rowClip });
    expect(
      next.equals(papers),
      'the present was wrapped, and the next one asks for its paper',
    ).toBe(true);
    await expect(frame).toHaveAttribute('data-state', 'ready');
    expect(problems).toEqual([]);
    await context.close();
  });
}
