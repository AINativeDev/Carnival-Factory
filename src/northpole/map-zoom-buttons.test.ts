// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { makeZoomButtons, showZoomLimits, type ZoomButtons } from './map-zoom-buttons';

describe('the zoom buttons', () => {
  it('are a labelled group of two plain buttons, in the frame', () => {
    const frame = document.createElement('div');
    const { element, nearer, farther } = makeZoomButtons(frame);
    expect(element.parentElement).toBe(frame);
    expect(element.outerHTML).toBe(
      '<div class="hud-zoom" role="group" aria-label="Zoom">' +
        '<button type="button" class="hud" title="Zoom in" aria-label="Zoom in">+</button>' +
        '<button type="button" class="hud" title="Zoom out" aria-label="Zoom out">−</button></div>',
    );
    expect([nearer.textContent, farther.textContent]).toEqual(['+', '−']);
  });

  it('turn off at their limits, and back on away from them', () => {
    const buttons = makeZoomButtons(document.createElement('div'));
    showZoomLimits(buttons, false, true);
    expect([buttons.nearer.disabled, buttons.farther.disabled]).toEqual([true, false]);
    showZoomLimits(buttons, true, false);
    expect([buttons.nearer.disabled, buttons.farther.disabled]).toEqual([false, true]);
    showZoomLimits(buttons, true, true);
    expect([buttons.nearer.disabled, buttons.farther.disabled]).toEqual([false, false]);
  });

  it('touch the page only when a limit changes, not on every frame', () => {
    const buttons = makeZoomButtons(document.createElement('div'));
    const writes: string[] = [];
    const watch = (button: HTMLButtonElement, name: string) => {
      let disabled = false;
      Object.defineProperty(button, 'disabled', {
        get: () => disabled,
        set: (value: boolean) => {
          writes.push(`${name} ${String(value)}`);
          disabled = value;
        },
      });
    };
    const { nearer, farther }: ZoomButtons = buttons;
    watch(nearer, 'in');
    watch(farther, 'out');
    for (let frame = 0; frame < 3; frame++) showZoomLimits(buttons, true, true);
    showZoomLimits(buttons, false, true);
    showZoomLimits(buttons, false, true);
    showZoomLimits(buttons, false, false);
    expect(writes).toEqual(['in true', 'out true']);
  });
});
