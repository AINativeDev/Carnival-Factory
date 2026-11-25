import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the stamp takes over one request, in milliseconds. */
export const STAMP = 1_800;

/** The three answers a request can get, in the order the stamp visits their trays. */
export const ANSWERS = ['accepted', 'asked', 'declined'] as const;

/**
 * Which tray the stamp is over at `time`, and how far down it is, from 0
 * (raised) to 1 (pressed onto the request), so each answer gets its turn.
 */
export function stampAt(time: number): { tray: number; press: number } {
  const turn = Math.floor(time / STAMP);
  const tray = ((turn % ANSWERS.length) + ANSWERS.length) % ANSWERS.length;
  const phase = time / STAMP - turn;
  return { tray, press: Math.max(0, Math.sin(phase * Math.PI)) };
}

const TRAY_COLORS = [colors.pine, colors.gold, colors.berry];

/** The assessment desk: a lamp-lit desk where a stamp marks each request accepted, asked or declined. */
const assessmentDesk: NorthPoleSquare = {
  id: 'assessment-desk',
  name: 'The Assessment Desk',
  description: 'Each request is read first: accepted, asked about, or declined.',
  stall: { shape: 'shed', roof: 'violet', trim: 'gold' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 40);
      box(ctx, -16, -8, 32, 16, 12, colors.wood, colors.gingerbread, colors.cocoa);
      const lamp = iso(-12, -6, 24);
      glow(ctx, lamp.x, lamp.y, 22);
      box(ctx, -13, -7, 2, 2, 12, colors.ink, colors.ink, colors.shadow, 12);
      const { tray, press } = stampAt(time);
      TRAY_COLORS.forEach((color, n) => {
        box(ctx, -10 + n * 9, -2, 7, 7, 2, colors.cream, color, color, 12);
        if (n === tray && press > 0.9) {
          const mark = iso(-6.5 + n * 9, 1.5, 15);
          glow(ctx, mark.x, mark.y, 8, 0.6);
        }
      });
      // The stamp, rising and pressing down over the tray whose turn it is.
      const lift = 16 - press * 12;
      box(
        ctx,
        -9 + tray * 9,
        -1,
        5,
        5,
        3,
        TRAY_COLORS[tray] ?? colors.pine,
        colors.wood,
        colors.cocoa,
        12 + lift,
      );
      box(ctx, -7.5 + tray * 9, 0.5, 2, 2, 7, colors.wood, colors.wood, colors.cocoa, 15 + lift);
    });
  },
};

export default assessmentDesk;
