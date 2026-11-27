import { afterEach, describe, expect, it, vi } from 'vitest';
import { switchFlags } from '../test-support/feature-flags';
import { REPO_URL } from './links';
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

describe("People's Choice loaded afresh, as the page loads it", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  /** Loads the standings and the flags afresh, with People's Choice switched `on` or off. */
  const load = async (on: boolean) => {
    vi.resetModules();
    const { FEATURE_FLAGS } = await import('../feature-flags');
    FEATURE_FLAGS.peoplesChoice = on;
    return import('./peoples-choice-standings');
  };

  it('shows the baked standings once its flag is on, and none while it is off', async () => {
    vi.stubGlobal('__PEOPLES_CHOICE__', { ballot: `${REPO_URL}/issues/7`, booths: [] });
    expect((await load(true)).shownChoice()?.ballot).toBe(`${REPO_URL}/issues/7`);
    expect((await load(false)).shownChoice()).toBeUndefined();
  });

  it('has none when nothing defined the standings, as when the smoke test loads the map in Node', async () => {
    const baked: unknown = Reflect.get(globalThis, '__PEOPLES_CHOICE__');
    expect(Reflect.deleteProperty(globalThis, '__PEOPLES_CHOICE__')).toBe(true);
    try {
      expect((await load(true)).PEOPLES_CHOICE).toBeUndefined();
    } finally {
      Reflect.set(globalThis, '__PEOPLES_CHOICE__', baked);
    }
  });
});
