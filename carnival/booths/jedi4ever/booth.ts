import type { NorthPoleSquare, SquarePointer } from '../../../northpole/square';
import { canvasFont, theme } from '../../../northpole/theme';

const { colors } = theme;

/** One whole round of the factory, in milliseconds. */
export const LOOP = 12_000;

/** A new letter drops through the slot every `SLOT` milliseconds. */
export const SLOT = 3_000;

export type Toy = 'train' | 'teddy' | 'rocket';

/** What each of the round's letters becomes: three toys, taking turns, and one for later. */
export const LETTERS: readonly (Toy | 'maybe later')[] = [
  'train',
  'teddy',
  'maybe later',
  'rocket',
];

export type Stage = 'drop' | 'carry' | 'sort' | 'belt' | 'check' | 'hop' | 'float' | 'tray';

/** Each stage of a letter's trip, from its first moment, in milliseconds after it arrives. */
const TOY_TRIP: readonly [Stage, number][] = [
  ['drop', 0],
  ['carry', 800],
  ['sort', 1_400],
  ['belt', 2_600],
  ['check', 6_200],
  ['hop', 7_400],
];
/** A toy is in the sack this long after its letter arrives. */
export const IN_THE_SACK = 8_200;

const LATER_TRIP: readonly [Stage, number][] = [
  ['drop', 0],
  ['carry', 800],
  ['sort', 1_400],
  ['float', 2_600],
  ['tray', 4_000],
];

/** Where things stand in the room, in hundredths of the square. */
export const PLACES = {
  slot: { x: 8, y: 24 },
  pile: { x: 8, y: 69 },
  sort: { x: 28, y: 62 },
  tray: { x: 19.5, y: 33 },
  check: { x: 72, y: 62 },
  sack: { x: 91, y: 64 },
} as const;
export const HAMMER_X = 42;
export const PAINT_X = 56;

/** The toys the sign already counts when the page opens. */
export const TOYS_AT_DAWN = 120;

/** The sign counts one more toy every `TALLY` milliseconds. */
export const TALLY = 3_000;

/** How long the number bounces after it ticks up, in milliseconds. */
export const BOUNCE = 500;

/** How many toys the sign shows at `time`: one more every `TALLY`. */
export function toysMade(time: number): number {
  return TOYS_AT_DAWN + Math.floor(Math.max(0, time) / TALLY);
}

/** How high the number hops, 0 to 1, `since` ms after it last ticked: up fast, then settling. */
export function bounceOf(since: number): number {
  if (since < 0 || since >= BOUNCE) return 0;
  const t = since / BOUNCE;
  return Math.abs(Math.sin(t * Math.PI * 2)) * (1 - t);
}

/** Wraps `value` into [0, `span`), negative values included. */
function wrap(value: number, span: number) {
  return ((value % span) + span) % span;
}

/** 0 to 1, slow at both ends. */
export function ease(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

export interface Letter {
  /** Which of the round's letters this is, 0 to 3. */
  slot: number;
  toy: Toy | null;
  stage: Stage;
  /** How far through its stage, 0 to 1. */
  progress: number;
  /** Milliseconds since it dropped through the slot. */
  age: number;
}

/**
 * The letter in `slot` at `time`, or null once its toy is in the sack. Each slot
 * gets a new letter every `LOOP`, `SLOT` after the one before it.
 */
export function letterAt(slot: number, time: number): Letter | null {
  const age = wrap(time - slot * SLOT, LOOP);
  const kind = LETTERS[slot];
  const toy = kind === 'maybe later' ? null : kind;
  const trip = toy ? TOY_TRIP : LATER_TRIP;
  const end = toy ? IN_THE_SACK : LOOP;
  if (age >= end) return null;
  let index = trip.length - 1;
  while (trip[index][1] > age) index--;
  const [stage, start] = trip[index];
  const next = index + 1 < trip.length ? trip[index + 1][1] : end;
  return { slot, toy, stage, progress: (age - start) / (next - start), age };
}

/** Every letter in the factory at `time`. */
export function lettersAt(time: number): Letter[] {
  return LETTERS.map((_, slot) => letterAt(slot, time)).filter((l): l is Letter => l !== null);
}

/** Where a letter, or the toy it's becoming, is in the room. */
export function placeOf(letter: Letter): { x: number; y: number } {
  const { slot, pile, sort, tray, check, sack } = PLACES;
  const t = letter.progress;
  const between = (a: { x: number; y: number }, b: { x: number; y: number }, k: number) => ({
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
  });
  switch (letter.stage) {
    case 'drop':
      // Falls faster as it goes, like a letter dropping.
      return between(slot, pile, t * t);
    case 'carry': {
      const at = between(pile, sort, ease(t));
      return { x: at.x, y: at.y - Math.sin(t * Math.PI) * 4 };
    }
    case 'sort':
      return { ...sort };
    case 'belt':
      return between(sort, check, t);
    case 'check':
      return { ...check };
    case 'hop': {
      const at = between(check, sack, t);
      return { x: at.x, y: at.y - Math.sin(t * Math.PI) * 14 };
    }
    case 'float': {
      const at = between(sort, tray, ease(t));
      return { x: at.x + Math.sin(t * Math.PI * 2) * 2, y: at.y };
    }
    case 'tray':
      return { ...tray };
  }
}

/** How far a letter on the belt has become a toy: 0 a letter, 1 hammered into shape, 2 painted. */
export function buildOf(letter: Letter): 0 | 1 | 2 {
  if (letter.stage === 'check' || letter.stage === 'hop') return 2;
  if (letter.stage !== 'belt') return 0;
  const { x } = placeOf(letter);
  if (x >= PAINT_X) return 2;
  if (x >= HAMMER_X) return 1;
  return 0;
}

/** How green the check lamp is: 0 amber, 1 green while a toy has passed its check. */
export function lampAt(time: number): number {
  let green = 0;
  for (const letter of lettersAt(time)) {
    if (!letter.toy) continue;
    // Passed at 6.8 s, and back to amber once the toy has gone into the sack.
    const on = ease((letter.age - 6_800) / 300) * (1 - ease((letter.age - 8_000) / 300));
    green = Math.max(green, on);
  }
  return green;
}

/** The round's last toy lands in the sack this long after the round starts. */
const LAST_LANDING = (LETTERS.length - 1) * SLOT + IN_THE_SACK;
/** The first jingle: the rocket already on the belt at time 0 lands within the first loop. */
const FIRST_LANDING = wrap(LAST_LANDING, LOOP);
/** How long the bells wiggle after a full sack. */
export const JINGLE = 1_500;

/** How hard the sleigh's bells are wiggling, 0 to 1, just after each round's last toy lands. */
export function jingleAt(time: number): number {
  const since = wrap(time - LAST_LANDING, LOOP);
  return since < JINGLE ? Math.sin((since / JINGLE) * Math.PI) : 0;
}

/** The counter on the wall: how many times the sleigh has jingled since `time` began. */
export function sacksFilled(time: number): number {
  return time < FIRST_LANDING ? 0 : Math.floor((time - FIRST_LANDING) / LOOP) + 1;
}

/** Snowflake `index` falling past the window, as 0 to 1 across and down it. */
export function snowflake(index: number, time: number): { x: number; y: number } {
  const fall = 5_000 + (index % 3) * 1_200;
  const y = wrap(time / fall + index * 0.37, 1);
  const x = wrap(index * 0.29 + Math.sin(time / 1_400 + index) * 0.06, 1);
  return { x, y };
}

/** How bright string light `index` is: between 0.55 and 1, slowly. */
export function twinkle(index: number, time: number): number {
  return 0.775 + 0.225 * Math.sin(time / 1_600 + index * 1.7);
}

/** The penguins on the workshop floor: where each stands, in hundredths of the square. */
export const PENGUINS: readonly { x: number }[] = [{ x: 19 }, { x: 35 }, { x: 51 }, { x: 66 }];
/** Every penguin's feet are on this line. */
export const PENGUIN_FEET = 95;
/** How long a penguin's hop lasts, in milliseconds. */
export const HOP = 650;

/** How far penguin `index` has shuffled from its spot at `time`, at most 1.5 either way. */
export function shuffleOf(index: number, time: number): number {
  return Math.sin(time / 2_300 + index * 1.9) * 1.5;
}

/** Whether penguin `index` has its eyes shut at `time`: a short blink every few seconds. */
export function blinking(index: number, time: number): boolean {
  return wrap(time + index * 1_300, 3_800 + index * 700) < 160;
}

/** How high a penguin is off the floor `since` milliseconds after it was tapped. */
export function hopHeight(since: number): number {
  return since >= 0 && since < HOP ? Math.sin((since / HOP) * Math.PI) * 6 : 0;
}

/**
 * Which penguin is at `x`, `y` (in hundredths of the square) at `time`, or -1 for none.
 * `lifts` is how high each penguin is off the floor, so a hopping one is found where it is.
 */
export function penguinAt(
  x: number,
  y: number,
  time: number,
  lifts: readonly number[] = [],
): number {
  return PENGUINS.findIndex((penguin, index) => {
    const feet = PENGUIN_FEET - (lifts[index] ?? 0);
    return (
      Math.abs(x - (penguin.x + shuffleOf(index, time))) <= 4.5 && y >= feet - 16 && y <= feet + 1.5
    );
  });
}

type Ctx = CanvasRenderingContext2D;

/** Words in the theme's font, `height` units tall and no wider than `width`. */
function words(ctx: Ctx, text: string, x: number, y: number, height: number, width: number) {
  ctx.save();
  ctx.font = canvasFont('title', 'bold');
  const k = height / theme.font.title;
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0, width / k);
  ctx.restore();
}

function circle(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function envelope(ctx: Ctx, u: number, x: number, y: number) {
  ctx.fillStyle = colors.snow;
  ctx.fillRect((x - 3.5) * u, (y - 2.3) * u, 7 * u, 4.6 * u);
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 0.6 * u;
  ctx.beginPath();
  ctx.moveTo((x - 3.5) * u, (y - 2.3) * u);
  ctx.lineTo(x * u, (y + 0.3) * u);
  ctx.lineTo((x + 3.5) * u, (y - 2.3) * u);
  ctx.stroke();
}

function toy(ctx: Ctx, u: number, kind: Toy, x: number, y: number, painted: boolean) {
  const paint = (color: string) => (ctx.fillStyle = painted ? color : colors.wood);
  if (kind === 'train') {
    paint(colors.berry);
    ctx.fillRect((x - 4) * u, (y - 2) * u, 6 * u, 3.5 * u);
    paint(colors.pine);
    ctx.fillRect((x + 1) * u, (y - 4.5) * u, 3 * u, 6 * u);
    paint(colors.gold);
    ctx.fillRect((x - 3) * u, (y - 4) * u, 1.6 * u, 2 * u);
    ctx.fillStyle = colors.night;
    circle(ctx, (x - 2.5) * u, (y + 1.8) * u, 1.2 * u);
    circle(ctx, (x + 2.5) * u, (y + 1.8) * u, 1.2 * u);
  } else if (kind === 'teddy') {
    paint(colors.gingerbread);
    circle(ctx, (x - 2) * u, (y - 4.6) * u, 1.1 * u);
    circle(ctx, (x + 2) * u, (y - 4.6) * u, 1.1 * u);
    circle(ctx, x * u, (y - 3.3) * u, 2.2 * u);
    circle(ctx, x * u, (y + 0.6) * u, 2.6 * u);
    paint(colors.glow);
    circle(ctx, x * u, (y + 0.9) * u, 1.3 * u);
    paint(colors.berry);
    circle(ctx, x * u, (y - 1.2) * u, 0.8 * u);
  } else {
    paint(colors.berry);
    ctx.beginPath();
    ctx.moveTo((x - 3) * u, (y + 3) * u);
    ctx.lineTo((x + 3) * u, (y + 3) * u);
    ctx.lineTo(x * u, (y - 1) * u);
    ctx.fill();
    paint(colors.ice);
    ctx.fillRect((x - 1.6) * u, (y - 3) * u, 3.2 * u, 5.5 * u);
    paint(colors.berry);
    ctx.beginPath();
    ctx.moveTo((x - 1.6) * u, (y - 3) * u);
    ctx.lineTo((x + 1.6) * u, (y - 3) * u);
    ctx.lineTo(x * u, (y - 6) * u);
    ctx.fill();
    paint(colors.gold);
    circle(ctx, x * u, (y - 1) * u, 0.8 * u);
  }
}

/**
 * An elf standing behind the belt, `x` across, with a pointed hat. `reach`
 * draws its working arm out to a point, which the caller draws the tool at.
 */
function elf(ctx: Ctx, u: number, x: number, reach: { x: number; y: number }) {
  ctx.fillStyle = colors.pine;
  ctx.fillRect((x - 3.5) * u, 57 * u, 7 * u, 10 * u);
  ctx.strokeStyle = colors.pine;
  ctx.lineWidth = 1.8 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo((x + 2.5) * u, 59 * u);
  ctx.lineTo(reach.x * u, reach.y * u);
  ctx.stroke();
  ctx.fillStyle = colors.glow;
  circle(ctx, x * u, 53.5 * u, 3.2 * u);
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo((x - 3.4) * u, 52 * u);
  ctx.lineTo((x + 3.4) * u, 52 * u);
  ctx.lineTo((x + 2) * u, 44 * u);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  circle(ctx, (x + 2) * u, 44 * u, 1.1 * u);
  ctx.fillRect((x - 3.6) * u, 51 * u, 7.2 * u, 1.6 * u);
}

function room(ctx: Ctx, u: number, size: number, time: number) {
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(0, 80 * u, size, 20 * u);
  ctx.fillStyle = colors.cocoa;
  for (let x = 0; x < 100; x += 12.5) ctx.fillRect(x * u, 80 * u, 0.5 * u, 20 * u);
  ctx.fillRect(0, 0, size, 5 * u);

  // The string of lights along the beam.
  ctx.strokeStyle = colors.pineDark;
  ctx.lineWidth = 0.5 * u;
  ctx.beginPath();
  for (let x = 0; x <= 100; x += 2) {
    const y = 5.5 + Math.abs(Math.sin((x / 100) * Math.PI * 4)) * 2;
    if (x === 0) ctx.moveTo(x * u, y * u);
    else ctx.lineTo(x * u, y * u);
  }
  ctx.stroke();
  const bulbs = [colors.berry, colors.gold, colors.mint, colors.violet, colors.ice];
  for (let i = 0; i < 9; i++) {
    const x = 6 + i * 11;
    ctx.globalAlpha = twinkle(i, time);
    ctx.fillStyle = bulbs[i % bulbs.length];
    circle(ctx, x * u, (6.5 + Math.abs(Math.sin((x / 100) * Math.PI * 4)) * 2 + 1) * u, 1.3 * u);
  }
  ctx.globalAlpha = 1;

  // The big sign.
  ctx.fillStyle = colors.gold;
  ctx.fillRect(19 * u, 10 * u, 62 * u, 11 * u);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(20 * u, 11 * u, 60 * u, 9 * u);
  ctx.fillStyle = colors.snow;
  words(ctx, "Santa's Toy Factory", 50 * u, 15.7 * u, 6.5 * u, 56 * u);

  // The window, with snow falling past it.
  ctx.fillStyle = colors.night;
  ctx.fillRect(46 * u, 23 * u, 14 * u, 17 * u);
  ctx.fillStyle = colors.snow;
  for (let i = 0; i < 9; i++) {
    const flake = snowflake(i, time);
    circle(ctx, (46.6 + flake.x * 12.8) * u, (23 + flake.y * 17) * u, 0.6 * u);
  }
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(46 * u, 37.5 * u, 14 * u, 2.5 * u);
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 1.2 * u;
  ctx.strokeRect(46 * u, 23 * u, 14 * u, 17 * u);
  ctx.beginPath();
  ctx.moveTo(53 * u, 23 * u);
  ctx.lineTo(53 * u, 40 * u);
  ctx.moveTo(46 * u, 31.5 * u);
  ctx.lineTo(60 * u, 31.5 * u);
  ctx.stroke();

  // The fireplace, its flames flickering gently.
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(26 * u, 41 * u, 14 * u, 24 * u);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(24.5 * u, 38.5 * u, 17 * u, 3 * u);
  ctx.fillStyle = colors.night;
  ctx.fillRect(29 * u, 47 * u, 8 * u, 18 * u);
  for (let i = 0; i < 3; i++) {
    const flicker = 1 + 0.15 * Math.sin(time / (260 + i * 70) + i * 2);
    const fx = 30.8 + i * 2.2;
    const h = (i === 1 ? 9 : 6.5) * flicker;
    for (const [color, scale] of [
      [colors.berry, 1],
      [colors.gold, 0.6],
    ] as const) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo((fx - 1.5 * scale) * u, 64 * u);
      ctx.quadraticCurveTo(
        (fx - 1.5 * scale) * u,
        (64 - h * scale * 0.6) * u,
        fx * u,
        (64 - h * scale) * u,
      );
      ctx.quadraticCurveTo(
        (fx + 1.5 * scale) * u,
        (64 - h * scale * 0.6) * u,
        (fx + 1.5 * scale) * u,
        64 * u,
      );
      ctx.fill();
    }
  }

  // The mail slot, the crate the letters land on and the pile on it.
  ctx.fillStyle = colors.wood;
  ctx.fillRect(2 * u, 19 * u, 12 * u, 8 * u);
  ctx.fillStyle = colors.night;
  ctx.fillRect(3.5 * u, 22.5 * u, 9 * u, 1.6 * u);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(1.5 * u, 72 * u, 13 * u, 8 * u);
  envelope(ctx, u, 7, 70.8);
  envelope(ctx, u, 9.5, 69.6);

  // The "maybe later" tray, up on its shelf.
  ctx.fillStyle = colors.wood;
  ctx.fillRect(12.5 * u, 36 * u, 14 * u, 1.4 * u);
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(13.5 * u, 33 * u, 12 * u, 3 * u);
  ctx.fillStyle = colors.cocoa;
  words(ctx, 'maybe later', 19.5 * u, 39.3 * u, 2.6 * u, 14 * u);

  // The counter, with how many sacks the sleigh has filled.
  ctx.fillStyle = colors.surface;
  ctx.fillRect(80 * u, 23 * u, 17 * u, 10 * u);
  ctx.fillStyle = colors.glow;
  words(ctx, String(sacksFilled(time) % 1000), 88.5 * u, 28.3 * u, 7 * u, 15 * u);
}

/** A flipper hanging from a shoulder at `x`, `y`, turned `angle` from straight down. */
function flipper(ctx: Ctx, u: number, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x * u, y * u);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.ellipse(0, 2.3 * u, 1.1 * u, 2.8 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Penguin `index`, shuffling and blinking, waving while `waving` and `lift` off the floor. */
function penguin(ctx: Ctx, u: number, index: number, time: number, waving: boolean, lift: number) {
  const x = PENGUINS[index].x + shuffleOf(index, time);
  const feet = PENGUIN_FEET;
  // Its shadow stays on the floor and shrinks while it hops.
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.ellipse(x * u, (feet + 0.6) * u, (4 - lift * 0.3) * u, 1.1 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.save();
  // A little waddle while it shuffles, rocking on its feet.
  const pace = Math.abs(Math.cos(time / 2_300 + index * 1.9));
  ctx.translate(x * u, (feet - lift) * u);
  ctx.rotate(Math.sin(time / 180 + index) * 0.07 * pace);

  ctx.fillStyle = colors.gold;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 1.6 * u, 0, 1.5 * u, 0.6 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = colors.night;
  ctx.beginPath();
  ctx.ellipse(0, -6 * u, 4 * u, 6 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  flipper(ctx, u, -3.4, -9, 0.3);
  const wave = waving ? -2.4 + Math.sin(time / 110) * 0.45 : -0.3;
  flipper(ctx, u, 3.4, -9, wave);
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.ellipse(0, -5.2 * u, 2.7 * u, 4.6 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.night;
  circle(ctx, 0, -12.5 * u, 3.2 * u);

  // Its eyes, shut for a moment now and then.
  ctx.fillStyle = colors.snow;
  for (const side of [-1, 1]) {
    if (blinking(index, time)) {
      ctx.fillRect((side * 1.2 - 0.8) * u, -13 * u, 1.6 * u, 0.4 * u);
    } else {
      circle(ctx, side * 1.2 * u, -13 * u, 0.85 * u);
    }
  }
  if (!blinking(index, time)) {
    ctx.fillStyle = colors.night;
    for (const side of [-1, 1]) circle(ctx, side * 1.2 * u, -12.8 * u, 0.42 * u);
  }
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.moveTo(-1 * u, -11.8 * u);
  ctx.lineTo(1 * u, -11.8 * u);
  ctx.lineTo(0, -10.3 * u);
  ctx.fill();
  ctx.restore();
}

/** How long the snow globe's snow swirls and settles after a tap, in milliseconds. */
export const SWIRL = 4_000;
const GLOBE = { x: 60, y: 75, r: 4.6 } as const;
const FLAKES = 14;

/** How wild the globe's snow is `since` milliseconds after a tap: 1 just tapped, 0 settled. */
export function swirlOf(since: number): number {
  return since >= 0 && since < SWIRL ? 1 - ease(since / SWIRL) : 0;
}

/** Whether `x`, `y` (in hundredths of the square) is on the snow globe. */
export function onGlobe(x: number, y: number): boolean {
  return Math.hypot(x - GLOBE.x, y - GLOBE.y - 1) <= GLOBE.r + 1.5;
}

/** Flake `index` in the globe, as -1 to 1 across and down from its middle, `since` a tap. */
export function globeFlake(index: number, since: number): { x: number; y: number } {
  const wild = swirlOf(since);
  const rest = { x: ((index * 0.37) % 1) * 1.4 - 0.7, y: 0.78 - ((index * 0.13) % 0.12) };
  if (wild === 0) return rest;
  const angle = since / (260 + index * 20) + index * 2.1;
  const radius = (0.25 + ((index * 0.17) % 0.55)) * wild;
  const lift = wild * (0.1 + ((index * 0.29) % 0.7));
  return {
    x: rest.x * (1 - wild) + Math.cos(angle) * radius,
    y: rest.y * (1 - wild) + (Math.sin(angle) * radius * 0.7 - lift + 0.2) * wild,
  };
}

/** The shelf by the front, with the snow globe and its tiny reindeer on it. */
function snowGlobe(ctx: Ctx, u: number, since: number) {
  const { x, y, r } = GLOBE;
  ctx.fillStyle = colors.wood;
  ctx.fillRect((x - 9) * u, (y + 6.6) * u, 18 * u, 1.4 * u);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect((x - 6) * u, (y + 8) * u, 1 * u, 2 * u);
  ctx.fillRect((x + 5) * u, (y + 8) * u, 1 * u, 2 * u);
  ctx.fillStyle = colors.berry;
  ctx.fillRect((x - 3.8) * u, (y + 4.4) * u, 7.6 * u, 2.2 * u);
  ctx.fillStyle = colors.gold;
  ctx.fillRect((x - 3.8) * u, (y + 4.4) * u, 7.6 * u, 0.5 * u);
  // The glass, glowing softly.
  ctx.globalAlpha = 0.4 + 0.1 * swirlOf(since);
  ctx.fillStyle = colors.glow;
  circle(ctx, x * u, y * u, r * u);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = colors.snow;
  ctx.lineWidth = 0.4 * u;
  ctx.beginPath();
  ctx.arc(x * u, y * u, r * u, 0, Math.PI * 2);
  ctx.stroke();
  // The reindeer: body, legs, head and antlers.
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect((x - 1.6) * u, (y + 1.2) * u, 3 * u, 1.5 * u);
  ctx.fillRect((x - 1.4) * u, (y + 2.7) * u, 0.5 * u, 1.3 * u);
  ctx.fillRect((x + 0.6) * u, (y + 2.7) * u, 0.5 * u, 1.3 * u);
  circle(ctx, (x + 2) * u, (y + 0.2) * u, 0.9 * u);
  ctx.fillRect((x + 1.4) * u, (y + 0.4) * u, 0.7 * u, 1.2 * u);
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 0.3 * u;
  ctx.beginPath();
  ctx.moveTo((x + 2) * u, (y - 0.5) * u);
  ctx.lineTo((x + 1.6) * u, (y - 1.8) * u);
  ctx.moveTo((x + 2.2) * u, (y - 0.5) * u);
  ctx.lineTo((x + 2.8) * u, (y - 1.8) * u);
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  circle(ctx, (x + 2.8) * u, (y + 0.4) * u, 0.3 * u);
  // The snow.
  ctx.fillStyle = colors.snow;
  for (let i = 0; i < FLAKES; i++) {
    const flake = globeFlake(i, since);
    circle(ctx, (x + flake.x * (r - 0.8)) * u, (y + flake.y * (r - 0.8)) * u, 0.4 * u);
  }
}

/** When each penguin was last tapped, so it can hop: the booth's one memory of the pointer. */
const tapped: number[] = PENGUINS.map(() => -Infinity);
/** When the snow globe was last tapped. */
let globeTapped = -Infinity;

/** Santa's toy factory: letters in, sorted, built into toys, checked and into the sleigh. */
const booth: NorthPoleSquare = {
  id: 'jedi4ever',
  name: "Santa's Toy Factory",
  description: 'Letters in, toys out: the workshop that builds the whole North Pole.',
  stall: { shape: 'cabin', roof: 'berry', trim: 'gold' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    const u = size / 100;
    const letters = lettersAt(time);
    const near = (x: number) =>
      letters.some((l) => l.stage === 'belt' && Math.abs(placeOf(l).x - x) < 4);

    room(ctx, u, size, time);

    // The check lamp, amber until a toy passes.
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(66.4 * u, 27 * u, 1.2 * u, 4 * u);
    const green = lampAt(time);
    ctx.fillStyle = colors.gold;
    circle(ctx, 67 * u, 32 * u, 2.4 * u);
    ctx.globalAlpha = green;
    ctx.fillStyle = colors.aurora;
    circle(ctx, 67 * u, 32 * u, 2.4 * u);
    ctx.globalAlpha = 1;

    // The wooden sign by the door, counting the toys made today.
    const hop = bounceOf(wrap(time, TALLY)) * 1.8;
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(65 * u, 34.5 * u, 0.7 * u, 2 * u);
    ctx.fillRect(76.3 * u, 34.5 * u, 0.7 * u, 2 * u);
    ctx.fillStyle = colors.wood;
    ctx.fillRect(63 * u, 36 * u, 16 * u, 10 * u);
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 0.5 * u;
    ctx.strokeRect(63.8 * u, 36.8 * u, 14.4 * u, 8.4 * u);
    ctx.fillStyle = colors.cream;
    words(ctx, 'toys today', 71 * u, 39 * u, 2.4 * u, 12 * u);
    ctx.fillStyle = colors.glow;
    words(ctx, String(toysMade(time)), 71 * u, (42.6 - hop) * u, 3.8 * u, 12 * u);

    // The sorting elf, looking letters over with a magnifying glass.
    const sorting = letters.find((l) => l.stage === 'sort');
    const glass = sorting
      ? { x: PLACES.sort.x + Math.sin(sorting.progress * Math.PI * 3) * 2, y: 57 }
      : { x: 25, y: 59 };
    elf(ctx, u, 21, glass);
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 0.8 * u;
    ctx.beginPath();
    ctx.arc(glass.x * u, (glass.y - 2) * u, 2.2 * u, 0, Math.PI * 2);
    ctx.stroke();

    // The hammering elf and the painting elf, busy while a toy passes.
    const swing = near(HAMMER_X) ? Math.sin(time / 110) : 0;
    const hammer = { x: HAMMER_X + 3, y: 57 + swing * 2.5 };
    elf(ctx, u, HAMMER_X - 2, hammer);
    ctx.fillStyle = colors.muted;
    ctx.fillRect((hammer.x - 1) * u, (hammer.y - 2.5) * u, 2.4 * u, 1.6 * u);
    const stroke = near(PAINT_X) ? Math.sin(time / 160) : 0;
    const brush = { x: PAINT_X + 3 + stroke * 1.5, y: 58 };
    elf(ctx, u, PAINT_X - 2, brush);
    ctx.fillStyle = colors.violet;
    circle(ctx, brush.x * u, (brush.y + 1) * u, 0.9 * u);

    // The checking elf, with a clipboard.
    elf(ctx, u, 79, { x: 84, y: 60 });
    ctx.fillStyle = colors.snowShade;
    ctx.fillRect(82.5 * u, 56 * u, 4 * u, 5 * u);
    ctx.fillStyle = colors.muted;
    ctx.fillRect(83.2 * u, 57.3 * u, 2.6 * u, 0.5 * u);
    ctx.fillRect(83.2 * u, 58.8 * u, 2.6 * u, 0.5 * u);

    // The belt, its rollers turning.
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(25 * u, 70 * u, 1.5 * u, 10 * u);
    ctx.fillRect(74 * u, 70 * u, 1.5 * u, 10 * u);
    ctx.fillStyle = colors.surface;
    ctx.fillRect(23 * u, 65 * u, 54 * u, 5 * u);
    ctx.fillStyle = colors.muted;
    const roll = wrap(time / 120, 6);
    for (let x = 24 + roll; x < 76; x += 6) circle(ctx, x * u, 67.5 * u, 0.7 * u);

    // The sleigh, its bells wiggling when a sack fills.
    ctx.fillStyle = colors.gingerbread;
    circle(ctx, 91 * u, 68 * u, 7 * u);
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(89 * u, 60 * u, 4 * u, 1.4 * u);
    ctx.fillStyle = colors.berry;
    ctx.beginPath();
    ctx.moveTo(82 * u, 72 * u);
    ctx.lineTo(99 * u, 72 * u);
    ctx.lineTo(99 * u, 84 * u);
    ctx.lineTo(85 * u, 84 * u);
    ctx.quadraticCurveTo(81 * u, 80 * u, 82 * u, 72 * u);
    ctx.fill();
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 0.9 * u;
    ctx.beginPath();
    ctx.moveTo(84 * u, 87 * u);
    ctx.lineTo(99 * u, 87 * u);
    ctx.moveTo(84 * u, 87 * u);
    ctx.quadraticCurveTo(80 * u, 87 * u, 81 * u, 84 * u);
    ctx.moveTo(87 * u, 84 * u);
    ctx.lineTo(87 * u, 87 * u);
    ctx.moveTo(96 * u, 84 * u);
    ctx.lineTo(96 * u, 87 * u);
    ctx.stroke();
    const wiggle = jingleAt(time) * Math.sin(time / 90) * 0.5;
    for (const [bx, phase] of [
      [84.5, 0],
      [88, 1],
    ] as const) {
      ctx.save();
      ctx.translate(bx * u, 73 * u);
      ctx.rotate(wiggle * (phase ? -1 : 1));
      ctx.fillStyle = colors.gold;
      circle(ctx, 0, 2.6 * u, 1.4 * u);
      ctx.restore();
    }

    // Every letter and toy on its way.
    for (const letter of letters) {
      const { x, y } = placeOf(letter);
      const build = buildOf(letter);
      if (letter.stage === 'tray') ctx.globalAlpha = 1 - ease((letter.progress - 0.85) / 0.15);
      if (build === 0 || !letter.toy) {
        envelope(ctx, u, x, y);
        const stamped =
          letter.stage === 'belt' ||
          letter.stage === 'float' ||
          letter.stage === 'tray' ||
          (letter.stage === 'sort' && letter.progress > 0.6);
        if (stamped) {
          ctx.fillStyle = letter.toy ? colors.pine : colors.berry;
          circle(ctx, (x + 2) * u, (y - 1) * u, 1 * u);
        }
      } else {
        toy(ctx, u, letter.toy, x, y, build === 2);
      }
      ctx.globalAlpha = 1;
    }

    // Sparks from the hammer, dabs from the brush.
    for (const letter of letters) {
      if (letter.stage !== 'belt') continue;
      const { x, y } = placeOf(letter);
      const [color, spots] =
        Math.abs(x - HAMMER_X) < 4
          ? [colors.glow, 4]
          : Math.abs(x - PAINT_X) < 4
            ? [colors.violet, 3]
            : [null, 0];
      if (!color) continue;
      ctx.fillStyle = color;
      for (let i = 0; i < spots; i++) {
        const angle = time / 300 + (i / spots) * Math.PI * 2;
        circle(ctx, (x + Math.cos(angle) * 4) * u, (y - 3 + Math.sin(angle) * 2.5) * u, 0.55 * u);
      }
    }

    // The tick over a toy that passed its check.
    const checked = letters.find((l) => l.stage === 'check' && l.progress >= 0.5);
    if (checked) {
      ctx.globalAlpha = ease((checked.progress - 0.5) / 0.2);
      ctx.strokeStyle = colors.pine;
      ctx.lineWidth = 1.4 * u;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(68.5 * u, 49 * u);
      ctx.lineTo(70.5 * u, 51 * u);
      ctx.lineTo(74 * u, 46.5 * u);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // The snow globe swirls when tapped.
    if (pointer && pointer.presses > 0 && onGlobe(pointer.x / u, pointer.y / u)) globeTapped = time;
    snowGlobe(ctx, u, time - globeTapped);

    // The penguins on the floor: one waves while the pointer is over it, and hops when tapped.
    const lifts = tapped.map((at) => hopHeight(time - at));
    const over = pointer ? penguinAt(pointer.x / u, pointer.y / u, time, lifts) : -1;
    if (pointer && pointer.presses > 0 && over >= 0) tapped[over] = time;
    PENGUINS.forEach((_, index) => penguin(ctx, u, index, time, index === over, lifts[index]));
  },
};

export default booth;
