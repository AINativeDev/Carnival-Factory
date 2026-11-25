import { box, glow, iso, pine, scene, shadow, stringLights } from '../../../src/northpole/diorama';
import type { Point } from '../../../src/northpole/diorama';
import type { NorthPoleSquare } from '../../../src/northpole/square';
import { canvasFont, theme } from '../../../src/northpole/theme';

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

// Snap against the elf: the visitor plays the elf on the right, as plain functions.

/** The elf on the left, who plays the visitor, and the visitor's own elf, on the right. */
export const ELF: Player = 0;
export const YOU: Player = 1;
/** The first to win this many piles wins the game. */
export const TARGET = 10;
/** How long the elf waits on its turn before it flips. */
export const ELF_FLIP = 900;
/** The elf slaps a snap this long after the card lands, plus up to `ELF_SPREAD` more. */
export const ELF_QUICKEST = 500;
export const ELF_SPREAD = 500;
/** How long a won pile takes to go over to its winner. */
export const TAKE = 1_400;
/** A finished game waits this long before a tap starts the next, so a late slap doesn't. */
export const REST = 800;
/** With no tap for this long, the visitor has gone, and the elves play each other again. */
export const IDLE_AFTER = 20_000;

export type Phase = 'turn' | 'snap' | 'won' | 'over';

export interface Game {
  /** Each player's face-down hand, top card first: the elf's, then the visitor's. */
  hands: [Card[], Card[]];
  /** The face-up pile, bottom card first. */
  pile: Card[];
  /** Whose flip is next. */
  turn: Player;
  /** Piles won this game. */
  score: [number, number];
  /** Waiting for a flip, a snap on the pile, a pile going to its winner, or the game won. */
  phase: Phase;
  /** When the phase began. */
  since: number;
  /** During a snap: when the elf's hand lands on the pile. */
  elfSlap: number;
  /** Who won the last pile, or the game. */
  winner: Player;
  /** When the top card of the pile was flipped, and by whom. */
  flipped: { at: number; player: Player } | null;
  /** The game's shuffle, and how many times its cards have been dealt. */
  seed: number;
  deals: number;
  /** When the visitor last tapped. */
  last: number;
}

export function other(player: Player): Player {
  return player === 0 ? 1 : 0;
}

/** How long the elf takes to slap a snap flipped at `time`, the same every time for that moment. */
export function elfDelay(time: number) {
  return FLIGHT + ELF_QUICKEST + random(Math.floor(time))() * ELF_SPREAD;
}

/** A new game, shuffled from `time`: the deck dealt, nothing won yet, and the elf to flip first. */
export function newGame(time: number): Game {
  const seed = Math.floor(time) >>> 0;
  return {
    hands: deal(shuffle(makeDeck(), seed)),
    pile: [],
    turn: ELF,
    score: [0, 0],
    phase: 'turn',
    since: time,
    elfSlap: 0,
    winner: ELF,
    flipped: null,
    seed,
    deals: 1,
    last: time,
  };
}

/** Whoever's turn it is flips their top card onto the pile. A player with no cards left calls for a new deal first. */
export function flip(game: Game, time: number): Game {
  const player = game.turn;
  let { hands, pile, deals } = game;
  if (hands[player].length === 0) {
    hands = deal(shuffle(makeDeck(), (game.seed + Math.imul(deals, 7919)) >>> 0));
    pile = [];
    deals++;
  }
  const [card, ...rest] = hands[player];
  const next: Game = {
    ...game,
    hands: player === 0 ? [rest, hands[1]] : [hands[0], rest],
    pile: [...pile, card],
    deals,
    turn: other(player),
    phase: 'turn',
    since: time,
    flipped: { at: time, player },
  };
  return isSnap(next.pile) ? { ...next, phase: 'snap', elfSlap: time + elfDelay(time) } : next;
}

/** `who` slaps the snap first and wins the pile. */
export function slap(game: Game, who: Player, time: number): Game {
  const score: [number, number] = [...game.score];
  score[who]++;
  return { ...game, score, phase: 'won', since: time, winner: who };
}

/** The won pile goes under its winner's hand, and the game goes on, or ends at `TARGET`. */
function take(game: Game, time: number): Game {
  const hands: [Card[], Card[]] = [...game.hands];
  hands[game.winner] = [...hands[game.winner], ...game.pile];
  const over = game.score[game.winner] >= TARGET;
  return { ...game, hands, pile: [], flipped: null, phase: over ? 'over' : 'turn', since: time };
}

/** What happens by `time` with nobody tapping: the elf flips, slaps and takes piles on its own time. */
export function advance(game: Game, time: number): Game {
  let next = game;
  for (let n = 0; n < 100; n++) {
    if (next.phase === 'turn' && next.turn === ELF && time >= next.since + ELF_FLIP) {
      next = flip(next, next.since + ELF_FLIP);
    } else if (next.phase === 'snap' && time >= next.elfSlap) {
      next = slap(next, ELF, next.elfSlap);
    } else if (next.phase === 'won' && time >= next.since + TAKE) {
      next = take(next, next.since + TAKE);
    } else break;
  }
  return next;
}

/**
 * The visitor taps at `time`: on their turn it flips their card, on a snap it
 * slaps the pile, and once a game is won it starts the next.
 */
export function press(game: Game, time: number): Game {
  const tapped = { ...game, last: time };
  if (game.phase === 'turn' && game.turn === YOU) return flip(tapped, time);
  if (game.phase === 'snap' && time < game.elfSlap) return slap(tapped, YOU, time);
  if (game.phase === 'over' && time >= game.since + REST) return newGame(time);
  return tapped;
}

/**
 * The game at `time`, after `presses` taps since the last frame: null while
 * nobody plays. The first tap starts a game, and it ends when the visitor
 * hasn't tapped for `IDLE_AFTER`.
 */
export function play(game: Game | null, time: number, presses: number): Game | null {
  let next = game && time - game.last < IDLE_AFTER ? advance(game, time) : null;
  for (let n = 0; n < presses; n++) next = next ? press(next, time) : newGame(time);
  return next;
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
const ELF_SIZE = 1.5;

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
  shadow(ctx, foot.x, foot.y, 6 * ELF_SIZE);
  ctx.save();
  ctx.translate(foot.x, foot.y - pose.hop);
  ctx.scale(ELF_SIZE, ELF_SIZE);
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
    { x: foot.x - toward * 1.7 * ELF_SIZE, y: y - 7.6 * ELF_SIZE },
    { x: foot.x + toward * 1.7 * ELF_SIZE, y: y - 7.6 * ELF_SIZE },
  ];
  shoulders.forEach((s, n) => {
    line(ctx, outfit.coat, 1.3 * ELF_SIZE, s, pose.hands[n]);
    ctx.fillStyle = colors.cream;
    ctx.beginPath();
    ctx.arc(pose.hands[n].x, pose.hands[n].y, 0.75 * ELF_SIZE, 0, Math.PI * 2);
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

/** What the table shows at one moment, whether the elves play each other or the visitor plays. */
interface View {
  /** Face-down cards in each elf's stack, and in the deck in the middle. */
  stacks: [number, number];
  deck: number;
  /** The face-up pile, bottom card first. Its top card may still be in the air. */
  pile: readonly Card[];
  /** How far the top card is through the air, 0 to 1, flipped by `flipper`, or null once it's down. */
  flying: number | null;
  flipper: Player;
  /** How far the pile has slid over to `taker`'s stack, 0 to 1. */
  slide: number;
  taker: Player;
  /** How far each elf's playing hand reaches from its stack to the pile, 0 to 1. */
  reach: [number, number];
  /** Who hops with their arms up, and how far through the hops; and who sulks. */
  cheer: { who: Player; progress: number } | null;
  sulk: Player | null;
  bubble: { who: Player; text: string; alpha: number } | null;
  chips: [number, number];
  /** The score, while the visitor plays. */
  score: [number, number] | null;
  hint: string | null;
}

/** The elves playing each other, from `time`. */
function idleView(time: number, hovered: boolean): View {
  const moment = momentAt(time);
  const round = roundAt(moment.index);
  const { stage, progress } = moment;
  const { landed, flying } = flipsAt(moment);
  const counts = stacksAt(moment, round);
  const loser = other(round.winner);
  const reach: [number, number] = [0, 0];
  if (stage === 'slap') {
    reach[round.winner] = ease(progress * 2.4);
    reach[loser] = ease(progress * 1.6 - 0.15);
  }
  if (stage === 'cheer') reach[loser] = 1 - ease(progress * 3);
  if (stage === 'collect') reach[round.winner] = 1 - ease(progress);
  const shown = stage === 'deal' || stage === 'gather' ? 0 : landed + (flying === null ? 0 : 1);
  return {
    stacks: counts.hands,
    deck: counts.deck,
    pile: round.flips.slice(0, shown).map((f) => f.card),
    flying,
    flipper: round.flips[Math.min(landed, FLIPS - 1)].player,
    slide: stage === 'collect' ? ease(progress) : 0,
    taker: round.winner,
    reach,
    cheer: stage === 'cheer' ? { who: round.winner, progress } : null,
    sulk: null,
    bubble:
      stage === 'slap' || stage === 'cheer'
        ? {
            who: round.winner,
            text: 'SNAP!',
            alpha: stage === 'cheer' ? 1 - ease((progress - 0.75) / 0.25) : ease(progress * 3),
          }
        : null,
    chips: tally(moment.index, stage === 'collect' || stage === 'gather'),
    score: null,
    hint: hovered ? 'Tap to play Snap' : null,
  };
}

/** The visitor's game against the elf, at `time`. */
function gameView(game: Game, time: number): View {
  const since = time - game.since;
  const flying =
    game.flipped && time - game.flipped.at < FLIGHT ? (time - game.flipped.at) / FLIGHT : null;
  const reach: [number, number] = [0, 0];
  let slide = 0;
  let bubble: View['bubble'] = null;
  if (game.phase === 'snap') {
    reach[ELF] = ease((time - (game.elfSlap - ELF_QUICKEST)) / ELF_QUICKEST);
  }
  if (game.phase === 'won') {
    const k = since / TAKE;
    slide = ease((k - 0.45) / 0.55);
    reach[game.winner] = Math.min(ease(k / 0.1), 1 - slide);
    reach[other(game.winner)] = Math.min(ease((k - 0.05) / 0.15), 1 - ease((k - 0.3) / 0.2));
    bubble = { who: game.winner, text: 'SNAP!', alpha: 1 - ease((k - 0.8) / 0.2) };
  }
  const over = game.phase === 'over';
  if (over)
    bubble = { who: game.winner, text: game.winner === YOU ? 'You win!' : 'I win!', alpha: 1 };
  let hint: string | null = null;
  if (game.phase === 'turn' && game.turn === YOU && flying === null) hint = 'Your turn: tap';
  if (over && since >= REST) hint = 'Tap to play again';
  return {
    stacks: [game.hands[0].length, game.hands[1].length],
    deck: 0,
    pile: game.pile,
    flying,
    flipper: game.flipped?.player ?? ELF,
    slide,
    taker: game.winner,
    reach,
    cheer: over ? { who: game.winner, progress: (since / 2_400) % 1 } : null,
    sulk: over ? other(game.winner) : null,
    bubble,
    chips: game.score,
    score: game.score,
    hint,
  };
}

/** A line of small text centred on (x, y), at the scene's scale. */
function label(
  ctx: Ctx,
  x: number,
  y: number,
  text: string,
  color: string,
  align: 'left' | 'center',
) {
  ctx.fillStyle = color;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.3, 0.3);
  ctx.fillText(text, 0, 0, 90 / 0.3);
  ctx.restore();
}

function paint(ctx: Ctx, time: number, view: View) {
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
    const side = feet[who].x - towardTable(who) * 2 * ELF_SIZE;
    const ready = lerp(rest[who], feet[who], 0.15);
    return {
      hands: [{ x: side, y: feet[who].y - 4.5 * ELF_SIZE }, lerp(ready, pileAt, view.reach[who])],
      hop: 0,
    } as Pose;
  }) as [Pose, Pose];

  // The card in the air: from its elf's stack to the pile, turning over on the way.
  const landed = view.pile.length - (view.flying === null ? 0 : 1);
  let inAir: { card: Card; at: { gx: number; gy: number }; z: number; fold: number } | null = null;
  if (view.flying !== null) {
    const from = SPOTS.hands[view.flipper];
    const to = jitter(landed);
    const k = ease(view.flying);
    inAir = {
      card: view.pile[landed],
      at: { gx: from.gx + (to.gx - from.gx) * k, gy: from.gy + (to.gy - from.gy) * k },
      z: TOP + Math.sin(k * Math.PI) * 3 + landed * THICK,
      fold: Math.abs(Math.cos(k * Math.PI)),
    };
    poses[view.flipper].hands[1] = iso(inAir.at.gx, inAir.at.gy, inAir.z + 0.6);
  }
  if (view.cheer) {
    const { who, progress } = view.cheer;
    const hop = Math.abs(Math.sin(progress * Math.PI * 3)) * 2;
    poses[who].hop = hop;
    poses[who].hands = [
      { x: feet[who].x - towardTable(who) * 3 * ELF_SIZE, y: feet[who].y - 13 * ELF_SIZE - hop },
      { x: feet[who].x + towardTable(who) * 3 * ELF_SIZE, y: feet[who].y - 13 * ELF_SIZE - hop },
    ];
  }
  if (view.sulk !== null) {
    const who = view.sulk;
    poses[who].hands = [
      { x: feet[who].x - towardTable(who) * 2 * ELF_SIZE, y: feet[who].y - 3.6 * ELF_SIZE },
      { x: feet[who].x + towardTable(who) * 2 * ELF_SIZE, y: feet[who].y - 3.6 * ELF_SIZE },
    ];
  }

  // The elves, standing either side of the table.
  elf(ctx, feet[0], 1, 0, poses[0]);
  elf(ctx, feet[1], -1, 1, poses[1]);

  lantern(ctx, time);
  table(ctx);

  chips(ctx, 0, view.chips[0]);
  chips(ctx, 1, view.chips[1]);

  // The deck in the middle while dealing and gathering, and each elf's stack.
  stack(ctx, SPOTS.pile.gx, SPOTS.pile.gy, view.deck);
  SPOTS.hands.forEach((s, who) => stack(ctx, s.gx, s.gy, view.stacks[who]));

  // The pile: face up, slightly tossed, sliding to the winner once it's won.
  const to = SPOTS.hands[view.taker];
  view.pile.slice(0, landed).forEach((card, n) => {
    const j = jitter(n);
    const gx = j.gx + (to.gx - j.gx) * view.slide;
    const gy = j.gy + (to.gy - j.gy) * view.slide;
    // Rise as it slides, so it lands on top of the winner's stack rather than through it.
    const z = TOP + 0.05 + (n + view.stacks[view.taker] * view.slide) * THICK;
    if (view.slide < 1) flatCard(ctx, gx, gy, z, card);
  });
  if (inAir && view.flying !== null) {
    const { card, at, z, fold } = inAir;
    flatCard(ctx, at.gx, at.gy, z, view.flying > 0.5 ? card : null, Math.max(0.08, fold));
  }

  // Hands go over the cards: the loser's lands on the winner's in a slap.
  const first = view.taker;
  arms(ctx, feet[first], first, poses[first]);
  arms(ctx, feet[other(first)], other(first), poses[other(first)]);

  if (view.bubble && view.bubble.alpha > 0) {
    const { who, text, alpha } = view.bubble;
    bubble(
      ctx,
      feet[who].x + (who === 0 ? -3 : 3),
      feet[who].y - 19 * ELF_SIZE - poses[who].hop,
      text,
      alpha,
    );
  }

  // The score in the corner, and what a tap does now.
  if (view.score) {
    label(ctx, 4, 6, `You ${view.score[YOU]}`, colors.gold, 'left');
    label(ctx, 4, 11, `Elf ${view.score[ELF]}`, colors.cream, 'left');
  }
  if (view.hint) label(ctx, 50, 95, view.hint, colors.cream, 'center');
}

/** The visitor's game, kept in memory for this visit only: null while the elves play each other. */
let game: Game | null = null;

const booth: NorthPoleSquare = {
  id: 'fernandezbaptiste',
  name: "Elves' Card Table",
  description:
    'Play Snap against an elf at a lantern-lit table: flip cards in turn, and tap the pile first when two match.',
  draw(ctx, size, time, pointer) {
    game = play(game, time, pointer?.presses ?? 0);
    const view = game ? gameView(game, time) : idleView(time, pointer !== undefined);
    scene(ctx, size, time, (c, t) => paint(c, t, view));
  },
};

export default booth;
