// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { cornerLinks } from './prompt-spot';

/** A link laid out at a box on the frame, as the browser would measure it. */
function laidOut(className: string, box: { x: number; y: number; w: number; h: number }) {
  const link = document.createElement('a');
  link.className = `hud ${className}`;
  const measured = { offsetLeft: box.x, offsetTop: box.y, offsetWidth: box.w, offsetHeight: box.h };
  for (const [name, value] of Object.entries(measured))
    Object.defineProperty(link, name, { value, configurable: true });
  return link;
}

describe('the corner links the call to action keeps clear of', () => {
  it('measures the way home and Built with Tessl where they show, and skips hidden ones', () => {
    const frame = document.createElement('div');
    frame.append(
      laidOut('hud-home', { x: 12, y: 12, w: 193, h: 29 }),
      laidOut('hud-tessl', { x: 0, y: 0, w: 0, h: 0 }),
      laidOut('hud-back', { x: 12, y: 12, w: 150, h: 29 }),
    );
    expect(cornerLinks(frame)).toEqual([{ x: 12, y: 12, w: 193, h: 29 }]);
  });
});
