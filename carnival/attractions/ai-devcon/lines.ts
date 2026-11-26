/**
 * What the attendees ask. The good questions are about building software with
 * AI, the keynote's topic: pass them the mic. The others are fair questions
 * for another time, and the speaker shouldn't take them now. Short, so a
 * bubble reads at a glance.
 */
export const ON_TOPIC = [
  'How do agents run tests?',
  'Spec first, then code?',
  'What makes a good eval?',
  'How much context?',
  'Can a skill run a script?',
  'Who reviews agent PRs?',
  'How do you test prompts?',
  'When should agents ask?',
  'How do I write a skill?',
  'Evals in CI?',
  'What goes in a spec?',
  'How do agents plan?',
] as const;

/** Fair questions, but not for this keynote: leave them be. */
export const OFF_TOPIC = [
  "Where's the coffee?",
  'Is lunch vegan?',
  'Whose sleigh is outside?',
  'Wi-Fi password?',
  'Seen my scarf?',
  'Any mince pies left?',
  'Is it snowing out?',
  'Where are the coats?',
] as const;

/** The words of a question: a good one's, or another one's. */
export function lineOf(good: boolean, n: number): string {
  const lines = good ? ON_TOPIC : OFF_TOPIC;
  return lines.at(n % lines.length) ?? '';
}
