import { describe, expect, it } from 'vitest';
import {
  clickInRoom,
  DOOR,
  ENTRANCE,
  fadeAt,
  portraitBox,
  roomArea,
  roomLayout,
  roomToScreen,
  screenToRoom,
  stepInRoom,
} from './interior';

const laptop = roomLayout(roomArea(1280, 720));
const phone = roomLayout(roomArea(390, 760));

describe('the room inside a square', () => {
  it('stands beside the HUD on a laptop, and above it on a phone', () => {
    expect(roomArea(1280, 720)).toEqual({ x: 0, y: 0, w: 900, h: 720 });
    expect(roomArea(390, 760).h).toBeLessThan(760);
    for (const [room, area] of [
      [laptop, roomArea(1280, 720)],
      [phone, roomArea(390, 760)],
    ] as const) {
      expect(room.centre - room.frontHalf).toBeGreaterThanOrEqual(area.x);
      expect(room.centre + room.frontHalf).toBeLessThanOrEqual(area.x + area.w);
      expect(room.top - room.width * 0.06).toBeGreaterThanOrEqual(area.y);
      expect(room.front).toBeLessThanOrEqual(area.y + area.h);
    }
  });

  it('puts the square large on the back wall, square, under its sign', () => {
    const { stage, sign, top, back } = laptop;
    expect(stage.w).toBe(stage.h);
    expect(stage.w).toBeGreaterThan(300);
    expect(stage.x + stage.w / 2).toBeCloseTo(laptop.centre);
    expect(sign.y).toBeGreaterThan(top);
    expect(stage.y).toBeGreaterThan(sign.y + sign.h);
    expect(stage.y + stage.h).toBeLessThan(back);
  });

  it('maps a place in the room to the screen and back', () => {
    for (const at of [ENTRANCE, { x: 0.1, y: 0.3 }, { x: 0.9, y: 1 }]) {
      const back = screenToRoom(laptop, roomToScreen(laptop, at));
      expect(back.x).toBeCloseTo(at.x);
      expect(back.y).toBeCloseTo(at.y);
    }
    // Further forward is nearer, so larger.
    expect(roomToScreen(laptop, { x: 0.5, y: 1 }).scale).toBeGreaterThan(
      roomToScreen(laptop, { x: 0.5, y: 0.2 }).scale,
    );
  });
});

describe('walking inside', () => {
  it('keeps the player off the walls', () => {
    expect(stepInRoom({ x: 0.5, y: 0.3 }, 0, -1)).toEqual({ at: { x: 0.5, y: 0.2 }, out: false });
    expect(stepInRoom({ x: 0.1, y: 0.5 }, -1, 0).at.x).toBeGreaterThan(0);
    expect(stepInRoom({ x: 0.9, y: 0.5 }, 1, 0).at.x).toBeLessThan(1);
  });

  it('walks out through the doorway, and only through it', () => {
    expect(stepInRoom({ x: 0.5, y: 0.99 }, 0, 0.05).out).toBe(true);
    expect(stepInRoom({ x: DOOR.from - 0.05, y: 0.99 }, 0, 0.05)).toEqual({
      at: { x: DOOR.from - 0.05, y: 1 },
      out: false,
    });
  });

  it('sends a click on the floor there, and one on the doorway out', () => {
    const floor = roomToScreen(laptop, { x: 0.3, y: 0.5 });
    const to = clickInRoom(laptop, floor)!;
    expect(to.out).toBe(false);
    expect(to.to.x).toBeCloseTo(0.3);
    const door = roomToScreen(laptop, { x: 0.5, y: 1 });
    expect(clickInRoom(laptop, { x: door.x, y: door.y + 4 })?.out).toBe(true);
    expect(clickInRoom(laptop, { x: laptop.centre, y: laptop.stage.y })).toBeUndefined();
  });
});

describe('the fade in and out', () => {
  it('goes dark halfway, and is clear before and after', () => {
    expect(fadeAt(-1, 500)).toBe(0);
    expect(fadeAt(0, 500)).toBe(0);
    expect(fadeAt(250, 500)).toBe(1);
    expect(fadeAt(125, 500)).toBeCloseTo(0.5);
    expect(fadeAt(500, 500)).toBe(0);
  });
});

describe("the owner's portrait on the wall", () => {
  it('hangs left of the stage, on the back wall, when there is room', () => {
    const room = roomLayout(roomArea(1200, 800));
    const box = portraitBox(room)!;
    expect(box.x + box.w).toBeLessThan(room.stage.x);
    expect(box.x).toBeGreaterThan(room.centre - room.backHalf);
    expect(box.y).toBeGreaterThanOrEqual(room.stage.y);
  });

  it('is left out of a room too small for it', () => {
    expect(portraitBox(roomLayout({ x: 0, y: 0, w: 120, h: 100 }))).toBeUndefined();
  });
});
