/**
 * Every button the Factory draws, where it stands in the drawing's 0 to 100
 * units and what a tap on it chooses: going on through the tour, skipping to
 * the game, one of the Factory's links out, a visit to the Academy, playing
 * again. The page opens a link or a visit only when `ask()` passes it on, and
 * the Factory's links are numbered as its panel lists them: 0 Sign up for
 * Tessl, 1 Ask for a booth, 2 AI DevCon tickets, 3 the blog, 4 the podcast.
 * Every box is at least 9 tall, big enough for a finger on a phone.
 */
import { type Box, inBox } from './rules';

/** What a tap on a button chooses. */
export type Choice =
  | { kind: 'open'; link: number }
  | { kind: 'visit' }
  | { kind: 'next' }
  | { kind: 'skip' }
  | { kind: 'again' }
  | { kind: 'tour' };

/** A button: where it is, what it says, and what a tap on it chooses. */
export interface Button {
  box: Box;
  label: string;
  choice: Choice;
}

/** The Factory's links out, by their number on its panel. */
const LINK = { signUp: 0, booth: 1, devcon: 2, blog: 3, podcast: 4 } as const;

/** Where the tour's one primary stands, bottom right. */
const TOUR_PRIMARY: Box = { x: 60, y: 87.5, w: 36, h: 9 };

/** The tour's primary on every step but the last: on a step. */
export const NEXT: Button = { box: TOUR_PRIMARY, label: 'Next ▶', choice: { kind: 'next' } };

/** The tour's primary on its last step: into the game. */
export const PLAY: Button = {
  box: TOUR_PRIMARY,
  label: 'Feed the loop ▶',
  choice: { kind: 'skip' },
};

/** The tour's quiet "Skip to the game", top right on every step but the last. */
export const SKIP: Button = {
  box: { x: 64, y: 3.5, w: 32, h: 9 },
  label: 'Skip to the game ▶',
  choice: { kind: 'skip' },
};

/** The buttons on the tour's `step` of `steps`: Skip and Next, or on the last, the way into the game. */
export const tourButtons = (step: number, steps: number): readonly Button[] =>
  step >= steps - 1 ? [PLAY] : [SKIP, NEXT];

/** The one quiet link while the game runs, under the scoreboard. */
export const SIGN_UP_CORNER: Button = {
  box: { x: 66, y: 25, w: 30, h: 9 },
  label: 'Sign up for Tessl ↗',
  choice: { kind: 'open', link: LINK.signUp },
};

/** Every button over the game while it runs. */
export const PLAY_BUTTONS: readonly Button[] = [SIGN_UP_CORNER];

/** The end card's hero: ask for a booth of your own. */
export const END_HERO: Button = {
  box: { x: 14, y: 31, w: 72, h: 13 },
  label: 'Ask for a booth ↗',
  choice: { kind: 'open', link: LINK.booth },
};

/** The end card's two secondaries, side by side: the Academy, and signing up. */
export const END_MORE: readonly [Button, Button] = [
  {
    box: { x: 7, y: 48.5, w: 42.5, h: 10 },
    label: 'Learn how in the Academy →',
    choice: { kind: 'visit' },
  },
  {
    box: { x: 50.5, y: 48.5, w: 42.5, h: 10 },
    label: 'Sign up for Tessl ↗',
    choice: { kind: 'open', link: LINK.signUp },
  },
];

/** The end card's quiet row to go round again: play again, or watch the tour. */
export const END_AGAIN: readonly [Button, Button] = [
  { box: { x: 18, y: 62, w: 30, h: 9 }, label: 'Play again ▶', choice: { kind: 'again' } },
  { box: { x: 52, y: 62, w: 30, h: 9 }, label: 'Watch the tour ▶', choice: { kind: 'tour' } },
];

/** The end card's last, quietest line: keep in touch. */
export const END_KEEP: readonly Button[] = [
  {
    box: { x: 35, y: 74, w: 20, h: 9 },
    label: 'AI DevCon ↗',
    choice: { kind: 'open', link: LINK.devcon },
  },
  {
    box: { x: 57, y: 74, w: 13, h: 9 },
    label: 'Blog ↗',
    choice: { kind: 'open', link: LINK.blog },
  },
  {
    box: { x: 72, y: 74, w: 18, h: 9 },
    label: 'Podcast ↗',
    choice: { kind: 'open', link: LINK.podcast },
  },
];

/** Every button on the end card. */
export const END_BUTTONS: readonly Button[] = [END_HERO, ...END_MORE, ...END_AGAIN, ...END_KEEP];

/** What a tap at `x`, `y` chooses among `buttons`, or undefined when it misses them all. */
export function choiceAt(buttons: readonly Button[], x: number, y: number): Choice | undefined {
  return buttons.find((button) => inBox(button.box, x, y))?.choice;
}
