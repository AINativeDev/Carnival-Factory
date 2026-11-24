import { box, glow, iso, pine, scene, shadow, stringLights } from '../../northpole/diorama';
import type { Point } from '../../northpole/diorama';
import type { NorthPoleSquare } from '../../northpole/square';
import { canvasFont, theme } from '../../northpole/theme';

const { colors } = theme;

// The game: Snap, played by two elves, as plain functions.

/** A card: its rank, 1 to `RANKS`, shown as that many pips, and its suit, 0 to `SUITS` - 1. */
export interface Card {
  rank: number;
  suit: number;
}

export const RANKS = 5;
export const SUITS = 4;

/** One of the two elves at the table: 0 on the left, 1 on the right. */
export type Player = number;

/** Every card once, rank by rank: `RANKS` times `SUITS` cards. */
export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (let rank = 1; rank <= RANKS; rank++) {
    for (let suit = 0; suit < SUITS; suit++) deck.push({ rank, suit });
  }
  return deck;
}

/** A small seeded random number generator: the same seed always gives the same numbers, 0 to 1. */
export function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The deck shuffled by `seed`, the same way every time. Leaves `deck` as it was. */
export function shuffle(deck: readonly Card[], seed: number): Card[] {
  const next = random(seed);
  const cards = [...deck];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/** Deals the deck one card at a time, left elf first, into two face-down hands. */
export function deal(deck: readonly Card[]): [Card[], Card[]] {
  return [deck.filter((_, i) => i % 2 === 0), deck.filter((_, i) => i % 2 === 1)];
}

/** Snap: the two cards on top of the pile have the same rank. */
export function isSnap(pile: readonly Card[]): boolean {
  return pile.length >= 2 && pile[pile.length - 1].rank === pile[pile.length - 2].rank;
}

export interface Flip {
  player: Player;
  card: Card;
}

/**
 * The elves take turns, `first` first, each flipping the top card of their
 * hand onto the pile, until the pile shows a snap or a hand runs out.
 */
export function playUntilSnap(
  hands: readonly [readonly Card[], readonly Card[]],
  first: Player,
): { flips: Flip[]; snapped: boolean } {
  const flips: Flip[] = [];
  const pile: Card[] = [];
  const next = [0, 0];
  let player = first;
  while (next[player] < hands[player].length) {
    const card = hands[player][next[player]++];
    flips.push({ player, card });
    pile.push(card);
    if (isSnap(pile)) return { flips, snapped: true };
    player = player === 0 ? 1 : 0;
  }
  return { flips, snapped: false };
}

/** Every round has this many flips, the last one making the snap. */
export const FLIPS = 5;

export interface Round {
  /** Who flips first: the elves take turns round by round. */
  first: Player;
  hands: [Card[], Card[]];
  /** The `FLIPS` flips, the last one a snap. */
  flips: Flip[];
  /** Who slaps the pile first, and wins it. */
  winner: Player;
}

function seedFor(index: number, attempt: number) {
  return (Math.imul(index, 2654435761) ^ Math.imul(attempt + 1, 40503)) >>> 0;
}

/**
 * Round `index` of the game, the same every time: a shuffle whose snap comes
 * on exactly the `FLIPS`th flip, and whoever is quicker to slap it.
 */
export function roundAt(index: number): Round {
  const first: Player = ((index % 2) + 2) % 2 === 0 ? 0 : 1;
  for (let attempt = 0; ; attempt++) {
    const seed = seedFor(index, attempt);
    const hands = deal(shuffle(makeDeck(), seed));
    const { flips, snapped } = playUntilSnap(hands, first);
    if ((snapped && flips.length === FLIPS) || attempt > 500) {
      const winner: Player = random(seed ^ 0x5eed)() < 0.5 ? 0 : 1;
      return { first, hands, flips, winner };
    }
  }
}

/** A game is this many rounds; the score on the table counts the rounds won in this game so far. */
export const GAME = 5;

/** How many rounds each elf has won in the current game before round `index`, or through it with `through`. */
export function tally(index: number, through = false): [number, number] {
  const start = index - (((index % GAME) + GAME) % GAME);
  const score: [number, number] = [0, 0];
  for (let i = start; i < index + (through ? 1 : 0); i++) score[roundAt(i).winner]++;
  return score;
}

// The round on the table, from `time`.

/** One whole round, in milliseconds. */
export const LOOP = 12_000;

/** Each flip takes this long, and its card is in the air for `FLIGHT` of it. */
export const FLIP_TIME = 1_320;
export const FLIGHT = 520;

export type Stage = 'deal' | 'flip' | 'slap' | 'cheer' | 'collect' | 'gather';

/** Each stage of a round, from its first moment, in milliseconds. */
const STAGES: readonly [Stage, number][] = [
  ['deal', 0],
  ['flip', 1_000],
  ['slap', 1_000 + FLIPS * FLIP_TIME],
  ['cheer', 8_400],
  ['collect', 10_000],
  ['gather', 11_000],
];

/** Wraps `value` into [0, `span`), negative values included. */
function wrap(value: number, span: number) {
  return ((value % span) + span) % span;
}

/** 0 to 1, slow at both ends. */
export function ease(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

export interface Moment {
  /** Which round, counting from when the page loaded. */
  index: number;
  stage: Stage;
  /** How far through its stage, 0 to 1. */
  progress: number;
}

/** Where the game stands at `time`. Each round lasts `LOOP`. */
export function momentAt(time: number): Moment {
  const index = Math.floor(time / LOOP);
  const t = wrap(time, LOOP);
  let at = 0;
  STAGES.forEach(([, from], i) => {
    if (t >= from) at = i;
  });
  const [stage, from] = STAGES[at];
  const to = at + 1 < STAGES.length ? STAGES[at + 1][1] : LOOP;
  return { index, stage, progress: (t - from) / (to - from) };
}

/**
 * During the flips: how many cards have landed on the pile, and how far
 * through the air the next one is, 0 to 1, or null while nobody is flipping.
 */
export function flipsAt(moment: Moment): { landed: number; flying: number | null } {
  if (moment.stage === 'deal') return { landed: 0, flying: null };
  if (moment.stage !== 'flip') return { landed: FLIPS, flying: null };
  const ms = moment.progress * FLIPS * FLIP_TIME;
  const n = Math.floor(ms / FLIP_TIME);
  const into = ms - n * FLIP_TIME;
  return into < FLIGHT ? { landed: n, flying: into / FLIGHT } : { landed: n + 1, flying: null };
}

/** How many face-down cards are in each elf's stack, and in the deck in the middle, at `moment`. */
export function stacksAt(moment: Moment, round: Round): { hands: [number, number]; deck: number } {
  const whole = RANKS * SUITS;
  const half = whole / 2;
  const { stage, progress } = moment;
  if (stage === 'deal') {
    const dealt = Math.floor(progress * whole);
    return { hands: [Math.ceil(dealt / 2), Math.floor(dealt / 2)], deck: whole - dealt };
  }
  const gone = [0, 0];
  const { landed, flying } = flipsAt(moment);
  round.flips.slice(0, landed + (flying === null ? 0 : 1)).forEach((f) => gone[f.player]++);
  const hands: [number, number] = [half - gone[0], half - gone[1]];
  if (stage === 'gather') {
    hands[round.winner] += FLIPS;
    const left = 1 - progress;
    const back = Math.round(hands[0] * left) + Math.round(hands[1] * left);
    return {
      hands: [Math.round(hands[0] * left), Math.round(hands[1] * left)],
      deck: whole - back,
    };
  }
  return { hands, deck: 0 };
}

// Drawing it: a lantern-lit card table on a slab of snow at dusk.

type Ctx = CanvasRenderingContext2D;

const TABLE = { gx: -8, gy: -8, w: 16, d: 16, h: 8 };
const TOP = TABLE.h + 0.8;
/** Where each elf's stack, the pile and the deck lie on the table, in ground units. */
const SPOTS = {
  hands: [
    { gx: -4.4, gy: 4 },
    { gx: 4, gy: -4.4 },
  ],
  pile: { gx: 0, gy: 0 },
} as const;
/** Where each elf stands, beside the table. */
const ELVES = [
  { gx: -12.5, gy: 7.5 },
  { gx: 7.5, gy: -12.5 },
] as const;
const SUIT_COLOURS = [colors.berry, colors.pine, colors.violet, colors.gingerbread] as const;
/** Each elf's coat and hat. */
const OUTFITS = [
  { coat: colors.pine, shade: colors.pineDark, hat: colors.berry },
  { coat: colors.berry, shade: colors.cocoa, hat: colors.pine },
] as const;
const CARD = { a: 1.6, b: 2.2 };
const THICK = 0.22;
/** How much bigger the elves are drawn than their outline below. */
const ELF = 1.5;

function poly(ctx: Ctx, color: string, points: readonly Point[]) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach((p, n) => (n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
}

function line(ctx: Ctx, color: string, width: number, a: Point, b: Point) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

/** Pip spots on a card's face, in halves of its width and length. */
const PIPS: readonly (readonly [number, number][])[] = [
  [],
  [[0, 0]],
  [
    [0, -0.45],
    [0, 0.45],
  ],
  [
    [0.35, -0.5],
    [0, 0],
    [-0.35, 0.5],
  ],
  [
    [-0.4, -0.45],
    [0.4, -0.45],
    [-0.4, 0.45],
    [0.4, 0.45],
  ],
  [
    [-0.4, -0.5],
    [0.4, -0.5],
    [0, 0],
    [-0.4, 0.5],
    [0.4, 0.5],
  ],
];

/**
 * A card lying flat at (gx, gy), `z` up, face up when `card` is given. `fold`
 * squeezes it along its length, 1 flat to 0 edge on, as it turns over.
 */
function flatCard(ctx: Ctx, gx: number, gy: number, z: number, card: Card | null, fold = 1) {
  const b = CARD.b * fold;
  const at = (u: number, v: number) => iso(gx + u * CARD.a, gy + v * b, z);
  poly(ctx, card ? colors.cream : colors.berry, [at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)]);
  if (!card) {
    poly(ctx, colors.gold, [at(0, -0.55), at(0.5, 0), at(0, 0.55), at(-0.5, 0)]);
    return;
  }
  ctx.fillStyle = SUIT_COLOURS[card.suit % SUIT_COLOURS.length];
  for (const [u, v] of PIPS[card.rank] ?? []) {
    const p = at(u, v);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 0.55, 0.38 * Math.max(0.2, fold), 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A face-down stack of `count` cards at (gx, gy) on the table. */
function stack(ctx: Ctx, gx: number, gy: number, count: number) {
  if (count <= 0) return;
  const h = count * THICK;
  box(
    ctx,
    gx - CARD.a,
    gy - CARD.b,
    CARD.a * 2,
    CARD.b * 2,
    h,
    colors.berry,
    colors.cream,
    colors.snowShade,
    TOP,
  );
  flatCard(ctx, gx, gy, TOP + h, null);
}

function lerp(a: Point, b: Point, k: number): Point {
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}

/** A small jitter for the `n`th card on the pile, so the pile looks tossed rather than stacked. */
function jitter(n: number) {
  return { gx: Math.sin(n * 2.3) * 0.5, gy: Math.cos(n * 1.7) * 0.5 };
}

interface Pose {
  /** Where each hand is on screen: the one away from the table, then the one that plays. */
  hands: [Point, Point];
  /** How high the elf hops, for a cheer. */
  hop: number;
}

/** An elf standing at (x, y), facing the table: `face` 1 looks right, -1 left. */
function elf(ctx: Ctx, foot: Point, face: 1 | -1, who: Player, pose: Pose) {
  const outfit = OUTFITS[who];
  shadow(ctx, foot.x, foot.y, 6 * ELF);
  ctx.save();
  ctx.translate(foot.x, foot.y - pose.hop);
  ctx.scale(ELF, ELF);
  const x = 0;
  const y = 0;
  // Legs and boots.
  ctx.fillStyle = colors.ink;
  ctx.fillRect(x - 1.4, y - 3, 1.1, 3);
  ctx.fillRect(x + 0.3, y - 3, 1.1, 3);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 1.6 + face * 0.3, y - 0.8, 1.5, 0.8);
  ctx.fillRect(x + 0.1 + face * 0.3, y - 0.8, 1.5, 0.8);
  // The coat, lit on its left, with a gold belt.
  poly(ctx, outfit.coat, [
    { x: x - 2.6, y: y - 2.6 },
    { x: x + 2.6, y: y - 2.6 },
    { x: x + 1.8, y: y - 8.4 },
    { x: x - 1.8, y: y - 8.4 },
  ]);
  poly(ctx, outfit.shade, [
    { x, y: y - 2.6 },
    { x: x + 2.6, y: y - 2.6 },
    { x: x + 1.8, y: y - 8.4 },
    { x, y: y - 8.4 },
  ]);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 2.3, y - 4.6, 4.6, 0.7);
  // The head, ears and face, looking at the table.
  const head = { x: x + face * 0.3, y: y - 10.2 };
  ctx.fillStyle = colors.cream;
  for (const side of [-1, 1]) {
    poly(ctx, colors.cream, [
      { x: head.x + side * 1.6, y: head.y - 0.4 },
      { x: head.x + side * 3, y: head.y - 1.4 },
      { x: head.x + side * 1.6, y: head.y + 0.6 },
    ]);
  }
  ctx.beginPath();
  ctx.arc(head.x, head.y, 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.arc(head.x + face * 0.8, head.y - 0.2, 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.berry;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(head.x + face * 1.1, head.y + 0.7, 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // The hat, its tip flopping away from the table, and its snowy pompom.
  poly(ctx, outfit.hat, [
    { x: head.x - 2.1, y: head.y - 1 },
    { x: head.x + 2.1, y: head.y - 1 },
    { x: head.x - face * 2.6, y: head.y - 5.4 },
  ]);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(head.x - 2.2, head.y - 1.6, 4.4, 0.9);
  ctx.beginPath();
  ctx.arc(head.x - face * 2.6, head.y - 5.4, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Which way the table is from elf `who`: 1 to the right, -1 to the left. */
function towardTable(who: Player): 1 | -1 {
  return who === 0 ? 1 : -1;
}

/** An elf's two arms, drawn over the table, from the shoulders to `pose.hands`. */
function arms(ctx: Ctx, foot: Point, who: Player, pose: Pose) {
  const outfit = OUTFITS[who];
  const y = foot.y - pose.hop;
  const toward = towardTable(who);
  const shoulders = [
    { x: foot.x - toward * 1.7 * ELF, y: y - 7.6 * ELF },
    { x: foot.x + toward * 1.7 * ELF, y: y - 7.6 * ELF },
  ];
  shoulders.forEach((s, n) => {
    line(ctx, outfit.coat, 1.3 * ELF, s, pose.hands[n]);
    ctx.fillStyle = colors.cream;
    ctx.beginPath();
    ctx.arc(pose.hands[n].x, pose.hands[n].y, 0.75 * ELF, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** A speech bubble saying `text` above (x, y). */
function bubble(ctx: Ctx, x: number, y: number, text: string, alpha: number) {
  ctx.globalAlpha = alpha;
  poly(ctx, colors.cream, [
    { x: x - 1, y: y - 1.5 },
    { x: x + 1.2, y: y - 1.5 },
    { x: x + 0.2, y: y + 0.4 },
  ]);
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.roundRect(x - 6.5, y - 6.5, 13, 5.2, 1.6);
  ctx.fill();
  ctx.fillStyle = colors.berry;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(x, y - 3.85);
  ctx.scale(0.24, 0.24);
  ctx.fillText(text, 0, 0, 11.5 / 0.24);
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** The score for each elf: a little stack of gold chips beside their cards. */
function chips(ctx: Ctx, who: Player, count: number) {
  const spot = who === 0 ? { gx: -5, gy: -2.4 } : { gx: -2.4, gy: -5 };
  for (let n = 0; n < count; n++) {
    const p = iso(spot.gx, spot.gy, TOP + n * 0.6);
    ctx.fillStyle = colors.gingerbread;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 0.3, 1.3, 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 1.3, 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function lantern(ctx: Ctx, time: number) {
  const post = { gx: -12, gy: -12 };
  const base = iso(post.gx, post.gy);
  const tip = iso(post.gx, post.gy, 32);
  const hook = iso(0, 0, 32);
  shadow(ctx, base.x, base.y, 3);
  line(ctx, colors.cocoa, 0.9, base, tip);
  line(ctx, colors.cocoa, 0.6, tip, hook);
  const lamp = iso(0, 0, 27);
  line(ctx, colors.ink, 0.25, hook, lamp);
  const flicker = 0.9 + 0.1 * Math.sin(time / 700) * Math.sin(time / 330);
  glow(ctx, lamp.x, lamp.y + 2, 20, flicker);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(lamp.x - 1.8, lamp.y - 0.8, 3.6, 1);
  ctx.fillStyle = colors.lantern;
  ctx.globalAlpha = flicker;
  ctx.fillRect(lamp.x - 1.4, lamp.y, 2.8, 3.4);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(lamp.x - 1.8, lamp.y + 3.4, 3.6, 0.8);
}

function table(ctx: Ctx) {
  const { gx, gy, w, d, h } = TABLE;
  const feet = iso(0, 0);
  shadow(ctx, feet.x, feet.y + 1, 22);
  // Four legs, then the top with its green baize.
  for (const [lx, ly] of [
    [gx + 0.4, gy + d - 1.4],
    [gx + w - 1.4, gy + d - 1.4],
    [gx + w - 1.4, gy + 0.4],
    [gx + 0.4, gy + 0.4],
  ]) {
    box(ctx, lx, ly, 1, 1, h - 1, colors.wood, colors.wood, colors.cocoa);
  }
  box(ctx, gx, gy, w, d, 1, colors.wood, colors.gingerbread, colors.cocoa, h - 0.4);
  poly(ctx, colors.pine, [
    iso(gx + 0.8, gy + 0.8, TOP),
    iso(gx + w - 0.8, gy + 0.8, TOP),
    iso(gx + w - 0.8, gy + d - 0.8, TOP),
    iso(gx + 0.8, gy + d - 0.8, TOP),
  ]);
}

function paint(ctx: Ctx, time: number) {
  const moment = momentAt(time);
  const round = roundAt(moment.index);
  const { stage, progress } = moment;
  const { landed, flying } = flipsAt(moment);
  const counts = stacksAt(moment, round);

  // The back of the scene: two pines, with a string of lights from each to the lantern post.
  const pines = [iso(-19, 10), iso(10, -19)];
  pines.forEach((p) => pine(ctx, p.x, p.y, 15));
  const post = iso(-12, -12, 32);
  const bulbs: Point[] = [];
  for (const p of pines) {
    for (let n = 1; n < 6; n++) {
      const k = n / 6;
      bulbs.push({
        x: p.x + (post.x - p.x) * k,
        y: p.y - 13 + (post.y - p.y + 13) * k + Math.sin(k * Math.PI) * 3,
      });
    }
  }
  stringLights(ctx, bulbs, [colors.lantern, colors.berry, colors.gold, colors.mint], time);

  // Where the hands rest, and where each elf reaches.
  const rest = SPOTS.hands.map((s) => iso(s.gx, s.gy, TOP + 1.6));
  const pileAt = iso(SPOTS.pile.gx, SPOTS.pile.gy, TOP + 1);
  const feet = ELVES.map((e) => iso(e.gx, e.gy));
  const poses: [Pose, Pose] = [0, 1].map((who) => {
    const side = feet[who].x - towardTable(who) * 2 * ELF;
    return {
      hands: [{ x: side, y: feet[who].y - 4.5 * ELF }, lerp(rest[who], feet[who], 0.15)],
      hop: 0,
    } as Pose;
  }) as [Pose, Pose];

  // The card in the air: from its elf's stack to the pile, turning over on the way.
  let inAir: { flip: Flip; at: { gx: number; gy: number }; z: number; fold: number } | null = null;
  if (flying !== null) {
    const flip = round.flips[landed];
    const from = SPOTS.hands[flip.player];
    const to = jitter(landed);
    const k = ease(flying);
    inAir = {
      flip,
      at: { gx: from.gx + (to.gx - from.gx) * k, gy: from.gy + (to.gy - from.gy) * k },
      z: TOP + Math.sin(k * Math.PI) * 3 + landed * THICK,
      fold: Math.abs(Math.cos(k * Math.PI)),
    };
    const p = iso(inAir.at.gx, inAir.at.gy, inAir.z + 0.6);
    poses[flip.player].hands[1] = p;
  }
  const loser: Player = round.winner === 0 ? 1 : 0;
  if (stage === 'slap') {
    poses[round.winner].hands[1] = lerp(rest[round.winner], pileAt, ease(progress * 2.4));
    poses[loser].hands[1] = lerp(rest[loser], pileAt, ease(progress * 1.6 - 0.15));
  }
  if (stage === 'cheer') {
    const hop = Math.abs(Math.sin(progress * Math.PI * 3)) * 2;
    const winner = feet[round.winner];
    poses[round.winner].hop = hop;
    poses[round.winner].hands = [
      { x: winner.x - towardTable(round.winner) * 3 * ELF, y: winner.y - 13 * ELF - hop },
      { x: winner.x + towardTable(round.winner) * 3 * ELF, y: winner.y - 13 * ELF - hop },
    ];
    poses[loser].hands[1] = lerp(pileAt, rest[loser], ease(progress * 3));
  }
  if (stage === 'collect') {
    poses[round.winner].hands[1] = lerp(pileAt, rest[round.winner], ease(progress));
  }

  // The elves, standing either side of the table.
  elf(ctx, feet[0], 1, 0, poses[0]);
  elf(ctx, feet[1], -1, 1, poses[1]);

  lantern(ctx, time);
  table(ctx);

  // The score of this game so far.
  const score = tally(moment.index, stage === 'collect' || stage === 'gather');
  chips(ctx, 0, score[0]);
  chips(ctx, 1, score[1]);

  // The deck in the middle while dealing and gathering, and each elf's stack.
  stack(ctx, SPOTS.pile.gx, SPOTS.pile.gy, counts.deck);
  SPOTS.hands.forEach((s, who) => stack(ctx, s.gx, s.gy, counts.hands[who]));

  // The pile: face up, slightly tossed, sliding to the winner once it's won.
  if (stage !== 'deal' && stage !== 'gather') {
    const slide = stage === 'collect' ? ease(progress) : 0;
    const to = SPOTS.hands[round.winner];
    round.flips.slice(0, landed).forEach((flip, n) => {
      const j = jitter(n);
      const gx = j.gx + (to.gx - j.gx) * slide;
      const gy = j.gy + (to.gy - j.gy) * slide;
      // Rise as it slides, so it lands on top of the winner's stack rather than through it.
      const z = TOP + 0.05 + (n + counts.hands[round.winner] * slide) * THICK;
      if (slide < 1) flatCard(ctx, gx, gy, z, flip.card);
    });
  }
  if (inAir) {
    const { flip, at, z, fold } = inAir;
    flatCard(
      ctx,
      at.gx,
      at.gy,
      z,
      fold > 0 && flying !== null && flying > 0.5 ? flip.card : null,
      Math.max(0.08, fold),
    );
  }

  // Hands go over the cards: the loser's lands on the winner's in a slap.
  arms(ctx, feet[round.winner], round.winner, poses[round.winner]);
  arms(ctx, feet[loser], loser, poses[loser]);

  if (stage === 'slap' || stage === 'cheer') {
    const head = feet[round.winner];
    const fade = stage === 'cheer' ? 1 - ease((progress - 0.75) / 0.25) : ease(progress * 3);
    bubble(
      ctx,
      head.x + (round.winner === 0 ? -3 : 3),
      head.y - 19 * ELF - poses[round.winner].hop,
      'SNAP!',
      fade,
    );
  }
}

const booth: NorthPoleSquare = {
  id: 'fernandezbaptiste',
  name: "Elves' Card Table",
  description:
    'Two elves play Snap at a lantern-lit table: they flip cards in turn, and slap the pile when two match.',
  draw(ctx, size, time) {
    scene(ctx, size, time, paint);
  },
};

export default booth;
