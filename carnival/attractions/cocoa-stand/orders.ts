/**
 * What the elves at the Hot Cocoa Stand order: a cup of cocoa first, then
 * toppings in the order they ask for them, more of them as the shift goes on,
 * and less patience to wait for it. Plain functions, so the orders are tested
 * without drawing them.
 */

/** Everything that goes in a cup, by number: the cocoa, then the four toppings. */
export const ITEMS = ['Cocoa', 'Marshmallow', 'Cream', 'Cinnamon', 'Candy cane'] as const;
/** The cocoa, always first in the cup. */
export const COCOA = 0;

/** A steady pseudo-random number from 0 to 1 for `n`: the same every time, so orders vary but never change. */
export function wobble(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43_758.5453;
  return s - Math.floor(s);
}

/** How many toppings customer `n` of the shift asks for: one at first, up to all four. */
export function toppingsFor(n: number): number {
  return Math.min(4, 1 + Math.floor(n / 2));
}

/** Customer `n`'s order: cocoa, then their toppings in the order they want them. */
export function orderFor(n: number): number[] {
  const toppings = [1, 2, 3, 4]
    .map((item) => ({ item, key: wobble(n * 7 + item) }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
  return [COCOA, ...toppings.slice(0, toppingsFor(n))];
}

/** How long customer `n` waits for an order of `items`, in ms: shorter as the shift goes on. */
export function patienceFor(n: number, items: number): number {
  return (4_500 + items * 2_300) * Math.max(0.35, 1 - n * 0.035);
}

/** The tip for an order of `items` served with `left` of the customer's patience still to go (0 to 1). */
export function tipFor(items: number, left: number): number {
  return items * 2 + Math.round(Math.max(0, Math.min(1, left)) * 5);
}
