/**
 * Stations 2 and 3, in their bays of the hall. The assessment: the elf by
 * its desk reads the ticket ("Hmm…"), and on the tap thunks ACCEPTED onto
 * it (the ticket jolts in traveller.ts, and the tessl label swings on). The
 * implement loop: a bot waits by its workbench, and on the tap parts fly in
 * from all sides, click into the booth, and a pull request pops out.
 */
import { theme } from '../../../src/northpole/theme';
import { bot, elf } from './folk';
import { boothIcon } from './icons';
import { burst, ring } from './juice';
import { letters, popIn, rounded, scatter, smooth, TYPE } from './kit';
import { type Moment, say } from './moment';
import { BOOTHS } from './steps';
import { SLAM } from './traveller';

const { colors } = theme;

/** Where the stamp lands on the ticket, on its picture. */
const STAMPED = { x: 30, y: 50 };

/** The assessment: reading, then the stamp, a THUNK and a little ink. */
export function assessScene(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { visit, since, time } = moment;
  const stamped = visit.beat > 0;
  const raise = stamped ? Math.max(0, 1 - since / SLAM) : 0.8 + Math.sin(time / 500) * 0.15;
  // The elf faces the ticket, on its left.
  ctx.save();
  ctx.translate(60, 0);
  ctx.scale(-1, 1);
  elf(ctx, 0, 71, 30, raise);
  ctx.restore();
  if (!stamped) {
    say(ctx, 'Hmm… a booth? Let’s see.', 62, 33, since - 300);
    return;
  }
  const landed = since - SLAM;
  ring(ctx, STAMPED.x, STAMPED.y, landed, 12, colors.berry);
  burst(ctx, STAMPED.x, STAMPED.y, landed, {
    count: 7,
    reach: 9,
    colours: [colors.berry],
    seed: 2,
  });
  if (landed > 0 && landed < 900) {
    ctx.globalAlpha = 1 - smooth((landed - 500) / 400);
    ctx.fillStyle = colors.gold;
    letters(ctx, 5 * popIn(landed / 200));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('THUNK!', 40, 36);
    ctx.globalAlpha = 1;
  }
  say(ctx, 'Lovely. Stamped!', 62, 33, landed);
}

/** Where the booth comes together on the workbench. */
const BENCH = { x: 56, y: 52 };

/** The pull request popping out over the bench: an Open pill, its name and its booth. */
function pullRequest(ctx: CanvasRenderingContext2D, booth: number, pop: number) {
  ctx.save();
  ctx.translate(BENCH.x + 2, 34);
  ctx.scale(pop, pop);
  ctx.rotate(-0.04);
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = colors.shadow;
  rounded(ctx, -20, -5.4, 40, 12, 2.2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.snowLit;
  rounded(ctx, -20, -6, 40, 12, 2.2);
  ctx.fill();
  ctx.fillStyle = colors.pine;
  rounded(ctx, -18, -4.2, 10, 3.8, 1.6);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  letters(ctx, TYPE.micro);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OPEN', -13, -2.2);
  ctx.fillStyle = colors.night;
  letters(ctx, TYPE.body);
  ctx.textAlign = 'left';
  ctx.fillText('Pull request', -6, -2.2, 24);
  letters(ctx, TYPE.body, false);
  ctx.fillText(`My booth: ${BOOTHS.at(booth) ?? ''}`, -18, 2.6, 36);
  ctx.restore();
}

/** The implement loop: the bot ready, then parts flying in and a pull request popping out. */
export function buildScene(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { visit, since, time } = moment;
  const building = visit.beat > 0;
  bot(ctx, 87, 72, 26, building && since < 1_400, time);
  if (!building) {
    say(ctx, 'Ready when you are!', 84, 37, since - 300);
    return;
  }
  const colours = [colors.berry, colors.gold, colors.mint, colors.violet, colors.ice];
  colours.forEach((colour, n) => {
    const t = smooth((since - n * 110) / 700);
    if (t >= 1) return;
    const from = { x: BENCH.x + (scatter(n) - 0.5) * 80, y: 26 + scatter(n + 4) * 14 };
    ctx.save();
    ctx.translate(from.x + (BENCH.x - from.x) * t, from.y + (BENCH.y - from.y) * t);
    ctx.rotate((1 - t) * 6 + n);
    ctx.fillStyle = colour;
    ctx.fillRect(-1.8, -1.2, 3.6, 2.4);
    ctx.restore();
  });
  const done = popIn((since - 900) / 400);
  if (done > 0) boothIcon(ctx, visit.booth, visit.look, BENCH.x, BENCH.y, 15 * done, time);
  burst(ctx, BENCH.x, BENCH.y, since - 900, { count: 8, reach: 12, colours: [], stars: true });
  const pop = popIn((since - 1_300) / 450);
  if (pop > 0) pullRequest(ctx, visit.booth, pop);
}
