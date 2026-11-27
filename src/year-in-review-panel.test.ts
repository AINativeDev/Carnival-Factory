// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { OWN_QUESTIONS, type YearInReview } from './northpole/year-in-review';
import { NO_ANSWERS, showYearAnswers } from './year-in-review-panel';

/** A panel's description, in a fresh page, for the answers to follow. */
function description() {
  document.body.innerHTML = '<section><p class="visit-description"></p></section>';
  const found = document.querySelector('.visit-description');
  if (!found) throw new Error('no description');
  return found;
}

const texts = (selector: string) =>
  [...document.querySelectorAll(selector)].map((element) => element.textContent);

const ANSWERS: YearInReview = {
  'hot-take': [
    { login: 'elf-two', answer: 'Newest first.', at: '2026-11-21T00:00:00Z' },
    { login: 'elf-one', answer: 'Then the older one.', at: '2026-11-20T00:00:00Z' },
  ],
  [OWN_QUESTIONS]: [
    { login: 'elf-one', answer: 'Marshmallows.', at: '2026-11-20T00:00:00Z', question: 'Cocoa?' },
  ],
};

describe('showYearAnswers', () => {
  it("shows a question's answers after its description, newest first, each with who gave it", () => {
    showYearAnswers(description(), 'hot-take', 'the-year-in-review', ANSWERS);
    expect(document.querySelector('.visit-description')?.nextElementSibling?.className).toBe(
      'year-answers',
    );
    expect(texts('.year-answers h3')).toEqual(['Your answers']);
    expect(texts('.year-answer-text')).toEqual(['Newest first.', 'Then the older one.']);
    expect(texts('.year-answer-by')).toEqual(['— @elf-two', '— @elf-one']);
    expect(texts('.year-answer-question')).toEqual([]);
  });

  it("shows visitors' own questions in the guestbook, with their answers", () => {
    showYearAnswers(description(), OWN_QUESTIONS, 'the-year-in-review', ANSWERS);
    expect(texts('.year-answers h3')).toEqual(['Your questions, and your answers']);
    expect(texts('.year-answer-question')).toEqual(['Cocoa?']);
    expect(texts('.year-answer-text')).toEqual(['Marshmallows.']);
  });

  it('asks for the first answer when there is none yet', () => {
    showYearAnswers(description(), 'finally-fixed', 'the-year-in-review', ANSWERS);
    expect(texts('.year-answers-empty')).toEqual([NO_ANSWERS]);
    expect(document.querySelectorAll('.year-answer')).toHaveLength(0);
    showYearAnswers(description(), 'finally-fixed', 'the-year-in-review');
    expect(texts('.year-answers-empty')).toEqual([NO_ANSWERS]);
  });

  it('shows markup and mentions as the plain text they are', () => {
    const hostile = '<img src=x onerror="alert(1)"> @everyone';
    showYearAnswers(description(), 'hot-take', 'the-year-in-review', {
      'hot-take': [{ login: 'elf', answer: hostile, at: '2026-11-20T00:00:00Z' }],
    });
    expect(texts('.year-answer-text')).toEqual([hostile]);
    expect(document.querySelectorAll('.year-answers img')).toHaveLength(0);
  });

  it('adds nothing to any other square or level', () => {
    showYearAnswers(description(), 'camera', 'the-studio', ANSWERS);
    showYearAnswers(description(), 'hot-take', undefined, ANSWERS);
    showYearAnswers(description(), 'guest-sofa', 'the-year-in-review', ANSWERS);
    expect(document.querySelectorAll('.year-answers')).toHaveLength(0);
  });

  it('marks up each answer as one quiet list, after the description', () => {
    showYearAnswers(description(), OWN_QUESTIONS, 'the-year-in-review', ANSWERS);
    showYearAnswers(description(), 'finally-fixed', 'the-year-in-review', ANSWERS);
    expect(document.body.innerHTML).toBe(
      '<section><p class="visit-description"></p><section class="year-answers">' +
        '<h3 class="visit-eyebrow">Your answers</h3>' +
        `<p class="year-answers-empty">${NO_ANSWERS}</p></section></section>`,
    );
    showYearAnswers(description(), OWN_QUESTIONS, 'the-year-in-review', ANSWERS);
    expect(document.querySelector('.year-answers')?.outerHTML).toBe(
      '<section class="year-answers"><h3 class="visit-eyebrow">Your questions, and your answers</h3>' +
        '<ol class="year-answer-list"><li class="year-answer">' +
        '<p class="year-answer-question">Cocoa?</p><p class="year-answer-text">Marshmallows.</p>' +
        '<p class="year-answer-by">— @elf-one</p></li></ol></section>',
    );
  });
});
