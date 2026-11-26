// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { areaBox, edgeToEdge, fullBox, isFullScreen, isPhoneUpright, wideBox } from './full-screen';

describe('a booth full screen', () => {
  it('is on while the map frame is marked full', () => {
    document.body.innerHTML = '<div class="map-frame"><canvas></canvas></div>';
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(isFullScreen(canvas)).toBe(false);
    (canvas.parentElement as HTMLElement).dataset.full = '';
    expect(isFullScreen(canvas)).toBe(true);
  });

  it('is off for a canvas outside a map frame', () => {
    expect(isFullScreen(document.createElement('canvas'))).toBe(false);
  });

  it('fills the screen with the biggest square that fits, centred, with a margin', () => {
    expect(fullBox(1400, 900)).toEqual({ x: 266, y: 16, w: 868, h: 868 });
    expect(fullBox(390, 844)).toEqual({ x: 16, y: 243, w: 358, h: 358 });
  });

  it('fills the width on a phone held upright, under the way back to the map', () => {
    expect(isPhoneUpright(390, 844)).toBe(true);
    expect(isPhoneUpright(844, 390)).toBe(false);
    expect(isPhoneUpright(1400, 900)).toBe(false);
    expect(wideBox(390)).toEqual({ x: 16, y: 56, w: 358, h: 358 });
    expect(wideBox(10).w).toBe(0);
  });

  it('leaves the room out in full screen and on a phone held upright, and nowhere else', () => {
    document.body.innerHTML = '<div class="map-frame"><canvas></canvas></div>';
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    const size = (width: number, height: number) => {
      Object.defineProperty(canvas, 'clientWidth', { value: width, configurable: true });
      Object.defineProperty(canvas, 'clientHeight', { value: height, configurable: true });
    };
    size(1400, 900);
    expect(edgeToEdge(canvas)).toBe(false);
    size(390, 844);
    expect(edgeToEdge(canvas)).toBe(true);
    size(1400, 900);
    (canvas.parentElement as HTMLElement).dataset.full = '';
    expect(edgeToEdge(canvas)).toBe(true);
  });

  it('fills the room beside the panel under the banner and the way back, when full screen', () => {
    expect(areaBox({ x: 0, y: 0, w: 1060, h: 900 })).toEqual({ x: 144, y: 96, w: 772, h: 772 });
    expect(areaBox({ x: 10, y: 20, w: 1000, h: 1200 }).x).toBe(16 + 10);
  });
});
