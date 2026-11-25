import { describe, expect, it } from 'vitest';
import { NOTE, noteAt } from './square';

describe('noteAt', () => {
  it('lets each note rise from the ear in turn, then starts again', () => {
    expect(noteAt(0, 0)).toBe(0);
    expect(noteAt(NOTE / 2, 0)).toBeCloseTo(0.5);
    expect(noteAt(0, 1)).toBeCloseTo(1 / 3);
    expect(noteAt(-NOTE / 4, 0)).toBeCloseTo(0.75);
  });
});
