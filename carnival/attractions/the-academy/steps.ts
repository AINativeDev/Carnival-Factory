/**
 * The Academy's journey, as plain data: the visitor is a ticket, written on
 * the Your booth form and tapped through the factory's stations from
 * docs/how-it-works.md (the assessment, the implement loop, the checks, code
 * review with the shepherd, the auto-merge gate, the map), then the same loop
 * on any repository. Each step has one or more beats, and every beat waits
 * for a tap: nothing here moves on by itself.
 */

/** What a step draws on the board. */
export type StepKind =
  | 'start'
  | 'booth'
  | 'look'
  | 'ticket'
  | 'assess'
  | 'build'
  | 'checks'
  | 'review'
  | 'gate'
  | 'live'
  | 'repo';

/** One tap's worth of a step: its line, an optional small aside, and what the big button says. */
interface Beat {
  line: string;
  aside?: string;
  button: string;
}

/** One step of the journey. */
export interface Step {
  kind: StepKind;
  title: string;
  /** Which of the seven stations it is, 1 to 7, or 0 off the rail. */
  station: number;
  beats: readonly Beat[];
}

/** The silly booths a ticket may ask for. */
export const BOOTHS = ['Penguin DJ', 'Cocoa volcano', 'Snowball cannon'] as const;
/** The looks the Your booth form offers, three of them. */
export const LOOKS = ['Diorama', 'Pixel art', 'Papercut'] as const;
/** The seven stations' short names, for the rail along the board's top. */
export const STATIONS = ['Ask', 'Assess', 'Build', 'Check', 'Review', 'Gate', 'Map'] as const;

/** The auto-merge gate's seven checks, as docs/how-it-works.md names them. */
export const GATE_CHECKS = [
  'Request accepted',
  'Only your own folder',
  'Code stays in its square',
  'Nothing hidden in the text',
  'Checks pass',
  'Code review approves',
  'Risk and taste check',
] as const;

/** The gate's beats: none lit, then one more lamp a tap, then all seven and through. */
const gateBeats: readonly Beat[] = [
  { line: 'Seven checks. Tap to light each lamp.', button: 'Light a lamp' },
  ...GATE_CHECKS.slice(0, -1).map((check, n) => ({
    line: `${String(n + 1)}. ${check}`,
    button: 'Light a lamp',
  })),
  {
    line: 'All seven lit: it merges on its own!',
    aside: 'Any doubt, and a maintainer looks instead.',
    button: 'Roll through ▶',
  },
];

/** Every step, in order. */
export const STEPS: readonly Step[] = [
  {
    kind: 'start',
    title: 'The Academy',
    station: 0,
    beats: [{ line: 'You’re the ticket. Let’s make a booth!', button: 'Tap to start ▶' }],
  },
  {
    kind: 'booth',
    title: 'Write your ticket',
    station: 1,
    beats: [{ line: 'What should your booth show? Tap one!', button: 'Surprise me ▶' }],
  },
  {
    kind: 'look',
    title: 'Now pick a look',
    station: 1,
    beats: [{ line: 'The house diorama, or something bolder?', button: 'Surprise me ▶' }],
  },
  {
    kind: 'ticket',
    title: 'Hello, ticket!',
    station: 1,
    beats: [{ line: 'That’s you, labelled booth-request.', button: 'Send it in ▶' }],
  },
  {
    kind: 'assess',
    title: 'The assessment',
    station: 2,
    beats: [
      { line: 'An agent reads it first. Today, it’s an elf.', button: 'Stamp it!' },
      {
        line: 'Accepted! On goes the tessl label.',
        aside: 'It could also ask one question, or decline.',
        button: 'Next station ▶',
      },
    ],
  },
  {
    kind: 'build',
    title: 'The implement loop',
    station: 3,
    beats: [
      { line: 'An agent writes your booth’s code.', button: 'Build it!' },
      { line: 'On its own branch. Out pops a pull request!', button: 'Next station ▶' },
    ],
  },
  {
    kind: 'checks',
    title: 'The checks',
    station: 4,
    beats: [
      { line: 'Bugs! Tap all three to squash them.', button: 'Squash!' },
      { line: 'Splat! Two to go.', button: 'Squash!' },
      { line: 'Splat! One more.', button: 'Squash!' },
      {
        line: 'Lint, types, tests, size: all green.',
        aside: 'And a smoke test plays it in a real browser.',
        button: 'Next station ▶',
      },
    ],
  },
  {
    kind: 'review',
    title: 'Code review',
    station: 5,
    beats: [
      { line: 'Tessl Code Review reads it with lenses.', button: 'Review it!' },
      { line: 'One finding: a stray sock in the code!', button: 'Call the shepherd' },
      { line: 'The shepherd answers the finding. Clean!', button: 'Next station ▶' },
    ],
  },
  { kind: 'gate', title: 'The auto-merge gate', station: 6, beats: gateBeats },
  {
    kind: 'live',
    title: 'You’re on the map!',
    station: 7,
    beats: [{ line: 'Your {booth} booth is live.', button: 'Your repo ▶' }],
  },
  {
    kind: 'repo',
    title: 'Same loop, your repo',
    station: 0,
    beats: [
      {
        line: 'Issue in, reviewed pull request out.',
        aside: 'Each loop: an agent, a skill and the event that starts it.',
        button: 'Start over ↺',
      },
    ],
  },
];

/** Step `step`'s beat `beat`, falling back to the first step's. */
export function beatOf(step: number, beat: number): Beat {
  const beats = STEPS.at(step)?.beats ?? [];
  return beats.at(beat) ?? beats.at(0) ?? { line: '', button: '' };
}

/** `line` with the booth `booth` put in. */
export function withBooth(line: string, booth: number): string {
  return line.replace('{booth}', BOOTHS.at(booth) ?? BOOTHS[0]);
}
