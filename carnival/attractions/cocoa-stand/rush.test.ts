import { describe, expect, it } from 'vitest';
import { BUTTONS, buttonAt } from './buttons';
import { COCOA, ITEMS, orderFor, patienceFor, tipFor, toppingsFor, wobble } from './orders';
import {
  advance,
  ARRIVE,
  CARD,
  customer,
  DEMO_STEP,
  IDLE,
  newShift,
  newStand,
  patienceLeft,
  press,
  ready,
  settle,
  SPILL,
  STRIKES,
  type Shift,
} from './rush';

/** Builds the customer's whole order at `time`, a press every 100 ms, and gives back when it ended. */
function serve(shift: Shift, time: number): number {
  let now = time;
  for (const item of shift.customer.order) {
    press(shift, item, now);
    now += 100;
  }
  return now;
}

describe('the orders', () => {
  it('always start with cocoa, then toppings with no repeats, more as the shift goes on', () => {
    for (let n = 0; n < 30; n++) {
      const order = orderFor(n);
      expect(order.at(0)).toBe(COCOA);
      expect(new Set(order).size).toBe(order.length);
      expect(order).toHaveLength(1 + toppingsFor(n));
    }
    expect(toppingsFor(0)).toBe(1);
    expect(toppingsFor(100)).toBe(4);
    expect(orderFor(5)).toEqual(orderFor(5));
    expect(ITEMS).toHaveLength(5);
  });

  it('gives each customer less patience as the shift goes on, down to a floor', () => {
    expect(patienceFor(10, 3)).toBeLessThan(patienceFor(0, 3));
    expect(patienceFor(100, 3)).toBe(patienceFor(200, 3));
    expect(patienceFor(0, 5)).toBeGreaterThan(patienceFor(0, 2));
  });

  it('tips more for a bigger order and a quicker one', () => {
    expect(tipFor(2, 0)).toBe(4);
    expect(tipFor(2, 1)).toBe(9);
    expect(tipFor(5, 2)).toBe(15);
    expect(wobble(1)).toBeLessThan(1);
  });
});

describe('the buttons', () => {
  it('finds the button under a tap, or none', () => {
    for (const b of BUTTONS) expect(buttonAt(b.x + 1, b.y + 1)).toBe(b.item);
    expect(buttonAt(50, 30)).toBeNull();
  });
});

describe('a shift', () => {
  it('waits for the customer to step up before the buttons work', () => {
    const shift = newShift(0, true);
    expect(ready(shift, 0)).toBe(false);
    press(shift, COCOA, 0);
    expect(shift.pressed?.verdict).toBe('wait');
    expect(shift.made).toEqual([]);
    expect(ready(shift, ARRIVE)).toBe(true);
  });

  it('builds the cup in order and serves it for a tip', () => {
    const shift = newShift(0, true);
    serve(shift, ARRIVE);
    expect(shift.served).toBe(1);
    expect(shift.tips).toBe(tipFor(2, patienceLeft(customer(0, ARRIVE), ARRIVE + 100)));
    expect(shift.leaving).toMatchObject({ n: 0, happy: true });
    expect(shift.made).toEqual([]);
    expect(shift.customer.n).toBe(1);
  });

  it('spills the cup on a wrong topping, costing patience, and waits while it is wiped', () => {
    const shift = newShift(0, true);
    press(shift, COCOA, ARRIVE);
    const wrong = shift.customer.order.at(1) === 1 ? 2 : 1;
    press(shift, wrong, ARRIVE + 100);
    expect(shift.pressed?.verdict).toBe('wrong');
    expect(shift.made).toEqual([]);
    expect(shift.customer.lost).toBeGreaterThan(0);
    expect(ready(shift, ARRIVE + 100 + SPILL / 2)).toBe(false);
    expect(ready(shift, ARRIVE + 100 + SPILL)).toBe(true);
  });

  it('runs patience down from when the customer steps up', () => {
    const who = customer(0, 1_000);
    expect(patienceLeft(who, 0)).toBe(1);
    expect(patienceLeft(who, 1_000 + who.patience / 2)).toBeCloseTo(0.5);
    expect(patienceLeft(who, 1_000 + who.patience * 2)).toBe(0);
  });

  it('sends a customer off when their patience runs out, and ends the shift on the third', () => {
    const shift = newShift(0, true);
    let time = 0;
    for (let n = 0; n < STRIKES; n++) {
      time = shift.customer.arrives + shift.customer.patience;
      settle(shift, time - 1);
      expect(shift.walkOffs).toBe(n);
      settle(shift, time);
      expect(shift.leaving).toMatchObject({ happy: false });
    }
    expect(shift.walkOffs).toBe(STRIKES);
    expect(shift.ended).toBe(time);
    settle(shift, time + 60_000);
    expect(shift.walkOffs).toBe(STRIKES);
  });

  it('never ends the stand’s own show', () => {
    const shift = newShift(0, false);
    settle(shift, 600_000);
    expect(shift.ended).toBeNull();
  });
});

describe('advance', () => {
  const tapAt = (x: number, y: number) => ({ x, y, down: true, presses: 1 });
  /** A tap on `item`'s button, in a square 200 pixels across. */
  const tapItem = (item: number) => {
    const b = BUTTONS.at(item);
    return tapAt(((b?.x ?? 0) + 2) * 2, ((b?.y ?? 0) + 2) * 2);
  };

  it('serves the queue on its own, never wrong, until a tap opens the stand', () => {
    let stand = newStand(0);
    for (let time = 0; time < 60_000; time += 50) stand = advance(stand, time, undefined, 200);
    expect(stand.shift.served).toBeGreaterThan(5);
    expect(stand.shift.walkOffs).toBe(0);
    expect(DEMO_STEP).toBeGreaterThan(0);
    stand = advance(stand, 60_000, tapAt(10, 10), 200);
    expect(stand.shift.visitor).toBe(true);
    expect(stand.shift.served).toBe(0);
  });

  it('presses the button under a tap, and ignores taps elsewhere', () => {
    let stand = advance(newStand(0), 0, tapAt(10, 10), 200);
    stand = advance(stand, ARRIVE, tapAt(100, 40), 200);
    expect(stand.shift.pressed).toBeNull();
    stand = advance(stand, ARRIVE + 10, tapItem(COCOA), 200);
    expect(stand.shift.made).toEqual([COCOA]);
  });

  it('keeps the best tips, waits on the card before opening again, and returns to the show when left', () => {
    let stand = advance(newStand(0), 0, tapAt(10, 10), 200);
    stand.shift.tips = 12;
    stand.shift.walkOffs = STRIKES - 1;
    const out = stand.shift.customer.arrives + stand.shift.customer.patience;
    stand = advance(stand, out, undefined, 200);
    expect(stand.shift.ended).toBe(out);
    expect(stand.best).toBe(12);
    expect(stand.record).toBe(true);
    stand = advance(stand, out + CARD / 2, tapItem(COCOA), 200);
    expect(stand.shift.ended).toBe(out);
    stand = advance(stand, out + CARD, tapAt(10, 10), 200);
    expect(stand.shift.ended).toBeNull();
    expect(stand.record).toBe(false);
    stand.shift.walkOffs = STRIKES - 1;
    const again = stand.shift.customer.arrives + stand.shift.customer.patience;
    stand = advance(stand, again, undefined, 200);
    expect(stand.record).toBe(false);
    stand = advance(stand, again + IDLE + 1, undefined, 200);
    expect(stand.shift.visitor).toBe(false);
    expect(stand.best).toBe(12);
  });
});
