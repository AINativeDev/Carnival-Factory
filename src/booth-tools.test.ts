// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { boothTools } from './booth-tools';

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

function frame(stage?: string) {
  document.body.innerHTML = '<div class="map-frame"><canvas></canvas></div>';
  const map = document.querySelector('.map-frame') as HTMLElement;
  const canvas = map.querySelector('canvas') as HTMLCanvasElement;
  if (stage) canvas.dataset.stage = stage;
  return { map, canvas };
}

describe("the booth's tools", () => {
  it("stand on the drawing's top-right corner, in CSS pixels, on a screen with two pixels to one", () => {
    vi.stubGlobal('devicePixelRatio', 2);
    const { map } = frame('200,100,800,800');
    const tools = boothTools(map);
    expect(tools.element.hidden).toBe(false);
    // (200 + 800) / 2 − 40 wide − 10 in; 100 / 2 + 10 down.
    expect(tools.element.style.left).toBe('450px');
    expect(tools.element.style.top).toBe('60px');
    tools.stop();
    expect(map.querySelector('.booth-tools')).toBeNull();
  });

  it('follow the drawing when the room moves it, and hide while there is none', async () => {
    vi.stubGlobal('devicePixelRatio', 1);
    const { map, canvas } = frame();
    const tools = boothTools(map);
    expect(tools.element.hidden).toBe(true);
    canvas.dataset.stage = '0,0,500,500';
    await vi.waitFor(() => {
      expect(tools.element.style.left).toBe('450px');
    });
    expect(tools.element.hidden).toBe(false);
    tools.stop();
  });

  it('keep to a screen of ordinary pixels when it gives none, and to two at most', () => {
    vi.stubGlobal('devicePixelRatio', 0);
    const plain = boothTools(frame('0,0,400,400').map);
    expect(plain.element.style.left).toBe('350px');
    plain.stop();
    vi.stubGlobal('devicePixelRatio', 3);
    const sharp = boothTools(frame('0,0,400,400').map);
    expect(sharp.element.style.left).toBe('150px');
    sharp.stop();
  });

  it('stand nowhere without a canvas to follow', () => {
    document.body.innerHTML = '<div></div>';
    const tools = boothTools(document.querySelector('div') as HTMLElement);
    expect(tools.element.hidden).toBe(true);
    tools.stop();
  });
});
