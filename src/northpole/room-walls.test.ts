import { describe, expect, it } from 'vitest';
import { drawingOf } from '../test-support/recording-canvas';
import { roomArea, roomLayout } from './interior';
import { drawSideWalls, drawWindow, flakes, sideWallPoint, wallStyle } from './room-walls';
import { theme } from './theme';

const room = roomLayout(roomArea(1200, 800));
const { colors } = theme;

describe('wallStyle: the room takes after its stall', () => {
  it('gives a cabin logs, a tent stripes, an igloo blocks and the rest planks, trimmed in its roof colour', () => {
    expect(wallStyle({ shape: 'cabin', roof: 'pine' })).toEqual({
      material: 'logs',
      trim: colors.pine,
      accent: colors.cream,
    });
    expect(wallStyle({ shape: 'tent', roof: 'berry', trim: 'snow' })).toEqual({
      material: 'stripes',
      trim: colors.berry,
      accent: colors.snow,
    });
    expect(wallStyle({ shape: 'shed', roof: 'gold' }).material).toBe('planks');
    expect(wallStyle({ shape: 'kiosk', roof: 'violet' }).material).toBe('planks');
    for (const shape of ['igloo', 'lighthouse', 'turret'] as const)
      expect(wallStyle({ shape, roof: 'slab' }).material).toBe('blocks');
    expect(wallStyle({ shape: 'chalet', roof: 'berry' }).material).toBe('logs');
    expect(wallStyle({ shape: 'carousel', roof: 'berry' }).material).toBe('stripes');
  });
});

describe('sideWallPoint', () => {
  it('runs from the front edge to the back wall, and from the top to the floor', () => {
    const frontTop = sideWallPoint(room, 'left', 0, 0);
    const backBottom = sideWallPoint(room, 'left', 1, 1);
    expect(frontTop.x).toBeCloseTo(room.centre - room.frontHalf);
    expect(backBottom).toEqual({ x: room.centre - room.backHalf, y: room.back });
    expect(sideWallPoint(room, 'right', 1, 1).x).toBeCloseTo(room.centre + room.backHalf);
  });
});

describe('flakes', () => {
  it('falls with time and wraps round, the same at the same moment', () => {
    const now = flakes(12, 3.2);
    expect(now).toHaveLength(12);
    expect(flakes(12, 3.2)).toEqual(now);
    expect(flakes(12, 3.3)[0]?.y).not.toBe(now[0]?.y);
    expect(now.every((flake) => flake.x >= 0 && flake.x <= 1 && flake.y >= 0 && flake.y <= 1)).toBe(
      true,
    );
  });
});

describe('drawing the walls and the window', () => {
  it('draws each material on both side walls, with trim in the roof colour', () => {
    for (const shape of ['cabin', 'tent', 'shed', 'igloo'] as const) {
      const calls = drawingOf((ctx) => {
        drawSideWalls(ctx, room, wallStyle({ shape, roof: 'pine' }));
      });
      expect(calls.length).toBeGreaterThan(20);
      expect(calls).toContainEqual(['=fillStyle', colors.pine]);
    }
  });

  it('shows the dusk through a window in the lit wall, with snow falling past it', () => {
    const calls = drawingOf((ctx) => {
      drawWindow(ctx, room, 4.5);
    });
    expect(calls.some(([name]) => name === 'clip')).toBe(true);
    expect(calls).toContainEqual(['=fillStyle', colors.snow]);
  });
});
