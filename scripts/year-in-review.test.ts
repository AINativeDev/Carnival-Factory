import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  OWN_QUESTION_OPTION,
  OWN_QUESTIONS,
  YEAR_QUESTIONS,
} from '../src/northpole/year-in-review.ts';
import {
  acceptedAnswer,
  itemOf,
  YEAR_FIELDS,
  yearInReview,
  type RawYearIssue,
} from './year-in-review.ts';

describe('the Year in review issue form', () => {
  const form = readFileSync(
    new URL('../.github/ISSUE_TEMPLATE/07-year-in-review.yml', import.meta.url),
    'utf8',
  );

  it('labels its issues year-in-review, and names its fields as the script reads them', () => {
    expect(form).toContain('labels: [year-in-review]');
    for (const label of Object.values(YEAR_FIELDS)) expect(form).toContain(`label: ${label}\n`);
  });

  it('offers every question word for word, then your own', () => {
    const options = [...form.matchAll(/^ {8}- "?(.*?)"?$/gm)].map((match) => match[1]);
    expect(options).toEqual([...YEAR_QUESTIONS.map(({ text }) => text), OWN_QUESTION_OPTION]);
  });
});

const body = (question: string, answer?: string, own?: string) =>
  [
    `### Which question?\n\n${question}`,
    `### Your own question\n\n${own ?? '_No response_'}`,
    answer === undefined ? '' : `### Your answer\n\n${answer}`,
  ].join('\n\n');

const HOT_TAKE = "One hot take you'd bet on?";

/** An accepted issue answering the hot take, accepted a day after it was written. */
const issue = (change: Partial<RawYearIssue> = {}): RawYearIssue => ({
  number: 1,
  createdAt: '2026-11-20T10:00:00Z',
  lastEditedAt: null,
  body: body(HOT_TAKE, 'Tests will write themselves.'),
  author: { login: 'Elf-One' },
  labels: { nodes: [{ name: 'year-in-review' }, { name: 'year-in-review-accepted' }] },
  timelineItems: {
    nodes: [
      null,
      { createdAt: '2026-11-20T10:00:00Z', label: { name: 'year-in-review' } },
      { createdAt: '2026-11-21T10:00:00Z', label: { name: 'year-in-review-accepted' } },
    ],
  },
  ...change,
});

describe('itemOf', () => {
  it("finds a question's item by its words, and the guestbook for your own", () => {
    for (const question of YEAR_QUESTIONS) expect(itemOf(` ${question.text} `)).toBe(question.id);
    expect(itemOf('My own question')).toBe(OWN_QUESTIONS);
    expect(itemOf('Something else?')).toBeUndefined();
    expect(itemOf(undefined)).toBeUndefined();
  });
});

describe('acceptedAnswer', () => {
  it('reads an accepted answer, with who wrote it and when', () => {
    expect(acceptedAnswer(issue())).toEqual({
      item: 'hot-take',
      answer: {
        login: 'Elf-One',
        answer: 'Tests will write themselves.',
        at: '2026-11-20T10:00:00Z',
      },
    });
  });

  it('reads your own question with its answer, and none without the question', () => {
    const own = issue({ body: body('My own question', 'Yes.', 'Cocoa or tea?') });
    expect(acceptedAnswer(own)?.answer.question).toBe('Cocoa or tea?');
    expect(acceptedAnswer(own)?.item).toBe(OWN_QUESTIONS);
    expect(acceptedAnswer(issue({ body: body('My own question', 'Yes.') }))).toBeUndefined();
  });

  it('takes nothing not accepted, declined, or edited since it was accepted', () => {
    expect(
      acceptedAnswer(issue({ labels: { nodes: [{ name: 'year-in-review' }] } })),
    ).toBeUndefined();
    const declined = { nodes: [{ name: 'year-in-review-accepted' }, { name: 'declined' }] };
    expect(acceptedAnswer(issue({ labels: declined }))).toBeUndefined();
    expect(acceptedAnswer(issue({ lastEditedAt: '2026-11-22T00:00:00Z' }))).toBeUndefined();
    expect(acceptedAnswer(issue({ lastEditedAt: '2026-11-20T11:00:00Z' }))).toBeDefined();
    expect(acceptedAnswer(issue({ lastEditedAt: 'garbled' }))).toBeUndefined();
    expect(acceptedAnswer(issue({ timelineItems: { nodes: [] } }))).toBeUndefined();
    const undated = { nodes: [{ label: { name: 'year-in-review-accepted' } }] };
    expect(acceptedAnswer(issue({ timelineItems: undated }))).toBeUndefined();
  });

  it('takes nothing without an answer, a known question or an author', () => {
    expect(acceptedAnswer(issue({ body: body(HOT_TAKE) }))).toBeUndefined();
    expect(acceptedAnswer(issue({ body: body('Anything?', 'Yes.') }))).toBeUndefined();
    expect(acceptedAnswer(issue({ body: null }))).toBeUndefined();
    expect(acceptedAnswer(issue({ author: null }))).toBeUndefined();
  });
});

describe('yearInReview', () => {
  it('keys the accepted answers by item, newest first, cleaned as the page cleans them', () => {
    const older = issue({ number: 2, createdAt: '2026-11-19T00:00:00Z' });
    const hostile = issue({
      number: 3,
      createdAt: '2026-11-21T00:00:00Z',
      body: body(HOT_TAKE, `<script>alert(1)</script> @everyone\u200B ${'a'.repeat(400)}`),
    });
    const result = yearInReview([older, issue(), hostile, issue({ labels: { nodes: [] } })]);
    const answers = result['hot-take'] ?? [];
    expect(answers.map(({ at }) => at)).toEqual([
      '2026-11-21T00:00:00Z',
      '2026-11-20T10:00:00Z',
      '2026-11-19T00:00:00Z',
    ]);
    expect(answers[0]?.answer.startsWith('<script>alert(1)</script> @everyone a')).toBe(true);
    expect(Array.from(answers[0]?.answer ?? '')).toHaveLength(280);
    expect(Object.keys(result)).toEqual(['hot-take']);
  });
});
