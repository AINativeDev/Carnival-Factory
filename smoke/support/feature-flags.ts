/**
 * The feature flags of the build the smoke test plays: the same
 * `FEATURE_FLAGS` setting the web server's `npm run build` reads
 * (src/feature-flag-names.ts), so a spec for a hidden feature skips while it's
 * off, and smoke/feature-flags.spec.ts checks it's really gone.
 */
import { readFeatureFlags } from '../../src/feature-flag-names';

export const FLAGS = readFeatureFlags(process.env.FEATURE_FLAGS);
