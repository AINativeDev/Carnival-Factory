/**
 * The levels the North Pole owns, by id. Each is a folder in
 * `carnival/levels/` like a participant's, but the ownership check gives it
 * only to maintainers, whoever's login matches its name, and the attraction
 * of the same id is its landmark on the home map (ADR 0035).
 */
export const NORTH_POLE_LEVELS: readonly string[] = ['the-factory', 'the-academy', 'the-studio'];

export function isNorthPoleLevel(id: string): boolean {
  return NORTH_POLE_LEVELS.includes(id);
}

/** The level an attraction takes the sleigh into instead of its own room, if it's a landmark. */
export function landmarkLevel(kind: string, id: string): string | undefined {
  return kind === 'attraction' && isNorthPoleLevel(id) ? id : undefined;
}

/** Who a level is by, as its panel and its map's label say it: the North Pole, or its owner. */
export function levelOwner(login: string): string {
  return isNorthPoleLevel(login) ? 'the North Pole' : `@${login}`;
}

/**
 * Whose square this is, by login: a booth's owner, a participant's level's (the
 * level itself, or one of its squares), or none for the North Pole's own.
 */
export function squareOwner(kind: string, id: string, level?: string): string | undefined {
  const home = kind === 'level' ? id : level;
  if (home) return isNorthPoleLevel(home) ? undefined : home;
  return kind === 'booth' ? id : undefined;
}
