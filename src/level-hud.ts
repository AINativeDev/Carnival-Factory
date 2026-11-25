/**
 * What a level's map says about it to a screen reader: its name, who it's by
 * and how to walk it. A participant's level credits `@<login>`; the North
 * Pole's own say "the North Pole" (ADR 0035). The panel beside the map
 * (level-panel.ts) shows the rest.
 */
interface LevelMap {
  setAttribute(name: string, value: string): void;
}

export function labelLevel(
  map: LevelMap,
  level: { name: string; ride?: boolean },
  owner: string,
): void {
  // A ride level is ridden in the coaster's car, not walked (ADR 0041).
  const how = level.ride
    ? 'Ride the coaster: press Space or the right arrow, or tap, to ride on to the next station. Press E at a station to go inside its stall, or at the sleigh to go back to the North Pole. Plus and minus, or the wheel, zoom.'
    : "Walk with WASD or the arrow keys, or click where you'd like to go. Press E at a square to go inside, or at the sleigh to go back to the North Pole. Plus and minus, or the wheel, zoom.";
  map.setAttribute('aria-label', `${level.name}, a level by ${owner}. ${how}`);
}
