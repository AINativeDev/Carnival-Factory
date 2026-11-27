/**
 * The speed gauge in the corner: a dial whose needle reads how fast the
 * sleigh will cross the next crest if it coasts from here, over four bands.
 * Too slow to get over, rolling over on the rail, airtime (where the presents
 * are), and too fast, which flies it off the rails. The bands move with each
 * crest: a sharper crest throws you sooner.
 */
import { theme } from '../../../src/northpole/theme';
import { letter, panel } from './lettering';

const { colors } = theme;

/** What the gauge reads, from `crestReading`. */
interface Reading {
  over: number;
  lift: number;
  crash: number;
}

export type Band = 'slow' | 'roll' | 'air' | 'off';

/** The dial runs from this much below nothing, as a share of the crest's crash speed… */
const LOW = -0.4;
/** …to this much over it. */
const HIGH = 1.3;
/** The speed the dial treats as too fast when there's no crest ahead. */
const OPEN_TRACK = 30;

/** Where `share` of the crash speed is on the dial, from 0 at its left end to 1 at its right. */
const onDial = (share: number) => (Math.min(HIGH, Math.max(LOW, share)) - LOW) / (HIGH - LOW);

/**
 * The needle and the bands' edges on the dial, each from 0 to 1. The dial
 * reads the speed squared, the push the sleigh has to spare, so holding moves
 * the needle on at a steady pace.
 */
export function dialOf(reading: Reading) {
  const crash = Number.isFinite(reading.crash) ? reading.crash : OPEN_TRACK;
  const lift = Number.isFinite(reading.lift) ? reading.lift : crash * 0.6;
  const share = (speed: number) => (speed * Math.abs(speed)) / crash ** 2;
  return {
    needle: onDial(share(reading.over)),
    edges: [onDial(0), onDial(share(lift)), onDial(1)] as const,
  };
}

/** Which band the needle is in. */
export function bandOf(reading: Reading): Band {
  const crash = Number.isFinite(reading.crash) ? reading.crash : OPEN_TRACK;
  if (reading.over < 0) return 'slow';
  if (reading.over < Math.min(reading.lift, crash)) return 'roll';
  return reading.over < crash ? 'air' : 'off';
}

/** Each band's colour and what the gauge says in it. */
const BANDS = [
  { band: 'slow', colour: colors.ice, says: 'TOO SLOW' },
  { band: 'roll', colour: colors.mint, says: 'ROLL OVER' },
  { band: 'air', colour: colors.gold, says: 'AIRTIME!' },
  { band: 'off', colour: colors.berry, says: 'TOO FAST!' },
] as const;

/** The dial's middle and size. */
const DIAL = { x: 80, y: 91.5, r: 10.5 };

/** The angle of a point `at` along the dial, from its left end over the top to its right. */
const angleOf = (at: number) => Math.PI * (1 + at);

/** The gauge, reading `reading`. */
export function drawGauge(ctx: CanvasRenderingContext2D, reading: Reading) {
  const { needle, edges } = dialOf(reading);
  const band = bandOf(reading);
  const shown = BANDS.find((b) => b.band === band) ?? BANDS[0];
  panel(ctx, 64, 77.5, 32, 20);
  const stops = [0, ...edges, 1];
  ctx.lineWidth = 3.4;
  BANDS.forEach((b, n) => {
    const from = stops.at(n) ?? 0;
    const to = stops.at(n + 1) ?? 1;
    if (to <= from) return;
    ctx.strokeStyle = b.colour;
    ctx.globalAlpha = b.band === band ? 1 : 0.45;
    ctx.beginPath();
    ctx.arc(DIAL.x, DIAL.y, DIAL.r, angleOf(from), angleOf(to));
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  const a = angleOf(needle);
  ctx.strokeStyle = colors.cream;
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(DIAL.x, DIAL.y);
  ctx.lineTo(DIAL.x + Math.cos(a) * (DIAL.r + 1), DIAL.y + Math.sin(a) * (DIAL.r + 1));
  ctx.stroke();
  ctx.fillStyle = shown.colour;
  ctx.beginPath();
  ctx.arc(DIAL.x, DIAL.y, 1.6, 0, Math.PI * 2);
  ctx.fill();
  letter(ctx, shown.says, { x: DIAL.x, y: 95, height: 2.8, colour: shown.colour, width: 28 });
}
