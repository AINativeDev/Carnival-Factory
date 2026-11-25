// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { startHarness } from './map-harness';
import { levelOptions } from './map-fixtures';

describe('the map harness', () => {
  it('records each canvas by name, reads back what was set, and puts the page back when it stops', () => {
    const map = startHarness(levelOptions([]));
    const ctx = document.createElement('canvas').getContext('2d');
    const calls = map.record(() => {
      if (!ctx) throw new Error('no context');
      ctx.fillStyle = 'gold';
      ctx.drawImage(map.canvas, 0, 0);
      expect(ctx.fillStyle).toBe('gold');
    });
    expect(calls).toEqual([
      ['=fillStyle', 'gold'],
      ['drawImage', 'canvas 1200x800', 0, 0],
    ]);
    map.stop();
    expect(document.createElement('canvas').getContext('2d')).toBeNull();
  });
});
