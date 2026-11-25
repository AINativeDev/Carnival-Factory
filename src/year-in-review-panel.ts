/**
 * The visitors' answers on a Year in Review item's panel: under the question,
 * the accepted answers the build baked in, newest first, each with who gave it
 * (docs/specs/year-in-review.md). Every answer, question and login is a
 * visitor's own, so each one is set only as text, never as HTML. The link to
 * add yours is the level's own link out (northpole/north-pole-links.ts).
 */
import {
  ANSWER_ITEMS,
  OWN_QUESTIONS,
  YEAR_LEVEL,
  type YearInReview,
} from './northpole/year-in-review';
import { YEAR_ANSWERS } from './northpole/year-in-review-answers';

/** What an item with no answers yet says. */
export const NO_ANSWERS = 'No answers yet — be the first.';

/** A paragraph of `text`, set as text. */
function line(className: string, text: string) {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  return p;
}

/**
 * Puts the answers of `id`, one of the Year in Review's items, right after
 * `after`. Nothing for any other square, or any other level's.
 */
export function showYearAnswers(
  after: Element,
  id: string,
  level: string | undefined,
  answers: YearInReview = YEAR_ANSWERS,
) {
  if (level !== YEAR_LEVEL || !ANSWER_ITEMS.includes(id)) return;
  const own = id === OWN_QUESTIONS;
  const section = document.createElement('section');
  section.className = 'year-answers';
  const title = document.createElement('h3');
  title.className = 'visit-eyebrow';
  title.textContent = own ? 'Your questions, and your answers' : 'Your answers';
  section.append(title);
  const list = answers[id] ?? [];
  if (!list.length) section.append(line('year-answers-empty', NO_ANSWERS));
  else {
    const items = document.createElement('ol');
    items.className = 'year-answer-list';
    for (const { login, answer, question } of list) {
      const item = document.createElement('li');
      item.className = 'year-answer';
      if (question) item.append(line('year-answer-question', question));
      item.append(line('year-answer-text', answer), line('year-answer-by', `— @${login}`));
      items.append(item);
    }
    section.append(items);
  }
  after.after(section);
}
