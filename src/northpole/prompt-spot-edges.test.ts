// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { cornerLinks, promptSpot } from './prompt-spot';

const wide = { width: 600, height: 480 };
const size = { w: 180, h: 40 };

describe('the call to action beside a corner link', () => {
  it('counts touching edges as clear: right beside it, or right below or above it', () => {
    const link = { x: 100, y: 100, w: 100, h: 50 };
    // Its left edge on the link's right edge, and its right edge on the link's left edge.
    expect(promptSpot({ x: 290, y: 140 }, size, wide, [link])).toEqual({ x: 200, y: 100 });
    expect(promptSpot({ x: 10 + 90, y: 140 }, size, wide, [{ ...link, x: 190 }])).toEqual({
      x: 10,
      y: 100,
    });
    // Its top on the link's foot, and its foot on the link's top.
    expect(promptSpot({ x: 200, y: 190 }, size, wide, [link])).toEqual({ x: 110, y: 150 });
    expect(promptSpot({ x: 200, y: 100 }, size, wide, [link])).toEqual({ x: 110, y: 60 });
  });

  it('steps below a link it overlaps by a single pixel, and below each in turn', () => {
    const link = { x: 100, y: 100, w: 100, h: 50 };
    expect(promptSpot({ x: 289, y: 141 }, size, wide, [link])).toEqual({ x: 199, y: 158 });
    const lower = { x: 0, y: 150, w: 600, h: 20 };
    expect(promptSpot({ x: 200, y: 140 }, size, wide, [link, lower])).toEqual({ x: 110, y: 178 });
  });
});

describe('the corner links', () => {
  it('are the showing ones, by where each sits on the frame', () => {
    const frame = document.createElement('div');
    frame.innerHTML = '<a class="hud-home"></a><a class="hud-tessl"></a><a class="hud-other"></a>';
    const sizes = [
      [12, 14, 193, 29],
      [0, 0, 0, 0],
      [50, 50, 50, 50],
    ];
    [...frame.children].forEach((link, n) => {
      const [left, top, width, height] = sizes[n] ?? [];
      Object.defineProperties(link, {
        offsetLeft: { value: left },
        offsetTop: { value: top },
        offsetWidth: { value: width },
        offsetHeight: { value: height },
      });
    });
    expect(cornerLinks(frame)).toEqual([{ x: 12, y: 14, w: 193, h: 29 }]);
  });
});
