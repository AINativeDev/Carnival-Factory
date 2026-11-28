/**
 * The words of the Factory's tour, one step at a time: why a software factory,
 * what a skill is, what a loop is, and how loops make a factory. Every fact
 * here comes from this repository's own factory: docs/how-it-works.md, the
 * loops in tessl.json and the skills in plugins/north-pole/skills/. Each step
 * keeps to a title and two short lines, so the scene does the explaining.
 */

/** One step of the tour: its title and the two short lines under it. */
export interface TourStep {
  title: string;
  lines: readonly [string, string];
}

/** The tour's steps, in order. */
export const TOUR_STEPS: readonly TourStep[] = [
  {
    title: 'Why a factory?',
    lines: [
      'One agent alone writes more than you can read.',
      'A factory splits work into small, checked steps.',
    ],
  },
  {
    title: 'Skills',
    lines: [
      'A skill is know-how written down for an agent.',
      'This factory has its own. Four of them:',
    ],
  },
  {
    title: 'Loops',
    lines: [
      'A loop wakes when something happens, runs',
      'an agent with a skill, and checks the result.',
    ],
  },
  {
    title: 'The factory',
    lines: [
      'Loops chained together, with gates between them.',
      'People steer it by writing the skills and specs.',
    ],
  },
];

/** This repository's own skills, as the tour shows them: its folder, what it does, and its gem's colour. */
export const SKILL_CARDS = [
  { folder: 'assess-booth-request', does: 'Accepts a request, asks once or declines' },
  { folder: 'review-house-rules', does: 'Looks for ways round the house rules' },
  { folder: 'assess-booth-risk', does: 'Is it low-risk enough to merge alone?' },
  { folder: 'review-craft', does: 'Tests first, clear names, docs kept true' },
] as const;

/** Three of the factory's loops from tessl.json: what wakes each, the loop and its skill, and what it does. */
export const LOOP_ROWS = [
  {
    when: 'An issue is opened',
    loop: 'Assessment',
    skill: 'assess-booth-request',
    then: 'Accepts, asks or declines',
  },
  {
    when: 'The tessl label is added',
    loop: 'Implement',
    skill: 'implement-github-issue',
    then: 'Opens a pull request',
  },
  {
    when: 'A review comment is left',
    loop: 'Shepherd',
    skill: 'shepherd',
    then: 'Fixes what it asks for',
  },
] as const;

/** The factory's chain, left to right: each loop or check a request passes, with a gate after each. */
export const CHAIN = ['ASSESS', 'BUILD', 'CHECKS', 'REVIEW', 'MERGE'] as const;
