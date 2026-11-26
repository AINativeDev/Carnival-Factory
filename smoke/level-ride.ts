import { expect, type Page } from '@playwright/test';
import type { Spot, World } from '../src/northpole/world';

/**
 * Riding a ride level's coaster to a door in a real browser (ADR 0041), for
 * smoke/the-factory.spec.ts and smoke/levels.spec.ts: the car stops at each
 * station in turn, and `rideOn` (Space, by default) sends it on to the next,
 * until it stands at the station on the spot's door. The canvas says which
 * station the car is at, or riding to, in `data-ride`.
 */
export async function rideTo(
  page: Page,
  world: World,
  spot: Spot,
  rideOn: () => Promise<void> = () => page.keyboard.press('Space'),
) {
  const canvas = page.locator('.map-canvas');
  const stations = world.things.filter((thing) => thing.kind === 'coaster-station');
  const target = stations.findIndex(({ x, y }) => x === spot.door.x && y === spot.door.y);
  if (target < 0) throw new Error(`no station at ${String(spot.id)}'s door`);
  for (let ridden = 0; ridden < stations.length; ridden++) {
    const [stop = '', state = ''] = ((await canvas.getAttribute('data-ride')) ?? '').split(' ');
    if (Number(stop) === target && state === 'stopped') break;
    await rideOn();
    const next = (Number(stop) + 1) % stations.length;
    await expect(canvas).toHaveAttribute('data-ride', `${String(next)} stopped`, {
      timeout: 30_000,
    });
  }
  await expect(canvas).toHaveAttribute('data-near', `${spot.kind}:${String(spot.id)}`);
}
