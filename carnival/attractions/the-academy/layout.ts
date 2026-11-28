/**
 * Where everything a visitor taps stands, in the square's 0 to 100 units,
 * and what is under a tap. The drawing and the rules both read these, so a
 * card or a button is always tapped where it is drawn. Three layers, top to
 * bottom, inside a margin of 4: a slim header (where you are), the hall's
 * scene, and a footer with Back, the one gold button and a quiet link; on
 * the "you're on the map" card the footer holds the ways on instead
 * (nudges.ts). Every tappable box is at least 9 tall, for a finger on a phone.
 */
import type { StepKind } from './steps';

/** A rectangle in the square's units. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The safe margin on every side. */
export const MARGIN = 4;
/** Where the footer begins: the scene stops above it. */
export const FOOTER = 79;
/** Where the "you're on the map" card's ways on begin, a taller footer. */
export const END_FOOTER = 64;

/** The scene, where a tap that hits nothing else goes on: the hall above the footer. */
export const SCENE: Box = { x: 0, y: 0, w: 100, h: FOOTER };
/** On the "you're on the map" card, the scene above its ways on. */
export const END_SCENE: Box = { x: 0, y: 0, w: 100, h: END_FOOTER };

/** Back a beat or a step: a secondary button, never shown where there is no back. */
export const BACK: Box = { x: MARGIN, y: 80.5, w: 21, h: 10 };
/** The gold button beside Back: whatever the step's next tap does. */
export const ACTION: Box = { x: 27, y: 80.5, w: 69, h: 10 };
/** On the first screen there is no Back, so the gold button stands in the middle. */
export const FIRST_ACTION: Box = { x: 22, y: 80.5, w: 56, h: 10 };
/** On the "you're on the map" card, a quiet link in the header's corner: on to your own repo. */
export const LIVE_NEXT: Box = { x: 70, y: 8.5, w: 26, h: 9 };

/** The gold button's box for a step of kind `kind`: in the middle when there is no Back. */
export const actionFor = (kind: StepKind): Box => (kind === 'start' ? FIRST_ACTION : ACTION);

/** Whether a step of kind `kind` has a Back. */
export const hasBack = (kind: StepKind): boolean => kind !== 'start' && kind !== 'live';

/** The three cards a ticket picks its booth or its look from, in the scene. */
export const CHOICES: readonly Box[] = [0, 1, 2].map((n) => ({
  x: MARGIN + n * 31,
  y: 28,
  w: 30,
  h: 40,
}));

/** Whether `x`, `y` is in `box`, edges included. */
export function inside(box: Box, x: number, y: number): boolean {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

/** Which choice card is at `x`, `y`, or -1 for none. */
export function choiceAt(x: number, y: number): number {
  return CHOICES.findIndex((card) => inside(card, x, y));
}
