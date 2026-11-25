import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import calendar from '../carnival/challenges/advent.json';
import { ADVENT_FIELDS, adventDayOptions, parseDay } from './advent';

describe('the Advent challenge issue form', () => {
  const form = readFileSync(
    new URL('../.github/ISSUE_TEMPLATE/04-advent-challenge.yml', import.meta.url),
    'utf8',
  );

  it('labels its issues advent-done, and names its fields as the scripts read them', () => {
    expect(form).toContain('labels: [advent-done]');
    expect(form).toContain(`label: ${ADVENT_FIELDS.day}\n`);
    expect(form).toContain(`label: ${ADVENT_FIELDS.link}\n`);
  });

  it('offers every day of the calendar, each read back as its own day', () => {
    const options = [...form.matchAll(/^ {8}- (['"])(Day .*)\1$/gm)].map((match) => match[2]);
    expect(options).toEqual(adventDayOptions(calendar));
    expect(options.map(parseDay)).toEqual(calendar.challenges.map((c) => c.day));
  });
});
