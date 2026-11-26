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
  it('shows its icon, with its word for screen readers,, and leaves with the visit', () => {
    const map = frame();
    const full = fullScreenPill(map);
    expect(full.pill.parentElement).toBe(map);
    expect(full.pill.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(full.pill.textContent).toBe('Full screen');
    full.stop();
    expect(full.pill.isConnected).toBe(false);
  });

  it('makes the booth big beside the panel, and comes back on a second press', () => {
    const map = frame();
    const full = fullScreenPill(map);
    full.pill.click();
    expect(map.dataset.full).toBe('');
    expect(full.pill.textContent).toBe('Back to the room');
    full.pill.click();
    expect(map.dataset.full).toBeUndefined();
    expect(full.pill.textContent).toBe('Full screen');
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

  it('ends full screen when the visit ends', () => {
    const map = frame();
    const full = fullScreenPill(map);
    full.pill.click();
    full.stop();
    expect(map.dataset.full).toBeUndefined();
  });
});

describe('keys while full screen', () => {
  it('lets other keys through while full screen', () => {
    const map = frame();
    const full = fullScreenPill(map);
    full.pill.click();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(map.dataset.full).toBe('');
    full.stop();
  });
});
