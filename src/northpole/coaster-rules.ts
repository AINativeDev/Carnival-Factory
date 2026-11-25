/**
 * The rules a level's coaster keeps, in words its owner can act on: every
 * piece joins the one listed before it and loops stand on straight runs
 * (ADR 0039), and in a ride level, which visitors ride instead of walk
 * (ADR 0041), the track runs round from a boarding station where they arrive,
 * with a station at every square's and every exit's door. `validateLevel` in
 * `level-check.ts` runs them once everything stands where it may.
 */
import { isTrack } from './coaster-pieces';
import type { LevelProp, NorthPoleLevel } from './level';
import type { Stand } from './level-check-places';
import { key, type Tile } from './world';

/** The coaster's pieces, in the order they're listed, each with its place in the level's props. */
const piecesOf = (props: readonly LevelProp[]) =>
  props.flatMap((prop, n) => (isTrack(prop.kind) ? [{ ...prop, n }] : []));

const joins = (a: Tile, b: Tile) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

/**
 * What's wrong with a level's coaster: each piece must join the one listed
 * before it, side by side, and a loop must stand on a straight run, so the
 * ticket goes in one side and out the other.
 */
export function rideProblems(props: readonly LevelProp[]): string[] {
  const pieces = piecesOf(props);
  const problems: string[] = [];
  pieces.forEach((piece, i) => {
    const before = i > 0 ? pieces.at(i - 1) : undefined;
    const after = pieces.at(i + 1);
    if (before && !joins(before, piece))
      problems.push(
        `prop ${piece.n}, a ${piece.kind}, doesn't join prop ${before.n}, the coaster piece before it`,
      );
    if (piece.kind === 'coaster-loop' && before && after)
      if (before.x !== after.x && before.y !== after.y)
        problems.push(`prop ${piece.n}, a coaster-loop, must stand on a straight run of track`);
  });
  return problems;
}

/**
 * What's wrong with a ride level, one visitors ride round instead of walking:
 * its track must start at a station where they arrive and run round back to
 * it, every station must stand at a door, and every door must have one, so
 * the car stops at each square and at the sleigh home. A level that isn't a
 * ride has nothing to keep here but `ride` itself being true or false.
 */
export function rideLevelProblems(level: NorthPoleLevel, stands: readonly Stand[]): string[] {
  const { ride } = level as { ride?: unknown };
  if (ride !== undefined && typeof ride !== 'boolean') return ['its ride must be true or false'];
  if (!ride) return [];
  const pieces = piecesOf(level.props ?? []);
  const first = pieces.at(0);
  const last = pieces.at(-1);
  if (!first || !last || first.kind !== 'coaster-station')
    return ["a ride level's track must start with a coaster-station"];
  const problems: string[] = [];
  if (first.x !== level.arrival.x || first.y !== level.arrival.y)
    problems.push('visitors must arrive on the first coaster-station');
  if (pieces.length < 3 || !joins(first, last))
    problems.push("a ride level's track must run round: its last piece must join its first");
  const doors = new Set(stands.map((stand) => key(stand.door.x, stand.door.y)));
  const stations = new Set<string>();
  for (const piece of pieces.filter((p) => p.kind === 'coaster-station')) {
    stations.add(key(piece.x, piece.y));
    if (!doors.has(key(piece.x, piece.y)))
      problems.push(
        `prop ${piece.n}, a coaster-station, must stand at a square's or an exit's door`,
      );
  }
  for (const stand of stands)
    if (!stations.has(key(stand.door.x, stand.door.y)))
      problems.push(`${stand.what} needs a coaster-station at its door`);
  return problems;
}
