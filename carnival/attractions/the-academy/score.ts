/**
 * The quiz's scoring: points for a right answer, more the faster it came,
 * multiplied by the streak of right answers in a row, and the grade on the
 * report card for how many were right first time.
 */

/** The most a streak multiplies a right answer's points by. */
export const MAX_MULTIPLIER = 4;

/** What a right answer's points are multiplied by, `streak` right in a row counting this one. */
export function multiplierOf(streak: number): number {
  return Math.min(Math.max(Math.floor(streak), 1), MAX_MULTIPLIER);
}

/**
 * The points for a right answer with `left` of the timer still to run, from
 * 1 down to 0: 100, and up to 100 more for speed, rounded to tens, times the
 * streak's multiplier.
 */
export function pointsFor(left: number, streak: number): number {
  const speed = Math.min(Math.max(left, 0), 1) * 100;
  return Math.round((100 + speed) / 10) * 10 * multiplierOf(streak);
}

/** A score with its thousands grouped, the same in every worker: 12,340. */
export function scoreText(score: number): string {
  return String(Math.max(Math.round(score), 0)).replace(/\B(?=(\d{3})+$)/g, ',');
}

/** The report card's grade for `firsts` of `asked` questions right first time. */
export function gradeOf(firsts: number, asked: number): { letter: string; words: string } {
  const share = asked > 0 ? firsts / asked : 0;
  if (share >= 1) return { letter: 'A+', words: 'Top of the class!' };
  if (share >= 0.8) return { letter: 'A', words: 'Excellent work!' };
  if (share >= 0.6) return { letter: 'B', words: 'Good going!' };
  if (share >= 0.4) return { letter: 'C', words: 'Getting there!' };
  return { letter: 'D', words: 'Every expert started here!' };
}
