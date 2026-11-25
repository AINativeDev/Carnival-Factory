/**
 * The Year in Review: the North Pole's gallery room, where each of its
 * questions about the year is an item to discover, and visitors' answers hang
 * beside it (docs/specs/year-in-review.md, ADR 0047). Visitors answer on an
 * issue form; a maintainer's skill accepts the fitting ones, and the deploy
 * bakes them into the page (scripts/year-in-review.ts). This file holds the
 * questions every side shares, and cleans what the build baked in, because
 * every answer is a visitor's own words: plain text, capped, nothing hidden.
 */

/** The North Pole's level the questions hang in, and the attraction that is its landmark. */
export const YEAR_LEVEL = 'the-year-in-review';

/** The item where visitors' own questions hang, with their answers: the guestbook. */
export const OWN_QUESTIONS = 'your-questions';

/** The form's choice for a question of your own, as its dropdown says it. */
export const OWN_QUESTION_OPTION = 'My own question';

/** The longest answer and the longest question of a visitor's own, in characters. */
export const MAX_ANSWER = 280;
export const MAX_QUESTION = 140;

/** The most answers one item shows: the newest. */
const MAX_PER_ITEM = 100;

/** Which half of the room a question hangs in. */
type YearHalf = 'back' | 'ahead';

/** One question: its item's id, its short title on the item, and its words exactly as asked. */
export interface YearQuestion {
  id: string;
  title: string;
  text: string;
  half: YearHalf;
}

/** The questions, in the order the room and the form ask them. */
export const YEAR_QUESTIONS: readonly YearQuestion[] = [
  {
    id: 'dumbest-ai-moment',
    title: 'Dumbest AI moment',
    text: "What's the dumbest thing an AI confidently told you this year?",
    half: 'back',
  },
  {
    id: 'coding-disaster',
    title: 'Worst coding disaster',
    text: 'Worst AI coding disaster you lived through?',
    half: 'back',
  },
  {
    id: 'felt-like-magic',
    title: 'When it felt like magic',
    text: 'When did it actually feel like magic?',
    half: 'back',
  },
  {
    id: 'stopped-doing',
    title: 'What I stopped doing',
    text: "What's something you just stopped doing because AI does it now?",
    half: 'back',
  },
  {
    id: 'vibe-code-regret',
    title: 'Vibe code regret',
    text: 'What did you vibe code that you regret?',
    half: 'back',
  },
  {
    id: 'most-overrated',
    title: 'Most overrated',
    text: 'Which hyped thing turned out to be overrated?',
    half: 'back',
  },
  {
    id: 'hands-off',
    title: 'Hands off, AI',
    text: 'What do you still refuse to let AI touch?',
    half: 'back',
  },
  {
    id: 'my-day-in-27',
    title: "My day in '27",
    text: 'What will your day look like a year from now?',
    half: 'ahead',
  },
  {
    id: 'finally-fixed',
    title: 'Finally fixed',
    text: "What's the thing that finally gets fixed?",
    half: 'ahead',
  },
  {
    id: 'worse-before-better',
    title: 'Worse before better',
    text: 'What gets worse before it gets better?',
    half: 'ahead',
  },
  {
    id: 'still-reviewing',
    title: 'Still reviewing code?',
    text: 'Will we still be reviewing every line of code?',
    half: 'ahead',
  },
  {
    id: 'buzzword-dies',
    title: 'The buzzword that dies',
    text: 'What buzzword dies next year?',
    half: 'ahead',
  },
  { id: 'hot-take', title: 'Hot take', text: "One hot take you'd bet on?", half: 'ahead' },
];

/** One accepted answer: who gave it, when, what they said, and their own question when it's one. */
export interface YearAnswer {
  login: string;
  answer: string;
  /** An ISO date: when the answer was written. */
  at: string;
  question?: string;
}

/** The accepted answers by item: a question's id, or `OWN_QUESTIONS`. Newest first. */
export type YearInReview = Partial<Record<string, YearAnswer[]>>;

/** Every item that can hold answers, in the room's order. */
export const ANSWER_ITEMS: readonly string[] = [
  ...YEAR_QUESTIONS.map(({ id }) => id),
  OWN_QUESTIONS,
];

/** A GitHub login as GitHub writes it, in any case. */
const LOGIN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i;

/**
 * A visitor's words as plain text on one line: control characters become
 * spaces, invisible and text-direction characters (Unicode's format
 * characters) go, and it's capped at `max` characters with an ellipsis.
 * Undefined when nothing is left.
 */
export function plainText(text: unknown, max: number): string | undefined {
  if (typeof text !== 'string') return undefined;
  const words = text
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\p{Cf}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  const chars = Array.from(words);
  if (!chars.length) return undefined;
  return chars.length > max
    ? `${chars
        .slice(0, max - 1)
        .join('')
        .trimEnd()}…`
    : words;
}

/** One baked answer, cleaned, or undefined when it isn't one. Only the guestbook's carry a question. */
function cleanAnswer(item: unknown, own: boolean): YearAnswer | undefined {
  if (!item || typeof item !== 'object') return undefined;
  const { login, answer, at, question } = item as Record<string, unknown>;
  if (typeof login !== 'string' || !LOGIN.test(login)) return undefined;
  const words = plainText(answer, MAX_ANSWER);
  if (!words || typeof at !== 'string' || at.length > 40 || Number.isNaN(Date.parse(at)))
    return undefined;
  if (!own) return { login, answer: words, at };
  const asked = plainText(question, MAX_QUESTION);
  return asked ? { login, answer: words, at, question: asked } : undefined;
}

/**
 * The answers the build baked in, as the page may show them: only the room's
 * items, each a list of clean answers, newest first, at most a hundred.
 * Anything else in the data is dropped.
 */
export function cleanYearInReview(data: unknown): YearInReview {
  const clean: YearInReview = {};
  if (!data || typeof data !== 'object') return clean;
  for (const id of ANSWER_ITEMS) {
    const list: unknown = Object.hasOwn(data, id) ? (data as Record<string, unknown>)[id] : [];
    if (!Array.isArray(list)) continue;
    const answers = list
      .map((item: unknown) => cleanAnswer(item, id === OWN_QUESTIONS))
      .filter((answer) => answer !== undefined)
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, MAX_PER_ITEM);
    if (answers.length) clean[id] = answers;
  }
  return clean;
}
