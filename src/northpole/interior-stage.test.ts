import { describe, expect, it } from 'vitest';
import { roomArea, roomLayout } from './interior';
import { portraitBox } from './interior-stage';

describe("the owner's portrait on the wall", () => {
  it('hangs left of the stage, on the back wall, when there is room', () => {
    const room = roomLayout(roomArea(1200, 800));
    const box = portraitBox(room);
    expect(box).toBeDefined();
    if (!box) return;
    expect(box.x + box.w).toBeLessThan(room.stage.x);
    expect(box.x).toBeGreaterThan(room.centre - room.backHalf);
    expect(box.y).toBeGreaterThanOrEqual(room.stage.y);
  });

  it('is left out of a room too small for it', () => {
    expect(portraitBox(roomLayout({ x: 0, y: 0, w: 120, h: 100 }))).toBeUndefined();
  });
});
