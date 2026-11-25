/**
 * Switches feature flags (src/feature-flags.ts) for the tests of the
 * `describe` it's called in, and back after each, so a test can check a
 * feature both on and off.
 */
import { afterEach, beforeEach } from 'vitest';
import type { FeatureFlags } from '../feature-flag-names';
import { FEATURE_FLAGS } from '../feature-flags';

export function switchFlags(flags: Partial<FeatureFlags>) {
  let before = { ...FEATURE_FLAGS };
  beforeEach(() => {
    before = { ...FEATURE_FLAGS };
    Object.assign(FEATURE_FLAGS, flags);
  });
  afterEach(() => {
    Object.assign(FEATURE_FLAGS, before);
  });
}
