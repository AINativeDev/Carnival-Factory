// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { nearestStop, SHEET_STOPS, visitSheet } from './visit-sheet';

/** A panel in a frame 800 tall, whose height reads back what was set. */
function panel(start = 200) {
  document.body.innerHTML = '<div class="map-frame"><section class="visit"></section></div>';
  const frame = document.querySelector('.map-frame') as HTMLElement;
  const card = document.querySelector('.visit') as HTMLElement;
  Object.defineProperty(frame, 'clientHeight', { value: 800 });
  Object.defineProperty(card, 'offsetHeight', {
    get: () => (card.style.height ? Number.parseInt(card.style.height, 10) : start),
  });
  return card;
}

const pointer = (type: string, clientY: number) =>
  new PointerEvent(type, { clientY, pointerId: 1, bubbles: true });

afterEach(() => {
  document.body.replaceChildren();
});

describe('the sheet on a phone', () => {
  it('rests at a quarter, half or nearly all of the screen', () => {
    expect(SHEET_STOPS).toEqual([0.25, 0.5, 0.85]);
    expect(nearestStop(260, 800)).toBe(200);
    expect(nearestStop(390, 800)).toBe(400);
    expect(nearestStop(790, 800)).toBe(680);
  });

  it('has a handle at its top that people and screen readers can find', () => {
    const card = panel();
    const sheet = visitSheet(card);
    const handle = card.firstElementChild as HTMLElement;
    expect(handle.className).toBe('visit-sheet-handle');
    expect(handle.getAttribute('role')).toBe('separator');
    expect(handle.getAttribute('aria-label')).toBe('Resize the panel');
    expect(handle.tabIndex).toBe(0);
    sheet.stop();
    expect(card.querySelector('.visit-sheet-handle')).toBeNull();
  });

  it('follows a drag up, and snaps to the nearest stop when let go', () => {
    const card = panel();
    visitSheet(card);
    const handle = card.firstElementChild as HTMLElement;
    handle.setPointerCapture = () => undefined;
    handle.dispatchEvent(pointer('pointerdown', 600));
    handle.dispatchEvent(pointer('pointermove', 420));
    expect(card.style.height).toBe('380px');
    handle.dispatchEvent(pointer('pointerup', 420));
    expect(card.style.height).toBe('400px');
    // A move or a let-go without a press first does nothing.
    handle.dispatchEvent(pointer('pointermove', 100));
    handle.dispatchEvent(pointer('pointercancel', 100));
    expect(card.style.height).toBe('400px');
  });

  it('keeps between a sliver and nearly all of the screen, however far it is dragged', () => {
    const card = panel();
    visitSheet(card);
    const handle = card.firstElementChild as HTMLElement;
    handle.setPointerCapture = () => undefined;
    handle.dispatchEvent(pointer('pointerdown', 600));
    handle.dispatchEvent(pointer('pointermove', -900));
    expect(card.style.height).toBe('680px');
    handle.dispatchEvent(pointer('pointermove', 2000));
    expect(card.style.height).toBe('60px');
  });

  it('steps through its stops with the arrow keys, and stops at either end', () => {
    const card = panel();
    visitSheet(card);
    const handle = card.firstElementChild as HTMLElement;
    const press = (key: string) => {
      const event = new KeyboardEvent('keydown', { key, cancelable: true });
      handle.dispatchEvent(event);
      return event;
    };
    expect(press('ArrowUp').defaultPrevented).toBe(true);
    expect(card.style.height).toBe('400px');
    press('ArrowUp');
    press('ArrowUp');
    expect(card.style.height).toBe('680px');
    press('ArrowDown');
    press('ArrowDown');
    press('ArrowDown');
    expect(card.style.height).toBe('200px');
    expect(press('Enter').defaultPrevented).toBe(false);
  });

  it('gives the sheet back its own height when the visit ends', () => {
    const card = panel();
    const sheet = visitSheet(card);
    card.style.height = '500px';
    sheet.stop();
    expect(card.style.height).toBe('');
  });

  it('copes with a panel that is not in a frame yet', () => {
    const card = document.createElement('section');
    Object.defineProperty(card, 'offsetHeight', { value: 0 });
    const sheet = visitSheet(card);
    const handle = card.firstElementChild as HTMLElement;
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(card.style.height).toBe('0px');
    sheet.stop();
  });
});
