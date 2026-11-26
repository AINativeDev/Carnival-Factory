/**
 * The pop quiz's questions: building software with AI agents, skills, specs
 * and tests, each with three short answers, the right one, a hint for a
 * wrong pick and a line on why the right one is right. Kept short so each
 * fits the chalkboard and an answer card in big letters.
 */

/** One question on the board. */
export interface Question {
  ask: string;
  answers: readonly [string, string, string];
  /** Which of the three answers is right. */
  right: 0 | 1 | 2;
  /** Chalked on the board after a wrong pick, nudging without telling. */
  hint: string;
  /** Chalked on the board after the right pick. */
  why: string;
}

/** Questions in one round, before the report card. */
export const ROUND = 5;

/** The bank of questions, asked ROUND at a time in this order, wrapping round. */
export const QUESTIONS: readonly Question[] = [
  {
    ask: 'What helps an agent build what you meant?',
    answers: ['Good vibes', 'A clear spec', 'More coffee'],
    right: 1,
    hint: 'Agents can’t read minds. Write it down!',
    why: 'A spec says what “done” looks like.',
  },
  {
    ask: 'How do you know the agent’s code works?',
    answers: ['It sounds sure', 'It compiled once', 'The tests pass'],
    right: 2,
    hint: 'Sounding sure isn’t proof. What can check it?',
    why: 'Tests check it, every single time.',
  },
  {
    ask: 'What is a skill, for an agent?',
    answers: ['Know-how it loads as needed', 'A high score', 'A faster laptop'],
    right: 0,
    hint: 'Think of a recipe card it picks up.',
    why: 'Instructions it reaches for on the job.',
  },
  {
    ask: 'The agent got it wrong. Best next step?',
    answers: ['Shout at it', 'Start over and hope', 'Fix the spec or add a test'],
    right: 2,
    hint: 'Teach it once, so the lesson sticks.',
    why: 'Next time it gets it right first time.',
  },
  {
    ask: 'Why ask an agent for small changes?',
    answers: ['Easy to review and undo', 'Big ones are faster', 'Nobody reads them'],
    right: 0,
    hint: 'Who has to check the work?',
    why: 'Small steps are easy to check.',
  },
  {
    ask: 'Where should an agent’s house rules live?',
    answers: ['In your head', 'In the repo, by the code', 'On a sticky note'],
    right: 1,
    hint: 'Somewhere the agent can read them.',
    why: 'Written down, where every agent finds them.',
  },
  {
    ask: 'What does the human still do?',
    answers: ['Nothing at all', 'Type every line', 'Steer and review'],
    right: 2,
    hint: 'Agents build. Who says what’s good?',
    why: 'You steer; the agent builds.',
  },
  {
    ask: 'What makes a good task for an agent?',
    answers: ['A goal and context', 'One word', 'ALL CAPS'],
    right: 0,
    hint: 'What would a new teammate need?',
    why: 'The why and the what, up front.',
  },
];

/** The questions of round `round`: the next ROUND from the bank, wrapping, so each round asks new ones. */
export function roundOf(round: number): Question[] {
  const total = QUESTIONS.length;
  const start = (((round * ROUND) % total) + total) % total;
  return [...QUESTIONS.slice(start), ...QUESTIONS.slice(0, start)].slice(0, ROUND);
}
