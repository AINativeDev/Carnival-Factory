import { describe, expect, it } from 'vitest';
import {
  isNorthPoleLevel,
  landmarkLevel,
  levelOwner,
  NORTH_POLE_LEVELS,
  squareOwner,
} from './north-pole-levels';

describe('North Pole levels', () => {
  it('knows The Factory is the North Pole’s own level', () => {
    expect(NORTH_POLE_LEVELS).toContain('the-factory');
    expect(isNorthPoleLevel('the-factory')).toBe(true);
    expect(isNorthPoleLevel('jedi4ever')).toBe(false);
  });

  it('opens a level from its landmark attraction, and nothing else', () => {
    expect(landmarkLevel('attraction', 'the-factory')).toBe('the-factory');
    expect(landmarkLevel('attraction', 'ferris-wheel')).toBeUndefined();
    expect(landmarkLevel('booth', 'the-factory')).toBeUndefined();
    expect(landmarkLevel('level', 'the-factory')).toBeUndefined();
  });

  it('credits a North Pole level to the North Pole, and any other to its owner', () => {
    expect(levelOwner('the-factory')).toBe('the North Pole');
    expect(levelOwner('jedi4ever')).toBe('@jedi4ever');
  });

  it("names a square's owner, and nobody for the North Pole's own", () => {
    expect(squareOwner('booth', 'ana')).toBe('ana');
    expect(squareOwner('attraction', 'ferris-wheel')).toBeUndefined();
    expect(squareOwner('attraction', 'hut', 'bo')).toBe('bo');
    expect(squareOwner('attraction', 'gate', 'the-factory')).toBeUndefined();
  });
});
