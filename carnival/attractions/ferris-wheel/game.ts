/**
 * Boarding Time, the ferris wheel's game: tap to send the next elf in the
 * queue into the car at the gate. An empty car boarded scores, more for
 * perfect timing; a tap with no car there, or on a car that's still full,
 * makes the elf miss and sulk; an empty car let go round is a miss too. Fill
 * every car for a lap bonus: the wheel whirls a victory lap, its riders hop
 * off, a few guests climb aboard (let them off first), and it turns quicker.
 * Three misses close the ride. With nobody playing, the attendant boards
 * every car perfectly, on a loop.
 *
 * The attraction keeps one `Boarding` between frames, its only state, and
 * `advance` moves it on from `time`.
 */
import * as ride from './ride';
import type { Wheel } from './ride';

/** Who's in a car: nobody, the visitor's elves, or guests who must get off first. */
export type Riders = 'empty' | 'yours' | 'guests';
/** Whether the attendant is showing the game, a visitor is playing, or the ride has closed. */
export type Mode = 'demo' | 'play' | 'over';

/** The game's one piece of state for the visit. */
export interface Boarding {
  mode: Mode;
  wheel: Wheel;
  cars: Riders[];
  /** The cars still to empty in the victory lap, and which get guests as they do. */
  whirl: boolean[];
  guests: boolean[];
  lap: number;
  score: number;
  best: number;
  misses: number;
  /** How many elves have left the queue, boarded or sulking: who's next in line. */
  served: number;
  /** Until when an empty car may go round without a miss: just after a start or a victory lap. */
  graceUntil: number;
  /** The last boarding: when, which car, and whether it was perfect. */
  boarded: { at: number; car: number; perfect: boolean };
  /** The last miss: when, and what went wrong. */
  missed: { at: number; why: string };
  lapAt: number;
  endedAt: number;
  /** When riders last hopped off at the gate: a few, for their walk away. */
  hops: { at: number; guest: boolean }[];
  then: number;
}

/** What a boarding scores, and a full wheel on each lap. */
export const POINTS = { good: 10, perfect: 25, lap: 100 };
/** Misses that close the ride. */
export const LIVES = 3;
/** How soon after a boarding another tap counts, so a double tap isn't a miss. */
const SETTLE = 220;
/** How long after a miss before another can count, while the next elf steps up. */
const STUMBLE = 700;
/** How long a new game waits for its first boarding before an empty car going round is a miss. */
const WARM_UP = 10_000;
/** How long the closed ride waits before the attendant starts showing it again. */
export const IDLE = 25_000;
/** How long the closed ride waits before a tap restarts it, so a late tap isn't taken for one. */
export const REOPEN = 900;
/** The longest frame the wheel turns for: a longer gap, a hidden tab, holds it still. */
const LONGEST_FRAME = 400;

/** A fresh round from `time`, the wheel going on from `angle`, played by a visitor or shown by the attendant. */
export function newBoarding(time: number, angle: number, mode: Mode, best = 0): Boarding {
  const warmUp = mode === 'play' ? WARM_UP : 1_200;
  return {
    ...{ mode, wheel: ride.wheelFrom(angle, time, ride.lapSpeed(1)), lap: 1, score: 0, best },
    ...{
      cars: Array<Riders>(ride.CARS).fill('empty'),
      whirl: [],
      guests: [],
      misses: 0,
      served: 0,
    },
    ...{ graceUntil: time + warmUp, lapAt: -Infinity, endedAt: -Infinity, hops: [], then: time },
    boarded: { at: -Infinity, car: -1, perfect: false },
    missed: { at: -Infinity, why: '' },
  };
}

/** A steady pseudo-random number from 0 to 1 for `n`, so guests sit in the same cars every time. */
function shuffle(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43_758.5453;
  return s - Math.floor(s);
}

/** Which cars take guests after lap `lap`'s victory: one more each lap, up to three. */
export function guestCars(lap: number, cap: number): boolean[] {
  const guests = Array<boolean>(ride.CARS).fill(false);
  const count = Math.min(cap, lap - 1);
  for (let n = 0, placed = 0; placed < count; n++) {
    const car = Math.floor(shuffle(lap * 7 + n) * ride.CARS);
    if (!guests.at(car)) [guests[car], placed] = [true, placed + 1];
  }
  return guests;
}

/** A miss at `time`, unless the elf before is still picking itself up: one mistake never costs two. */
function miss(game: Boarding, why: string, time: number) {
  if (time - game.missed.at < STUMBLE) return;
  game.misses += 1;
  game.served += 1;
  game.missed = { at: time, why };
  if (game.misses < LIVES) return;
  game.mode = 'over';
  game.endedAt = time;
  game.best = Math.max(game.best, game.score);
}

/** Every car full: the lap bonus, then a victory lap that empties the wheel and turns it quicker. */
function fullWheel(game: Boarding, time: number) {
  const demo = game.mode === 'demo';
  if (!demo) game.score += POINTS.lap * game.lap;
  game.lap += 1;
  game.lapAt = time;
  const speed = ride.lapSpeed(demo ? 1 : game.lap);
  game.wheel = { ...ride.wheelFrom(ride.angleAt(game.wheel, time), time, speed), spinAt: time };
  game.whirl = Array<boolean>(ride.CARS).fill(true);
  game.guests = guestCars(game.lap, demo ? 2 : 3);
  game.graceUntil = time + ride.SPIN + 500;
}

/** Sends the next elf into car `car`, `off` radians from the gate. */
function board(game: Boarding, car: number, off: number, time: number) {
  const perfect = Math.abs(off) <= ride.PERFECT;
  game.cars[car] = 'yours';
  game.served += 1;
  game.boarded = { at: time, car, perfect };
  // The first boarding ends a new game's warm-up: from now on every empty car counts.
  game.graceUntil = Math.min(game.graceUntil, time);
  if (game.mode === 'play') game.score += perfect ? POINTS.perfect : POINTS.good;
  if (game.cars.every((riders) => riders === 'yours')) fullWheel(game, time);
}

/** A tap at `time`: boards the car at the gate if it's empty, and is a miss otherwise. */
export function tap(game: Boarding, time: number) {
  if (ride.spinning(game.wheel, time) || time - game.boarded.at < SETTLE) return;
  const { car, off } = ride.nearestCar(ride.angleAt(game.wheel, time));
  if (Math.abs(off) > ride.WINDOW) miss(game, off < 0 ? 'Too early!' : 'Too late!', time);
  else if (game.cars.at(car) === 'guests') miss(game, 'Let them off first!', time);
  else if (game.cars.at(car) === 'yours') miss(game, 'That car is full!', time);
  else board(game, car, off, time);
}

/** Car `car` going out past the gate at `time`: riders due off hop off, and an empty one let go is a miss. */
function leaveGate(game: Boarding, car: number, time: number) {
  const riders = game.cars.at(car) ?? 'empty';
  if (game.whirl.at(car)) {
    game.whirl[car] = false;
    if (riders !== 'empty') game.hops = [...game.hops.slice(-5), { at: time, guest: false }];
    game.cars[car] = game.guests.at(car) ? 'guests' : 'empty';
  } else if (riders === 'guests') {
    game.hops = [...game.hops.slice(-5), { at: time, guest: true }];
    game.cars[car] = 'empty';
  } else if (riders === 'empty' && game.mode === 'play' && time >= game.graceUntil) {
    miss(game, 'An empty car went round!', time);
  }
}

/** The attendant's show: every empty car boarded right at the gate. */
function attend(game: Boarding, time: number) {
  if (ride.spinning(game.wheel, time) || time < game.graceUntil - 600) return;
  const { car, off } = ride.nearestCar(ride.angleAt(game.wheel, time));
  if (off >= 0 && off < ride.WINDOW && game.cars.at(car) === 'empty') board(game, car, off, time);
}

/** Moves the game on to `time`, with `presses`, the taps since the last frame. */
export function advance(game: Boarding, time: number, presses: number): Boarding {
  const gap = time - game.then;
  if (gap > LONGEST_FRAME) {
    game.wheel = ride.paused(game.wheel, gap);
    game.then = time;
  }
  const angle = ride.angleAt(game.wheel, time);
  if (presses > 0 && game.mode === 'demo') return newBoarding(time, angle, 'play', game.best);
  if (presses > 0 && game.mode === 'over' && time - game.endedAt >= REOPEN)
    return newBoarding(time, angle, 'play', game.best);
  if (game.mode === 'over' && time - game.endedAt >= IDLE)
    return newBoarding(time, angle, 'demo', game.best);
  const before = ride.angleAt(game.wheel, game.then);
  for (const car of ride.passedGate(before, angle)) {
    if (game.mode !== 'over') leaveGate(game, car, time);
  }
  if (presses > 0 && game.mode === 'play') tap(game, time);
  if (game.mode === 'demo') attend(game, time);
  game.then = time;
  return game;
}
