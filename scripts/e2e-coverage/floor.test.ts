import { describe, expect, it } from 'vitest';
import { checkFloor } from './floor';

describe('checkFloor: combined line coverage only rises', () => {
  it('passes at or above the floor, and offers the higher whole point to lock in', () => {
    expect(checkFloor(77.4, 76)).toEqual({ below: undefined, raised: 77 });
    expect(checkFloor(76, 76)).toEqual({ below: undefined, raised: 76 });
  });

  it('says so when a run falls below, and never lowers the floor', () => {
    expect(checkFloor(75.5, 76)).toEqual({ below: 'lines 75.5% < 76%', raised: 76 });
  });
});
