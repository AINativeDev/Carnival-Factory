import { describe, expect, it } from 'vitest';
import { gondolaPositions, TURN } from './attraction';

describe('gondolaPositions', () => {
  it('spaces the gondolas evenly round the rim', () => {
    const [first, second, third, fourth] = gondolaPositions(4, 0, 50, 50, 10);
    expect(first.x).toBeCloseTo(60);
    expect(first.y).toBeCloseTo(50);
    expect(second.x).toBeCloseTo(50);
    expect(second.y).toBeCloseTo(60);
    expect(third.x).toBeCloseTo(40);
    expect(fourth.y).toBeCloseTo(40);
  });

  it('turns a quarter in a quarter of a turn, and comes back round', () => {
    const [quarter] = gondolaPositions(4, TURN / 4, 50, 50, 10);
    expect(quarter.x).toBeCloseTo(50);
    expect(quarter.y).toBeCloseTo(60);
    expect(gondolaPositions(8, TURN, 50, 50, 10)).toEqual(gondolaPositions(8, 0, 50, 50, 10));
  });
});
