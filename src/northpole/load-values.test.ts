import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REPO_URL } from '../settings';
import type { NorthPoleSquare } from './square';

/**
 * The values these modules set as they load: the Year in Review's questions,
 * the forms' addresses, the stages' words and the like. Each test loads its
 * module afresh, because mutation testing changes a value set as a module
 * loads only while a test is loading it (docs/adr/0061-mutation-testing.md).
 */
const root = join(import.meta.dirname, '../..');
const squares = import.meta.glob<{ default: NorthPoleSquare }>(
  '../../carnival/levels/the-year-in-review/squares/*/square.ts',
  { eager: true },
);

beforeEach(() => {
  vi.resetModules();
});

describe("the Year in Review's questions, as they load", () => {
  it('names its level, its guestbook and the form’s choice for a question of your own', async () => {
    const year = await import('./year-in-review');
    expect(year.YEAR_LEVEL).toBe('the-year-in-review');
    expect(year.OWN_QUESTIONS).toBe('your-questions');
    expect(year.OWN_QUESTION_OPTION).toBe('My own question');
  });

  it('asks each question as its item in the room asks it, seven back and then six ahead', async () => {
    const { YEAR_QUESTIONS } = await import('./year-in-review');
    const asked = Object.values(squares)
      .map(({ default: square }) => square)
      .filter((square) => square.id !== 'your-questions');
    const byId = new Map(asked.map((square) => [square.id, square] as const));
    expect(YEAR_QUESTIONS).toHaveLength(asked.length);
    for (const { id, title, text } of YEAR_QUESTIONS) {
      expect(title, id).toBe(byId.get(id)?.name);
      expect(text, id).toBe(byId.get(id)?.description);
    }
    expect(YEAR_QUESTIONS.map(({ half }) => half)).toEqual([
      ...Array<string>(7).fill('back'),
      ...Array<string>(6).fill('ahead'),
    ]);
  });
});

describe("the forms' addresses, as they load", () => {
  it('opens each issue form by its own file, waiting or live', async () => {
    const links = await import('./links');
    const forms = {
      '01-your-booth.yml': links.BOOTH_REQUEST_URL,
      '02-your-level.yml': links.LEVEL_REQUEST_URL,
      '03-elf-engineer.yml': links.BADGE_REQUEST_URL,
      '04-advent-challenge.yml': links.ADVENT_REQUEST_URL,
      '05-feedback.yml': links.FEEDBACK_URL,
      '07-year-in-review.yml': links.YEAR_IN_REVIEW_URL,
    };
    for (const [file, url] of Object.entries(forms)) {
      expect(url).toBe(`${REPO_URL}/issues/new?template=${file}`);
      const live = existsSync(join(root, '.github/ISSUE_TEMPLATE', file));
      expect(live || existsSync(join(root, '.github/issue-templates-later', file)), file).toBe(
        true,
      );
    }
  });

  it('links to how it works and how to run your own, and has no form to keep posted or offer yet', async () => {
    const links = await import('./links');
    expect(links.HOW_IT_WORKS_URL).toBe(`${REPO_URL}/blob/main/docs/how-it-works.md`);
    expect(links.OWN_REPO_URL).toBe(`${REPO_URL}/blob/main/RUN-YOUR-OWN.md`);
    expect(existsSync(join(root, 'docs/how-it-works.md'))).toBe(true);
    expect(existsSync(join(root, 'RUN-YOUR-OWN.md'))).toBe(true);
    expect(links.KEEP_POSTED_URL).toBe('');
    expect(links.keepPostedHref()).toBe('#/keep-posted');
    expect(links.signupOffer()).toBeUndefined();
  });
});

describe('the rest of the map’s rules, as they load', () => {
  it("lists the North Pole's own levels", async () => {
    const { NORTH_POLE_LEVELS } = await import('./north-pole-levels');
    expect(NORTH_POLE_LEVELS).toEqual([
      'the-factory',
      'the-academy',
      'the-studio',
      'the-year-in-review',
    ]);
  });

  it('words every stage of a booth being built, and reads each one', async () => {
    const { readPending, STAGE_TEXT } = await import('./construction-sites');
    expect(STAGE_TEXT).toEqual({
      building: 'Being built',
      checks: 'Checks running',
      almost: 'Almost there',
      maintainer: 'Waiting for a maintainer',
    });
    const stages = Object.keys(STAGE_TEXT);
    const entries = stages.map((stage, n) => ({ login: `elf-${n}`, issue: 1, spot: n, stage }));
    expect(readPending(entries).map(({ stage }) => stage)).toEqual(stages);
  });

  it('has three badge tiers, an image and a snippet for each, and a link to the factory', async () => {
    const badges = await import('./badges');
    expect(badges.BADGE_TIERS).toEqual(['bronze', 'silver', 'gold']);
    expect(badges.badgeImage('bronze')).toBe('badges/elf-engineer-bronze.svg');
    expect(badges.badgeSnippet('s/', 'gold')).toBe(
      '[![Elf Engineer: gold](s/badges/elf-engineer-gold.svg)](s/)',
    );
    expect(badges.factoryUrl({ login: 'a', repo: 'a/b' })).toBe('https://github.com/a/b');
  });

  it("opens an advent door from its day's midnight fourteen hours ahead of UTC", async () => {
    const { isDoorOpenAnywhere } = await import('./advent');
    const midnight = Date.UTC(2026, 11, 5) - 14 * 60 * 60 * 1000;
    expect(isDoorOpenAnywhere(5, new Date(midnight - 1), 2026)).toBe(false);
    expect(isDoorOpenAnywhere(5, new Date(midnight), 2026)).toBe(true);
  });

  it('holds the island to a hundred spots past its booths', async () => {
    const { spotLimit } = await import('./spots');
    expect(spotLimit(3)).toBe(103);
  });
});
