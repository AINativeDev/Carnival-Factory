import { describe, expect, it } from 'vitest';
import { skaterAt } from './square';

describe('skaterAt', () => {
  it('goes round the rink once every 6 seconds', () => {
    const start = skaterAt(0, 0);
    expect(skaterAt(6000, 0).x).toBeCloseTo(start.x);
    expect(skaterAt(6000, 0).y).toBeCloseTo(start.y);
    expect(skaterAt(3000, 0).x).toBeCloseTo(-start.x);
  });
});
