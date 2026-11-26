// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { boothBox, fullBox, isFullScreen, isPhoneUpright, wideBox } from './visit-stage';

describe("where a square's drawing stands inside it", () => {
  it('fills the space left of the panel from top to bottom, flush against the panel', () => {
    expect(boothBox({ x: 0, y: 0, w: 1060, h: 856 })).toEqual({ x: 204, y: 0, w: 856, h: 856 });
    expect(boothBox({ x: 10, y: 20, w: 500, h: 900 })).toEqual({ x: 10, y: 20, w: 500, h: 500 });
    expect(boothBox({ x: 0, y: 0, w: -5, h: 10 }).w).toBe(0);
  });

  it('fills the width on a phone held upright, under the way back to the map', () => {
    expect(isPhoneUpright(390, 844)).toBe(true);
    expect(isPhoneUpright(844, 390)).toBe(false);
    expect(isPhoneUpright(1400, 900)).toBe(false);
    expect(wideBox(390)).toEqual({ x: 16, y: 64, w: 358, h: 358 });
    expect(wideBox(10).w).toBe(0);
  });

  it('takes the whole screen in full screen, in the middle, once the frame says so', () => {
    expect(fullBox(1400, 900)).toEqual({ x: 266, y: 16, w: 868, h: 868 });
    expect(fullBox(10, 10).w).toBe(0);
    document.body.innerHTML = '<div class="map-frame"><canvas></canvas></div>';
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(isFullScreen(canvas)).toBe(false);
    (canvas.parentElement as HTMLElement).dataset.full = '';
    expect(isFullScreen(canvas)).toBe(true);
    document.body.replaceChildren();
  });
});
