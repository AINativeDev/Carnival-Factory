import { describe, expect, it } from 'vitest';
import { floatAt } from './square';

describe('floatAt', () => {
  it('bites for the last fifth of every 5 seconds', () => {
    expect(floatAt(1000).biting).toBe(false);
    expect(floatAt(4500).biting).toBe(true);
    expect(floatAt(6000).biting).toBe(false);
  });
});
