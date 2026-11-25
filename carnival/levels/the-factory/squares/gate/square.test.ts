import { describe, expect, it } from 'vitest';
import { CYCLE, gateAt } from './square';

describe('gateAt', () => {
  it('opens wide for a change whose checks pass, then shuts', () => {
    expect(gateAt(0)).toEqual({ open: 0, waits: false });
    expect(gateAt(CYCLE / 2).open).toBe(1);
    expect(gateAt(CYCLE * 0.99).open).toBe(0);
  });

  it('stays shut for every other change, which waits for a person', () => {
    expect(gateAt(CYCLE * 1.5)).toEqual({ open: 0, waits: true });
    expect(gateAt(CYCLE * 2.5).waits).toBe(false);
  });
});
