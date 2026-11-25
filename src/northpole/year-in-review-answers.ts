import { cleanYearInReview, type YearInReview } from './year-in-review';

declare const __YEAR_IN_REVIEW__: unknown;

/**
 * The Year in Review's accepted answers as the deploy found them, baked into
 * the page by the build (scripts/build-data.ts): the page never asks GitHub.
 * A preview or a local build has none.
 */
export const YEAR_ANSWERS: YearInReview = cleanYearInReview(
  typeof __YEAR_IN_REVIEW__ === 'undefined' ? undefined : __YEAR_IN_REVIEW__,
);
