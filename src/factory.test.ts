// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FactoryStats } from '../scripts/factory-stats';
import { openFactoryHud, type FactoryHudOptions } from './factory';

const SQUARES = { booths: 12, attractions: 3, people: 11 };
const STATS: FactoryStats = {
  builds: 41,
  merged: 37,
  autoMerged: 33,
  requests: 58,
  accepted: 45,
  question: 6,
  declined: 4,
  findings: 1204,
  fixed: 1100,
  readAt: '2026-11-24T18:57:03.120Z',
};

/** Opens the numbers page over a fresh map frame, the way the router does. */
function open(options: Partial<FactoryHudOptions> = {}) {
  document.body.innerHTML =
    '<button id="factory-link">Factory</button><div class="map-frame"><canvas tabindex="0"></canvas></div>';
  const frame = document.querySelector<HTMLElement>('.map-frame');
  if (!frame) throw new Error('The test page has no map frame');
  document.querySelector<HTMLElement>('#factory-link')?.focus();
  const onClose = vi.fn();
  const hud = openFactoryHud(frame, { squares: SQUARES, onClose, ...options });
  const card = frame.querySelector<HTMLElement>('.factory');
  if (!card) throw new Error('The numbers page did not open');
  return { frame, card, hud, onClose };
}

const texts = (root: ParentNode, selector: string) =>
  [...root.querySelectorAll(selector)].map((element) => element.textContent);

afterEach(() => {
  document.body.innerHTML = '';
});

describe("the factory's numbers page", () => {
  it('shows the counts it has, and says the rest appear on the live map', () => {
    const { frame, card } = open();
    expect(frame.dataset.factory).toBe('');
    expect(texts(card, '.factory-value')).toEqual(['12', '3', '11']);
    expect(card.querySelector('.factory-detail')).toBeNull();
    expect(card.querySelector('.factory-note')?.textContent).toContain('appear on the live map');
    expect(document.activeElement).toBe(card.querySelector('.visit-title'));
  });

  it("shows the factory's own numbers with their details, and when they were read", () => {
    const { card } = open({ stats: STATS });
    expect(texts(card, '.factory-value')).toEqual(['12', '3', '11', '41', '58', '1,204']);
    expect(texts(card, '.factory-detail')).toContain('1,100 fixed');
    expect(card.querySelector('.factory-note')?.textContent).toBe(
      'Last updated 24 Nov 2026, 18:57 UTC.',
    );
  });

  it('leaves with Esc or the Leave button, and keeps every other key from the map', () => {
    const { card, onClose } = open();
    const walk = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true });
    const mapKeys = vi.fn();
    window.addEventListener('keydown', mapKeys);
    document.dispatchEvent(walk);
    expect(mapKeys).not.toHaveBeenCalled();
    expect(walk.defaultPrevented).toBe(false);
    expect(onClose).not.toHaveBeenCalled();

    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    document.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    card.querySelector<HTMLButtonElement>('.visit-close')?.click();
    expect(onClose).toHaveBeenCalledTimes(2);
    window.removeEventListener('keydown', mapKeys);
  });

  it('closes, giving focus back to what had it, and stops listening for keys', () => {
    const { frame, hud, onClose } = open();
    hud.close();
    expect(frame.querySelector('.factory')).toBeNull();
    expect(frame.dataset.factory).toBeUndefined();
    expect(document.activeElement?.id).toBe('factory-link');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('leaves focus where it is when it had already moved off the page', () => {
    const { frame, hud } = open();
    frame.querySelector('canvas')?.focus();
    hud.close();
    expect(document.activeElement).toBe(frame.querySelector('canvas'));
  });
});
