import { describe, expect, it } from 'vitest';
import { heightOf, isTrack, LOOP_TIME, RAIL, STRAIGHT_TIME, timeOn } from './coaster-pieces';

describe('the pieces of a coaster', () => {
  it('knows its pieces from the rest of the catalogue', () => {
    for (const kind of [
      'coaster',
      'coaster-loop',
      'coaster-lift',
      'coaster-drop',
      'coaster-station',
    ])
      expect(isTrack(kind)).toBe(true);
    expect(isTrack('carousel')).toBe(false);
  });

  it('rides calm on the flat, slow up a lift hill and quick down a drop', () => {
    expect(timeOn('coaster')).toBe(STRAIGHT_TIME);
    expect(timeOn('coaster-station')).toBe(STRAIGHT_TIME);
    expect(timeOn('coaster-loop')).toBe(LOOP_TIME);
    expect(timeOn('coaster-lift')).toBeGreaterThan(STRAIGHT_TIME * 2);
    expect(timeOn('coaster-drop')).toBeLessThan(STRAIGHT_TIME);
    expect(timeOn('pine')).toBe(STRAIGHT_TIME);
  });

  it('lifts the rail by its variant, from as high as ever at 0 to four times as high at 1', () => {
    expect(heightOf(0)).toBe(RAIL);
    expect(heightOf(0.5)).toBe(RAIL * 2.5);
    expect(heightOf(1)).toBe(RAIL * 4);
  });
});
