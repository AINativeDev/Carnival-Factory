import { describe, expect, it } from 'vitest';
import { switchFlags } from '../test-support/feature-flags';
import { PEOPLES_CHOICE, shownChoice } from './peoples-choice-standings';

describe("People's Choice while its flag is off", () => {
  it('shows no standings, so its list, ballot links and trophies stay hidden', () => {
    expect(shownChoice()).toBeUndefined();
  });
});

describe("People's Choice with its flag on", () => {
  switchFlags({ peoplesChoice: true });
  it('shows the standings the build baked in', () => {
    expect(shownChoice()).toBe(PEOPLES_CHOICE);
  });
});
