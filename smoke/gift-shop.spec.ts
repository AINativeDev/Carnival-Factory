import { expect, test } from './coverage';
import { swatchBox } from '../carnival/attractions/gift-shop/wrapping';
import { frameOf, watch } from './support/carnival';
import { stageOf } from './support/map-canvas';

/**
 * Wrapping a present in the Gift Shop (docs/specs/attractions.md): inside its
 * room, three taps on the card's swatches pick the paper, the ribbon and the
 * bow, and the card turns into the wrapped gift's tag. With a mouse at a
 * laptop's width and with a finger at a phone's.
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
    const before = await page.screenshot({ clip: cardClip });
    const swatch = swatchBox(0);
    const at = {
      x: stage.x + (stage.w * (swatch.x + swatch.w / 2)) / 100,
      y: stage.y + (stage.h * (swatch.y + swatch.h / 2)) / 100,
    };
    for (let pick = 0; pick < 3; pick++) {
      if (viewport.touch) await page.touchscreen.tap(at.x, at.y);
      else await page.mouse.click(at.x, at.y);
      await page.waitForTimeout(300);
    }
    if (!viewport.touch) await page.mouse.move(stage.x - 20, stage.y + stage.h / 2);
    await page.waitForTimeout(300);
    const after = await page.screenshot({ clip: cardClip });
    expect(after.equals(before), 'the card shows the wrapped gift’s tag').toBe(false);
    await expect(frame).toHaveAttribute('data-state', 'ready');
    expect(problems).toEqual([]);
    await context.close();
  });
}
