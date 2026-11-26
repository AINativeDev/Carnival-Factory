/**
 * The Year in Review's answers from its issues (docs/specs/year-in-review.md,
 * ADR 0047): each visitor answers one of the room's questions, or asks and
 * answers their own, on the **Year in review** form. The
 * `welcome-year-in-review` skill adds `year-in-review-accepted` to a fitting
 * one, and the deploy reads those (scripts/write-year-in-review.ts) and bakes
 * them into the page. Plain functions: every field is a visitor's own words,
 * so each one is cleaned here as the page cleans it.
 */
import { formField } from './issue-form.ts';
import {
  cleanYearInReview,
  OWN_QUESTION_OPTION,
  OWN_QUESTIONS,
  YEAR_QUESTIONS,
  type YearAnswer,
  type YearInReview,
} from '../src/northpole/year-in-review.ts';

/** The label a maintainer's skill adds to a fitting answer, and the one it adds to a declined one. */
export const ACCEPTED_LABEL = 'year-in-review-accepted';
const DECLINED_LABEL = 'declined';

/** The form's fields, by the headings GitHub writes them under (.github/issue-templates-later/07-year-in-review.yml while its flag is off). */
export const YEAR_FIELDS = {
  question: 'Which question?',
  own: 'Your own question',
  answer: 'Your answer',
} as const;

/** An issue as the GraphQL API gives it: its form's body, who wrote it, its labels and when they were added. */
export interface RawYearIssue {
  number: number;
  createdAt: string;
  /** When its author last edited it, if ever. */
  lastEditedAt?: string | null;
  body?: string | null;
  author?: { login: string } | null;
  labels: { nodes: { name: string }[] };
  timelineItems: { nodes: ({ createdAt?: string; label?: { name: string } } | null)[] };
}

/** When the issue was last accepted: the latest time `ACCEPTED_LABEL` was added to it. */
function acceptedAt(issue: RawYearIssue): number | undefined {
  const times = issue.timelineItems.nodes
    .filter((event) => event?.label?.name === ACCEPTED_LABEL)
    .map((event) => Date.parse(event?.createdAt ?? ''))
    .filter((time) => !Number.isNaN(time));
  return times.length ? Math.max(...times) : undefined;
}

/** Which item a form's chosen question belongs to: one of the room's, the guestbook, or none. */
export function itemOf(chosen: string | undefined): string | undefined {
  const text = chosen?.trim();
  if (text === OWN_QUESTION_OPTION) return OWN_QUESTIONS;
  return YEAR_QUESTIONS.find((question) => question.text === text)?.id;
}

/**
 * The answer an accepted issue gives, and the item it hangs on, or undefined
 * when it gives none: not accepted, declined, edited since it was accepted
 * (so a maintainer accepts it again), or without its answer or its question.
 * The words are cleaned later, with every other answer.
 */
export function acceptedAnswer(
  issue: RawYearIssue,
): { item: string; answer: YearAnswer } | undefined {
  const labels = issue.labels.nodes.map(({ name }) => name);
  if (!labels.includes(ACCEPTED_LABEL) || labels.includes(DECLINED_LABEL)) return undefined;
  const accepted = acceptedAt(issue);
  const edited = issue.lastEditedAt ? Date.parse(issue.lastEditedAt) : undefined;
  if (accepted === undefined || (edited !== undefined && !(edited <= accepted))) return undefined;
  const body = issue.body ?? '';
  const item = itemOf(formField(body, YEAR_FIELDS.question));
  const words = formField(body, YEAR_FIELDS.answer);
  const login = issue.author?.login;
  if (!item || !words || !login) return undefined;
  const answer: YearAnswer = { login, answer: words, at: issue.createdAt };
  if (item !== OWN_QUESTIONS) return { item, answer };
  const question = formField(body, YEAR_FIELDS.own);
  return question ? { item, answer: { ...answer, question } } : undefined;
}

/** Every accepted answer by item, cleaned as the page cleans it: newest first, plain text, capped. */
export function yearInReview(issues: readonly RawYearIssue[]): YearInReview {
  const byItem: Record<string, YearAnswer[]> = {};
  for (const issue of issues) {
    const found = acceptedAnswer(issue);
    if (found) byItem[found.item] = [...(byItem[found.item] ?? []), found.answer];
  }
  return cleanYearInReview(byItem);
}
