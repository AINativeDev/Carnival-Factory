/**
 * The floor under the combined line coverage, unit and browser tests together
 * (docs/adr/0032-browser-coverage-counts.md). Like the unit-test thresholds, it
 * moves in whole points and only rises: a run below it fails, and a run above it
 * offers the higher number to lock in.
 */
export function checkFloor(percent: number, floor: number) {
  return {
    below: percent < floor ? `lines ${String(percent)}% < ${String(floor)}%` : undefined,
    raised: Math.max(floor, Math.floor(percent)),
  };
}
