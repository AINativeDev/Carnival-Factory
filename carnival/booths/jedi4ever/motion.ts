/** Wraps `value` into [0, `span`), negative values included, so every loop repeats before the page loaded too. */
export function wrap(value: number, span: number) {
  return ((value % span) + span) % span;
}

/** 0 to 1, slow at both ends: how everything in the workshop starts and stops moving. */
export function ease(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}
