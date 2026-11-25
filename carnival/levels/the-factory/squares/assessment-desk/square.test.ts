import { describe, expect, it } from 'vitest';
import { ANSWERS, STAMP, stampAt } from './square';

describe('stampAt', () => {
  it('visits each answer in turn, and starts again', () => {
    expect(ANSWERS).toEqual(['accepted', 'asked', 'declined']);
    expect(stampAt(0).tray).toBe(0);
    expect(stampAt(STAMP * 1.5).tray).toBe(1);
    expect(stampAt(STAMP * 2.5).tray).toBe(2);
    expect(stampAt(STAMP * 3.5).tray).toBe(0);
  });

  it('presses down halfway through each turn', () => {
    expect(stampAt(0).press).toBeCloseTo(0);
    expect(stampAt(STAMP / 2).press).toBeCloseTo(1);
  });
});
