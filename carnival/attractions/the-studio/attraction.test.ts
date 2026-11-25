import { describe, expect, it } from 'vitest';
import { dishTurn, onAirGlow, PULSE, SIGN } from './attraction';

describe('onAirGlow', () => {
  it('pulses between half and full brightness', () => {
    expect(onAirGlow(0)).toBeCloseTo(0.75);
    expect(onAirGlow(PULSE / 4)).toBeCloseTo(1);
    expect(onAirGlow((PULSE * 3) / 4)).toBeCloseTo(0.5);
  });
});

describe('dishTurn', () => {
  it('turns the dish a little either way, never round', () => {
    for (let time = 0; time < 20_000; time += 500)
      expect(Math.abs(dishTurn(time))).toBeLessThanOrEqual(0.35);
  });
});

describe('the sign', () => {
  it('says ON AIR', () => {
    expect(SIGN).toBe('ON AIR');
  });
});
