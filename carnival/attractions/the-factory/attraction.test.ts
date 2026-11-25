import { describe, expect, it } from 'vitest';
import { BELT, PUFF, parcelAt, puffAt } from './attraction';

describe('puffAt', () => {
  it('rises from the chimney and starts again, each puff in turn', () => {
    expect(puffAt(0, 0)).toBe(0);
    expect(puffAt(PUFF / 2, 0)).toBeCloseTo(0.5);
    expect(puffAt(PUFF, 0)).toBeCloseTo(0);
    expect(puffAt(0, 1)).toBeCloseTo(1 / 3);
  });
});

describe('parcelAt', () => {
  it('rides the belt from the door to the end, two parcels apart', () => {
    expect(parcelAt(0, 0)).toBe(0);
    expect(parcelAt(BELT / 4, 0)).toBeCloseTo(0.25);
    expect(parcelAt(0, 1)).toBeCloseTo(0.5);
  });
});
