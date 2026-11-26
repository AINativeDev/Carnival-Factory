/**
 * The feature flags: unfinished parts of the site the live build keeps hidden
 * until they're ready, with their code kept (docs/adr/0046-launch-behind-feature-flags.md).
 * Plain functions with no build-time constants, so vite.config.ts and the smoke
 * tests read the same list the page does.
 */

/**
 * Every feature flag: Remix this booth, the Elf Engineer badges, the Gift Shop,
 * the advent calendar, participants' levels, the Year in Review and People's Choice.
 */
const FEATURE_FLAG_NAMES = [
  'remix',
  'elfEngineer',
  'giftShop',
  'advent',
  'levels',
  'yearInReview',
  'peoplesChoice',
] as const;

export type FeatureFlag = (typeof FEATURE_FLAG_NAMES)[number];

/** Which feature flags are on. */
export type FeatureFlags = Record<FeatureFlag, boolean>;

/**
 * Reads the build's `FEATURE_FLAGS` setting, such as `remix,advent`: the flags
 * it names are on, every other one is off, and a name it doesn't know is ignored.
 */
export function readFeatureFlags(list: string | undefined): FeatureFlags {
  const on = new Set((list ?? '').split(',').map((name) => name.trim()));
  const flags = {} as FeatureFlags;
  for (const name of FEATURE_FLAG_NAMES) flags[name] = on.has(name);
  return flags;
}

/** The attractions a feature flag holds back, by id: hidden from the map, its lists and its links while it's off. */
const FLAGGED_ATTRACTIONS: Readonly<Partial<Record<string, FeatureFlag>>> = {
  'gift-shop': 'giftShop',
  'the-year-in-review': 'yearInReview',
};

/** Whether an attraction stands on the map with these flags. */
export function attractionShown(id: string, flags: FeatureFlags): boolean {
  const flag = FLAGGED_ATTRACTIONS[id];
  return flag === undefined || flags[flag];
}
