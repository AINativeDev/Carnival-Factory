/**
 * Cocoa Rush, a shift at the Hot Cocoa Stand: elves queue at the hatch, each
 * with an order, and a tap on the buttons builds their cup in the order they
 * asked for. The right cup earns a tip; a wrong topping spills the cup and
 * costs the customer's patience; a customer whose patience runs out walks
 * off, and the third walk-off ends the shift. With nobody playing, the stand's
 * own elf serves the queue, never wrong.
 *
 * The attraction keeps one `Stand` between frames, and `advance` moves it on.
 */
import type { SquarePointer } from '../../../src/northpole/square';
import { buttonAt } from './buttons';
import { orderFor, patienceFor, tipFor } from './orders';

/** How many walk-offs end the shift. */
export const STRIKES = 3;
/** How long the next customer takes to step up to the hatch, in ms. */
export const ARRIVE = 900;
/** How long a spilled cup takes to be wiped up, while the buttons wait, in ms. */
export const SPILL = 700;
/** How long after the shift ends before a tap opens the stand again, in ms. */
export const CARD = 1_200;
/** How long a finished shift waits for a tap before the stand's own elf serves again, in ms. */
export const IDLE = 25_000;
/** How long the stand's own elf takes over each thing it puts in a cup, in ms. */
export const DEMO_STEP = 700;
/** How much of a customer's patience a spilled cup costs. */
const SPILL_COST = 0.15;

/** The elf at the hatch: which customer of the shift, their order, how long they'll wait, and since when. */
export interface Customer {
  n: number;
  order: number[];
  patience: number;
  arrives: number;
  /** Patience lost to spilled cups, in ms. */
  lost: number;
}

/** A customer walking away from the hatch: happy with their cup, and the tip they left, or cross. */
interface Leaving {
  at: number;
  n: number;
  happy: boolean;
  tip: number;
}

/** The last button pressed: which, when, and whether it was right, wrong, or had to wait. */
interface Press {
  item: number;
  at: number;
  verdict: 'right' | 'wrong' | 'wait';
}

/** One shift at the stand, the visitor's or the stand's own. */
export interface Shift {
  visitor: boolean;
  customer: Customer;
  /** What's in the cup so far. */
  made: number[];
  served: number;
  tips: number;
  walkOffs: number;
  spilled: number;
  pressed: Press | null;
  leaving: Leaving | null;
  ended: number | null;
}

/** All the stand remembers for one visit: the shift, the best tips, and whether this shift beat them. */
export interface Stand {
  shift: Shift;
  best: number;
  record: boolean;
}

/** Customer `n` of the shift, stepping up to the hatch at `arrives`. */
export function customer(n: number, arrives: number): Customer {
  const order = orderFor(n);
  return { n, order, patience: patienceFor(n, order.length), arrives, lost: 0 };
}

/** A fresh shift at `time`, the visitor's or the stand's own. */
export function newShift(time: number, visitor: boolean): Shift {
  return {
    ...{ visitor, customer: customer(0, time + ARRIVE), made: [], served: 0, tips: 0 },
    ...{ walkOffs: 0, spilled: -Infinity, pressed: null, leaving: null, ended: null },
  };
}

/** The stand at the start of a visit: its own elf serving the queue. */
export function newStand(time: number): Stand {
  return { shift: newShift(time, false), best: 0, record: false };
}

/** How much of the customer's patience is left at `time`, from 1 (just arrived) to 0 (walking off). */
export function patienceLeft(who: Customer, time: number): number {
  const waited = Math.max(0, time - who.arrives) + who.lost;
  return Math.max(0, Math.min(1, 1 - waited / who.patience));
}

/** Whether the buttons work at `time`: someone is at the hatch, nothing is spilled, the shift is on. */
export function ready(shift: Shift, time: number): boolean {
  return shift.ended === null && time >= shift.customer.arrives && time - shift.spilled >= SPILL;
}

/** Sends the customer away at `time`, happy or not, and brings the next one up. */
function farewell(shift: Shift, time: number, happy: boolean, tip: number) {
  const { customer: who } = shift;
  shift.leaving = { at: time, n: who.n, happy, tip };
  shift.made = [];
  shift.customer = customer(who.n + 1, time + ARRIVE);
}

/** A press of `item`'s button at `time`: the next thing in the cup, the cup served, or a spill. */
export function press(shift: Shift, item: number, time: number) {
  if (!ready(shift, time)) {
    shift.pressed = { item, at: time, verdict: 'wait' };
    return;
  }
  const { customer: who } = shift;
  if (who.order.at(shift.made.length) !== item) {
    shift.pressed = { item, at: time, verdict: 'wrong' };
    shift.spilled = time;
    shift.made = [];
    who.lost += who.patience * SPILL_COST;
    return;
  }
  shift.pressed = { item, at: time, verdict: 'right' };
  shift.made = [...shift.made, item];
  if (shift.made.length < who.order.length) return;
  const tip = tipFor(who.order.length, patienceLeft(who, time));
  shift.tips += tip;
  shift.served += 1;
  farewell(shift, time, true, tip);
}

/** A visitor's customer whose patience ran out at `time` walks off; the third walk-off ends the shift. */
export function settle(shift: Shift, time: number) {
  if (!shift.visitor || shift.ended !== null) return;
  if (time < shift.customer.arrives || patienceLeft(shift.customer, time) > 0) return;
  shift.walkOffs += 1;
  farewell(shift, time, false, 0);
  if (shift.walkOffs >= STRIKES) shift.ended = time;
}

/** The stand's own elf: the next thing in the cup every DEMO_STEP, never wrong. */
function autoplay(shift: Shift, time: number) {
  const next = shift.customer.order.at(shift.made.length);
  const since = time - (shift.pressed?.at ?? -Infinity);
  if (next !== undefined && ready(shift, time) && since >= DEMO_STEP) press(shift, next, time);
}

/**
 * Moves the stand on to `time`, with what the pointer did since the last frame
 * over a square `size` across: the first tap opens the stand for the visitor,
 * taps on the buttons build the cup, and after the shift a tap opens it again.
 */
export function advance(
  stand: Stand,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
): Stand {
  let { shift, best, record } = stand;
  const over = shift.ended === null ? 0 : time - shift.ended;
  if (shift.visitor && over > IDLE) shift = newShift(time, false);
  if (pointer && pointer.presses > 0) {
    if (!shift.visitor || over >= CARD) [shift, record] = [newShift(time, true), false];
    else {
      const item = buttonAt((pointer.x * 100) / size, (pointer.y * 100) / size);
      if (item !== null && shift.ended === null) press(shift, item, time);
    }
  }
  if (!shift.visitor) autoplay(shift, time);
  const open = shift.ended === null;
  settle(shift, time);
  if (open && shift.ended !== null && shift.tips > best) [best, record] = [shift.tips, true];
  return { shift, best, record };
}
