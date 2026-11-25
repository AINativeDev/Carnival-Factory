import { describe, expect, it } from 'vitest';
import { CHECKS, ROUND, checksPassed } from './square';

describe('checksPassed', () => {
  it('lights each check in turn, holds them all, then starts a new round', () => {
    const beat = ROUND / (CHECKS + 1);
    expect(checksPassed(0)).toBe(0);
    expect(checksPassed(beat * 2.5)).toBe(2);
    expect(checksPassed(ROUND - 1)).toBe(CHECKS);
    expect(checksPassed(ROUND)).toBe(0);
  });
});
