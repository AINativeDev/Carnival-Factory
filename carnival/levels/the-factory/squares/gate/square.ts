import { box, glow, iso, scene, shadow } from '../../../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';

const { colors } = theme;

/** How long the gate takes over one change, in milliseconds: the checks, then open, then shut. */
export const CYCLE = 8_000;

/**
 * How far open the gate is at `time`, from 0 (shut) to 1 (wide open). Every
 * other change is one a person must look at: for that one the gate stays
 * shut and the bell over it rings instead.
 */
export function gateAt(time: number): { open: number; waits: boolean } {
  const turn = Math.floor(time / CYCLE);
  const waits = Math.abs(turn % 2) === 1;
  const phase = time / CYCLE - turn;
  const open = waits ? 0 : Math.max(0, Math.min(1, Math.sin(phase * Math.PI) * 1.6 - 0.3));
  return { open, waits };
}

/** One half of the gate, hung from its post and swung open by `open`. */
function leaf(ctx: CanvasRenderingContext2D, side: -1 | 1, open: number) {
  const reach = 10 * (1 - open * 0.85);
  for (const z of [6, 14])
    box(
      ctx,
      side < 0 ? -12 : 12 - reach,
      -1,
      reach,
      2,
      2,
      colors.gold,
      colors.gold,
      colors.gingerbread,
      z,
    );
}

/** The gate: two lamp posts and a gate that swings open for a change, or stays shut while it waits for a person. */
const gate: NorthPoleSquare = {
  id: 'gate',
  name: 'The Gate',
  description: 'The merge gate: every check must pass, and some changes wait for a person.',
  stall: { shape: 'stall', roof: 'gold', trim: 'berry' },
  draw(ctx, size, time) {
    scene(ctx, size, time, (ctx) => {
      const foot = iso(0, 0);
      shadow(ctx, foot.x, foot.y, 40);
      const { open, waits } = gateAt(time);
      for (const gx of [-14, 12]) {
        box(ctx, gx, -2, 2, 4, 26, colors.snow, colors.wood, colors.cocoa);
        const lamp = iso(gx + 1, 0, 28);
        ctx.fillStyle = waits ? colors.berry : colors.aurora;
        ctx.beginPath();
        ctx.arc(lamp.x, lamp.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        glow(ctx, lamp.x, lamp.y, 8, 0.7);
      }
      leaf(ctx, -1, open);
      leaf(ctx, 1, open);
      // A person's bell over the gate, swinging while the change waits for them.
      const bell = iso(0, 0, 30 + (waits ? Math.sin(time / 120) * 1.5 : 0));
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.arc(bell.x, bell.y, 3, Math.PI, 0);
      ctx.lineTo(bell.x + 3.6, bell.y + 2);
      ctx.lineTo(bell.x - 3.6, bell.y + 2);
      ctx.fill();
    });
  },
};

export default gate;
