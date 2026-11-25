import { describe, expect, it } from 'vitest';
import { square as panelSquare } from './booths-panel';
import { fakeMap, square as pageSquare } from './page-fakes';
import type { MapOptions } from '../northpole/map-options';

describe('the stand-ins the page tests use', () => {
  it('give squares that draw nothing at all', () => {
    for (const square of [panelSquare('ana'), pageSquare('bob')])
      expect(() => {
        square.draw({} as CanvasRenderingContext2D, 64, 0);
      }).not.toThrow();
  });

  it('give a map with nobody near the player', () => {
    expect(fakeMap({} as MapOptions).nearest()).toEqual([]);
  });
});
