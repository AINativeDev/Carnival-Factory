// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fullScreenPill } from './visit-full-screen';

function frame() {
  document.body.innerHTML = '<div class="map-frame"><canvas></canvas></div>';
  return document.querySelector('.map-frame') as HTMLElement;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the Full screen pill', () => {
  it('stands over the room with its icon and its word, and leaves with the visit', () => {
    const map = frame();
    const full = fullScreenPill(map);
    expect(full.pill.parentElement).toBe(map);
    expect(full.pill.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(full.pill.textContent).toBe('Full screen');
    full.stop();
    expect(full.pill.isConnected).toBe(false);
  });

  it('shows the booth full screen, asks the browser for it, and comes back on a second press', () => {
    const map = frame();
    const ask = vi.fn(() => Promise.resolve());
    map.requestFullscreen = ask;
    const resized = vi.fn();
    window.addEventListener('resize', resized);
    const full = fullScreenPill(map);
    full.pill.click();
    expect(map.dataset.full).toBe('');
    expect(ask).toHaveBeenCalled();
    expect(full.pill.textContent).toBe('Exit full screen');
    expect(resized).toHaveBeenCalled();
    full.pill.click();
    expect(map.dataset.full).toBeUndefined();
    expect(full.pill.textContent).toBe('Full screen');
    full.stop();
  });

  it('still fills the page where the browser has no full screen, such as Safari on an iPhone', () => {
    const map = frame();
    Object.defineProperty(map, 'requestFullscreen', { value: undefined });
    const full = fullScreenPill(map);
    full.pill.click();
    expect(map.dataset.full).toBe('');
    full.stop();
  });

  it('leaves full screen on Esc, before Esc can leave the booth', () => {
    const map = frame();
    const full = fullScreenPill(map);
    full.pill.click();
    const leftBooth = vi.fn();
    document.addEventListener('keydown', leftBooth);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(map.dataset.full).toBeUndefined();
    expect(leftBooth).not.toHaveBeenCalled();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(leftBooth).toHaveBeenCalledTimes(1);
    document.removeEventListener('keydown', leftBooth);
    full.stop();
  });

  it("comes back when the browser's own full screen ends, as with its own Esc", () => {
    const map = frame();
    const full = fullScreenPill(map);
    full.pill.click();
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(map.dataset.full).toBeUndefined();
    full.stop();
  });

  it('ends full screen when the visit ends', () => {
    const map = frame();
    const full = fullScreenPill(map);
    full.pill.click();
    full.stop();
    expect(map.dataset.full).toBeUndefined();
  });
});

describe("the browser's own full screen", () => {
  it('leaves it when the visit comes back from full screen, and shrugs off a refusal either way', async () => {
    const map = frame();
    map.requestFullscreen = vi.fn(() => Promise.reject(new Error('not allowed')));
    const exit = vi.fn(() => Promise.reject(new Error('already out')));
    Object.defineProperty(document, 'exitFullscreen', { value: exit, configurable: true });
    Object.defineProperty(document, 'fullscreenElement', { get: () => map, configurable: true });
    const full = fullScreenPill(map);
    full.pill.click();
    // Still in its full screen: the browser's change doesn't end ours.
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(map.dataset.full).toBe('');
    full.pill.click();
    expect(exit).toHaveBeenCalled();
    await Promise.resolve();
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
    full.stop();
  });

  it('lets other keys through while full screen', () => {
    const map = frame();
    const full = fullScreenPill(map);
    full.pill.click();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(map.dataset.full).toBe('');
    full.stop();
  });
});
