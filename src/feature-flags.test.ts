import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS, isOn } from './feature-flags';
import { switchFlags } from './test-support/feature-flags';

describe('the page’s feature flags', () => {
  it('are all off in the tests, as in the live build', () => {
    expect(Object.values(FEATURE_FLAGS).some(Boolean)).toBe(false);
    expect(isOn('advent')).toBe(false);
  });

  describe('switched on for one test', () => {
    switchFlags({ advent: true });
    it('reads the flag a test switched on', () => {
      expect(isOn('advent')).toBe(true);
      expect(isOn('remix')).toBe(false);
    });
  });

  it('are off again after it', () => {
    expect(isOn('advent')).toBe(false);
  });
});
