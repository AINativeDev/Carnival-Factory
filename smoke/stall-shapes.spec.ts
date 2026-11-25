import { join } from 'node:path';
import { expect, test } from './coverage';
import { STALL_SHAPES, type StallShape, type StallStyle } from '../src/northpole/square';
import { SHOTS, frameOf, watch } from './support/carnival';

/**
 * Every stall shape a booth may ask for, drawn on the map. Kept on its own
 * because it reaches into the square's frame to dress the booth's ready
 * message, which no other test does.
 */

/** A stall option of each shape, as a booth would write it. */
const STALL_STYLES: Record<StallShape, StallStyle> = {
  stall: { shape: 'stall', roof: 'pine', trim: 'cream' },
  shed: { shape: 'shed', roof: 'gold' },
  tent: { shape: 'tent', roof: 'berry', trim: 'snow' },
  cabin: { shape: 'cabin', roof: 'berry' },
  kiosk: { shape: 'kiosk', roof: 'violet', trim: 'cream' },
};

// Every booth in turn takes each stall shape, as if its booth.ts asked for it:
// the frame's ready message gains the option on its way from the square's
// worker, so the map checks and draws it exactly as it would a booth's own.
for (const shape of STALL_SHAPES) {
  test(`the map draws a booth's stall as a ${shape}`, async ({ page }) => {
    const problems = watch(page);
    await page.addInitScript((stall) => {
      if (!location.pathname.endsWith('square.html')) return;
      // A Worker's listeners live on EventTarget, so this one shadows it and
      // hands every listener on to it, the ready message's with the stall added.
      Worker.prototype.addEventListener = function (
        this: Worker,
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
      ) {
        if (type !== 'message' || typeof listener !== 'function') {
          EventTarget.prototype.addEventListener.call(this, type, listener, options);
          return;
        }
        const dressed = (event: Event) => {
          const data = (event as MessageEvent).data as { type?: string } | undefined;
          if (data?.type !== 'ready') {
            listener.call(this, event);
            return;
          }
          listener.call(this, { data: { ...data, stall } } as unknown as Event);
        };
        EventTarget.prototype.addEventListener.call(this, type, dressed, options);
      };
    }, STALL_STYLES[shape]);
    await page.goto('#/?booth=jedi4ever');
    await expect(frameOf(page, 'booth', 'jedi4ever')).toHaveAttribute('data-state', 'ready', {
      timeout: 5000,
    });
    await page.waitForTimeout(1000);
    await page
      .locator('canvas')
      .first()
      .screenshot({ path: join(SHOTS, `map-stall-${shape}.png`) });
    expect(problems).toEqual([]);
  });
}
