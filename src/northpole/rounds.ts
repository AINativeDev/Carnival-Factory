/**
 * Going round: the sides of a closed outline, and colours taken in turn. The
 * map's stalls, roofs, ropes and strings of lights all go round this way, and
 * these keep that free of index arithmetic that might miss, so the drawing
 * stays strict (docs/adr/0027-strict-typescript.md).
 */

/** Each side of a closed outline, its two ends in order round it, the last side closing it. */
export function sidesOf<T>(points: readonly T[]): { p: T; q: T; n: number }[] {
  const after = [...points.slice(1), ...points.slice(0, 1)];
  return points.flatMap((p, n) => after.slice(n, n + 1).map((q) => ({ p, q, n })));
}

/** The `n`th of a list taken in turn, round and round; the first for a count that isn't one. */
export function inTurn<T>(list: readonly [T, ...T[]], n: number): T {
  return list[n % list.length] ?? list[0];
}
