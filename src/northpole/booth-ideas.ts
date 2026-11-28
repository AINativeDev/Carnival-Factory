/**
 * The Academy's pretend booths, as real booth requests: its game has the
 * visitor write a ticket, a booth and a look, and its "Ask for a booth" opens
 * the booth form already filled in with that idea, so their request starts
 * half written (ADR 0065). Each is a fixed address here, in maintainer code:
 * the game only picks one by number, and the page opens only the list's own.
 */
import { BOOTH_REQUEST_URL } from './links';
import type { OutboundLink } from './north-pole-links';

/** The Academy's three pretend booths, in its game's order: a name, and what the booth shows. */
const IDEAS = [
  {
    name: 'Penguin DJ',
    scene:
      'A penguin DJ in big headphones at a snowy deck, spinning records at dusk while a little crowd of penguins bobs along. Tap the deck and the crowd dances.',
  },
  {
    name: 'Cocoa volcano',
    scene:
      'A cocoa volcano that bubbles away and puffs marshmallows into the air every few seconds. Tap it and it erupts in a shower of marshmallows.',
  },
  {
    name: 'Snowball cannon',
    scene:
      'A snowball cannon on a little snow fort, with a row of wobbling snowmen across the way. Tap to fire, and keep score of the snowmen you topple.',
  },
] as const;

/** The game's three looks, in its order, as a line for the request. */
const LOOKS = [
  "In the North Pole's own diorama style.",
  'Drawn as pixel art.',
  'Drawn as papercut, like layers of cut paper.',
] as const;

/** The booth form filled in with `idea` in `look`: its title, what it shows, and its name. */
function ideaUrl(idea: (typeof IDEAS)[number], look: string): string {
  const fields = {
    title: `My booth: ${idea.name}`,
    what: `${idea.scene} ${look}\n\nStarted from my ticket in the Academy. `,
    name: idea.name,
  };
  const query = Object.entries(fields)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return `${BOOTH_REQUEST_URL}&${query}`;
}

/**
 * Every pretend booth in every look, booth by booth: the `n`th is booth
 * `Math.floor(n / 3)` in look `n % 3`. Kept out of the panel, which keeps its
 * one "Ask for a booth"; only the Academy's game asks for these.
 */
export const ACADEMY_IDEAS: readonly OutboundLink[] = IDEAS.flatMap((idea) =>
  LOOKS.map((look) => ({
    label: `Ask for a ${idea.name}`,
    href: ideaUrl(idea, look),
    panel: false,
  })),
);
