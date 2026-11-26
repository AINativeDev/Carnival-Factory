import { describe, expect, it } from 'vitest';
import theFactory from '../carnival/levels/the-factory/level';
import { FACTORY_TOUR } from './factory-tour';
import { levelWorld } from './northpole/level';
import { drawSpot } from './northpole/render';
import { targetAt } from './northpole/visit';
import { canStand, spotAtDoor } from './northpole/walking';
import { toScreen } from './northpole/world';
import { drawingOf } from './test-support/recording-canvas';

/** The spots the coaster's car stops at, in the order it rides to them from the boarding station (ADR 0041). */
function stopsAlongRide(): string[] {
  const world = levelWorld(theFactory);
  return world.things
    .filter((thing) => thing.kind === 'coaster-station')
    .map((station) => spotAtDoor(world, station)?.id ?? `nothing at ${String(station.x)}`);
}

describe('FACTORY_TOUR', () => {
  it('tells a step for every stall of The Factory, in the order the ride stops at them', () => {
    // The car boards by the sleigh home, then stops at each stall's station in turn.
    expect(theFactory.ride).toBe(true);
    expect(stopsAlongRide()).toEqual(['north-pole', ...Object.keys(FACTORY_TOUR)]);
  });

  it('keeps each step to a few plain sentences, with a link', () => {
    for (const stop of Object.values(FACTORY_TOUR)) {
      expect(stop.story.split('. ').length).toBeLessThanOrEqual(3);
      expect(stop.href).toMatch(/^https:\/\/github\.com\//);
      expect(stop.label).not.toBe('');
    }
  });
});

describe("The Factory's layout", () => {
  it('leaves ground beside every door clear of the stalls on screen', () => {
    // A click on ground behind a pavilion opens the pavilion (onClick in
    // src/northpole/map.ts), so a door with every tile beside it hidden that
    // way can't be walked to with clicks.
    const world = levelWorld(theFactory);
    const stalls = world.spots
      .filter((spot) => spot.kind === 'attraction')
      .map((spot) => {
        const square = { id: spot.id ?? '', name: '', description: '', draw: () => undefined };
        let box = { x: 0, y: 0, w: 0, h: 0 };
        drawingOf((ctx) => (box = drawSpot(ctx, spot, square, () => undefined, 0)));
        return { spot, box };
      });
    const hidden = world.spots
      .filter(({ door }) =>
        [
          { x: door.x + 1, y: door.y },
          { x: door.x, y: door.y + 1 },
          { x: door.x, y: door.y - 1 },
        ].every((tile) => !canStand(world, tile) || targetAt(stalls, toScreen(tile))),
      )
      .map((spot) => spot.id);
    expect(hidden).toEqual([]);
  });
});
