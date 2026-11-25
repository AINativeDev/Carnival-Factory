import { readFeatureFlags, type FeatureFlag } from './feature-flag-names';

/**
 * The `FEATURE_FLAGS` setting the page was built with (vite.config.ts), such as
 * `remix,advent`. The unit tests build with none, as the live site does.
 */
declare const __FEATURE_FLAGS__: string;

/**
 * Which unfinished features this build shows (src/feature-flag-names.ts). Each
 * feature is gated where it enters the page, never deep in its logic, so
 * switching it on is one setting. Tests switch flags with
 * src/test-support/feature-flags.ts.
 */
export const FEATURE_FLAGS = readFeatureFlags(__FEATURE_FLAGS__);

/** Whether a feature flag is on in this build. */
export function isOn(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
