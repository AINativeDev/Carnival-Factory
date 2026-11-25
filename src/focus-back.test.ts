// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { focusBack } from './focus-back';

/** A map frame with its canvas, and a button on the page outside it. */
function page() {
  document.body.innerHTML =
    '<button id="search">Search</button><div class="map-frame"><canvas tabindex="0"></canvas></div>';
  const frame = document.querySelector<HTMLElement>('.map-frame');
  const search = document.querySelector<HTMLElement>('#search');
  if (!frame || !search) throw new Error('The test page is missing its parts');
  return { frame, search };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('focus after a panel closes', () => {
  it('goes back to what had it before the panel opened', () => {
    const { frame, search } = page();
    focusBack(search, frame);
    expect(document.activeElement).toBe(search);
  });

  it("goes to the map's canvas when nothing, the body or something since removed had it", () => {
    const { frame, search } = page();
    const canvas = frame.querySelector('canvas');
    for (const before of [null, document.body, search]) {
      if (before === search) search.remove();
      document.body.focus();
      focusBack(before, frame);
      expect(document.activeElement).toBe(canvas);
    }
  });

  it('stays put when there is no canvas to go to', () => {
    const frame = document.createElement('div');
    focusBack(null, frame);
    expect(document.activeElement).toBe(document.body);
  });
});
