/**
 * Every stall shape's plan in one row: how tall its walls stand and how high
 * its roof rises, how much reaches over that (a pennant, sails, a lamp), its
 * outline on the ground, the material of the room inside it and the board its
 * name is lettered on. A new shape is one more row here and one more body in
 * `stall-shapes.ts`, so the map, the room and the tests all follow it.
 */
import type { SignKind } from './sign-styles';
import type { StallShape, ThemeColor } from './square';

/** A round or many-sided outline: its number of sides, its radius as a share of the spot, and its turn. */
interface Ring {
  sides: number;
  radius: number;
  turn: number;
}

/** One stall shape's plan, in world pixels, with its outline (square when it has no `ring`). */
export interface ShapePlan {
  wall: number;
  roof: number;
  /** How far over its roof something of it reaches. */
  extra: number;
  ring?: Ring;
  sign: SignKind;
  /** The trim it takes when the square names none. */
  trim: ThemeColor;
}

/** The usual walls, as tall as the market stall's: the name board fits under their top. */
const WALL = 104;
const round = (sides: number, radius = 0.46): Ring => ({ sides, radius, turn: 0 });

/** Each shape the map draws, by name. */
export const SHAPE_PLANS: Record<StallShape, ShapePlan> = {
  stall: { wall: WALL, roof: 25, extra: 5, sign: 'stall', trim: 'snow' },
  shed: { wall: WALL, roof: 10, extra: 5, sign: 'shed', trim: 'cream' },
  tent: {
    wall: WALL - 24,
    roof: 70,
    extra: 20,
    ring: round(20),

    sign: 'tent',
    trim: 'snow',
  },
  cabin: { wall: WALL, roof: 46, extra: 5, sign: 'cabin', trim: 'snow' },
  // Flat to the front, so the drawing's board stands against one side.
  kiosk: {
    wall: WALL - 16,
    roof: 56,
    extra: 14,
    ring: round(6),

    sign: 'kiosk',
    trim: 'cream',
  },
  igloo: {
    wall: 40,
    roof: 44,
    extra: 8,
    ring: round(16),

    sign: 'ice',
    trim: 'snow',
  },
  gazebo: {
    wall: WALL - 20,
    roof: 30,
    extra: 14,
    ring: round(8),

    sign: 'kiosk',
    trim: 'cream',
  },
  chalet: { wall: WALL, roof: 58, extra: 5, sign: 'cabin', trim: 'cream' },
  treehouse: {
    wall: WALL + 20,
    roof: 34,
    extra: 10,

    sign: 'cabin',
    trim: 'snow',
  },
  windmill: {
    wall: WALL + 10,
    roof: 30,
    extra: 40,
    ring: round(8, 0.42),

    sign: 'shed',
    trim: 'snow',
  },
  lighthouse: {
    wall: WALL + 50,
    roof: 42,
    extra: 8,
    ring: round(12, 0.3),

    sign: 'ice',
    trim: 'snow',
  },
  'food-truck': {
    wall: WALL + 8,
    roof: 8,
    extra: 8,

    sign: 'stall',
    trim: 'snow',
  },
  carousel: {
    wall: WALL - 20,
    roof: 44,
    extra: 14,
    ring: round(20),

    sign: 'tent',
    trim: 'snow',
  },
  turret: {
    wall: WALL + 26,
    roof: 46,
    extra: 18,
    ring: round(10, 0.4),

    sign: 'shed',
    trim: 'snowShade',
  },
  barn: { wall: WALL, roof: 48, extra: 5, sign: 'cabin', trim: 'snow' },
  pagoda: { wall: WALL, roof: 64, extra: 12, sign: 'tent', trim: 'gold' },
};
