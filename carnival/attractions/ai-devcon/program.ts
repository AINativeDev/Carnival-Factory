/**
 * The keynote's running order: six short talks on building software with AI,
 * and the conference's own facts for the closing card. The talks are the
 * attraction's own examples of the topics, not the real programme, and name
 * nobody. The game moves the keynote on: every few good questions the next
 * speaker comes on, and a point of the talk appears on the slide with each.
 */

/** One talk: its slide title, the line under it, its three points and who gives it. */
export interface Talk {
  title: string;
  subtitle: string;
  points: readonly [string, string, string];
  speaker: string;
}

const FIRST: Talk = {
  title: 'Agents that ship',
  subtitle: 'Plan, act, check, repeat',
  points: ['Small steps, often', 'Run the tests every loop', 'A human merges'],
  speaker: 'an agent wrangler',
};

/** The keynote's talks, in order. */
export const TALKS: readonly Talk[] = [
  FIRST,
  {
    title: 'Specs before code',
    subtitle: 'Say what it should do first',
    points: ['Plain words, clear limits', 'Examples beat adjectives', 'Keep the spec true'],
    speaker: 'a spec writer',
  },
  {
    title: 'Skills for agents',
    subtitle: 'Teach a task once, reuse it',
    points: ['Short instructions', 'Scripts for fiddly bits', "Load only what's needed"],
    speaker: 'a skills builder',
  },
  {
    title: 'Evals, not vibes',
    subtitle: 'Measure what the model gets right',
    points: ['A fixed set of cases', 'Score every change', 'Catch regressions early'],
    speaker: 'an eval enthusiast',
  },
  {
    title: 'Context is the product',
    subtitle: 'The right docs at the right time',
    points: ['Less, but relevant', 'Docs agents can read', 'Fresh, never stale'],
    speaker: 'a context engineer',
  },
  {
    title: 'Tests keep agents honest',
    subtitle: 'Red, green, then merge',
    points: ['Write the test first', 'Agents run them too', 'CI has the last word'],
    speaker: 'a test gardener',
  },
];

/** The conference's own facts, as the site's settings give them (SETTINGS.aiDevcon), which a square may not import. */
export const EVENT = {
  title: 'AI DevCon',
  next: 'Next in London',
  when: '7–8 June 2027 · The Brewery',
  date: '7–8 June 2027',
  place: 'The Brewery',
  tickets: 'Get tickets ↗',
} as const;

/** Good questions answered in each talk before the next speaker comes on. */
export const PER_TALK = 5;
/** Good questions answered in the whole keynote: answer them all for a standing ovation. */
export const KEYNOTE = TALKS.length * PER_TALK;

/** Talk `n`, or the first talk for a number past the end. */
export function talkOf(n: number): Talk {
  return TALKS.at(n) ?? FIRST;
}

/** Which talk is on after `answered` good questions: the last one stays up at the end. */
export const talkAfter = (answered: number) =>
  Math.min(TALKS.length - 1, Math.floor(answered / PER_TALK));

/** How many of the talk's points are on its slide after `answered` good questions. */
export function pointsShown(answered: number): number {
  if (answered >= KEYNOTE) return 3;
  return Math.min(3, answered % PER_TALK);
}
