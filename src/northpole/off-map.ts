/**
 * Attractions with no stall of their own on the map: something already on the
 * map is their way in. AI DevCon's is the billboard by the road (ADR 0058).
 * They're left out of the spots (map-plan.ts), and a visit or a pick goes to
 * where their way in stands.
 */
import type { Spot, ThingKind, World } from './world';

/** Each off-map attraction, by id, and the kind of thing that's its way in. */
const OFF_MAP: Readonly<Record<string, ThingKind>> = { 'ai-devcon': 'billboard' };

/** Whether the attraction `id` has no stall of its own. */
export const isOffMap = (id: string) => Object.hasOwn(OFF_MAP, id);

/** The spot an off-map attraction is visited at: its way in, with the door just in front of it. */
export function offMapSpot(world: World, kind: string, id: string): Spot | undefined {
  const way = kind === 'attraction' && isOffMap(id) ? OFF_MAP[id] : undefined;
  const thing = way && world.things.find((candidate) => candidate.kind === way);
  if (!thing) return undefined;
  const { x, y, w, h } = thing;
  return { kind: 'attraction', id, number: -1, x, y, w, h, door: { x: x + w / 2, y: y + h + 0.5 } };
}
