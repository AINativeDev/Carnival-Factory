import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import { reindeerAt } from './carousel';
import { outfit, phase, swing } from './elf';
import { LEVEL_PROPS } from './level-props';
import { ballAt, flameSize } from './performers';
import { drawThing } from './render';
import { drawShow, type ShowKind } from './show';
import { theme } from './theme';
import { noteAt } from './troupe';
import type { Thing } from './world';

const SHOW: ShowKind[] = [
  'fire-breather',
  'juggler',
  'stilt-walker',
  'acrobats',
  'band',
  'strongman',
  'ferris-wheel',
  'carousel',
  'balloon',
  'conveyor',
  'cog',
  'candy-pipe',
  'lantern',
  'coaster',
  'coaster-loop',
];

/** A show prop as a level lays it out: its catalogue footprint, at (2, -1). */
const thingOf = (kind: ShowKind, seed: number): Thing => {
  const { w, h, blocks } = LEVEL_PROPS[kind];
  return { kind, x: 2, y: -1, w, h, seed, blocks };
};
const drawn = (kind: ShowKind, seed: number, time: number) =>
  drawingOf((ctx) => {
    drawShow(ctx, kind, thingOf(kind, seed), time);
  });

describe('the show', () => {
  it('draws every performer, ride and piece of dressing as pinned', () => {
    const pins = SHOW.map((kind) =>
      fingerprint(
        [0.1, 0.4, 0.6, 0.9].flatMap((seed) =>
          [0, 1300, 3100].flatMap((t) => drawn(kind, seed, t)),
        ),
      ),
    );
    expect(Object.fromEntries(SHOW.map((kind, n) => [kind, pins[n]]))).toMatchInlineSnapshot(`
      {
        "acrobats": "f30f7f65d0dafe14 (1128 calls)",
        "balloon": "6180ec869ab33262 (828 calls)",
        "band": "cbf157523eefbf22 (1716 calls)",
        "candy-pipe": "0640c4ffcf42f20f (912 calls)",
        "carousel": "09b920c178bb5ec3 (5532 calls)",
        "coaster": "201c9ff47d458287 (996 calls)",
        "coaster-loop": "ba27e3935b1e356c (3060 calls)",
        "cog": "9a60fea6f94e035a (720 calls)",
        "conveyor": "94bfc4c774311e36 (1212 calls)",
        "ferris-wheel": "f0f43285361d0624 (2976 calls)",
        "fire-breather": "7e10d434ce4035e2 (1200 calls)",
        "juggler": "aff043b083c6ec34 (744 calls)",
        "lantern": "7817d05229783d87 (396 calls)",
        "stilt-walker": "8dbdfe0b0f758f82 (1212 calls)",
        "strongman": "a417082749576a02 (804 calls)",
      }
    `);
  });

  it('is drawn by drawThing like the rest of the scenery', () => {
    for (const kind of SHOW) {
      const byThing = drawingOf((ctx) => {
        drawThing(ctx, thingOf(kind, 0.3), 2000);
      });
      expect(byThing).toEqual(drawn(kind, 0.3, 2000));
    }
  });

  it('moves with time, so each one is alive', () => {
    for (const kind of SHOW) expect(drawn(kind, 0.3, 0)).not.toEqual(drawn(kind, 0.3, 2100));
  });

  it("doesn't move two of a kind in step when their variants differ", () => {
    // A coaster's pieces carry one ticket between them, so they ride as one, whatever their variants.
    const apart = SHOW.filter((kind) => kind !== 'coaster' && kind !== 'coaster-loop');
    for (const kind of apart) expect(drawn(kind, 0.2, 1000)).not.toEqual(drawn(kind, 0.7, 1000));
  });

  it('paints only with the theme', () => {
    const palette = new Set<unknown>(Object.values(theme.colors));
    for (const kind of SHOW)
      for (const [name, value] of drawn(kind, 0.6, 2500))
        if (name === '=fillStyle' || name === '=strokeStyle')
          if (typeof value === 'string') expect(palette).toContain(value);
  });
});

describe('the show in motion', () => {
  it('loops from 0 to 1, even before time starts', () => {
    expect(phase(500, 1000, 0)).toBeCloseTo(0.5);
    expect(phase(-250, 1000, 0)).toBeCloseTo(0.75);
    expect(phase(0, 1000, 0.25)).toBeCloseTo(0.25);
    expect(swing(0, 1000, 0)).toBeCloseTo(0);
    expect(swing(500, 1000, 0)).toBeCloseTo(1);
  });

  it('dresses performers by their variant', () => {
    const { colors } = theme;
    expect(outfit(0.1)).toEqual({ coat: colors.berry, hat: colors.pine });
    expect(outfit(0.3)).toEqual({ coat: colors.pine, hat: colors.berry });
    expect(outfit(0.6).coat).toBe(colors.violet);
    expect(outfit(0.9).coat).toBe(colors.gingerbread);
  });

  it('breathes in before each puff of flame, which swells and dies away', () => {
    expect(flameSize(0.2)).toBe(0);
    expect(flameSize(0.75)).toBeCloseTo(1);
    expect(flameSize(0.99)).toBeLessThan(0.1);
  });

  it("keeps the juggler's balls apart, high over the top and low across", () => {
    const balls = [0, 1, 2].map((n) => ballAt(700, 0.3, n, 3));
    expect(new Set(balls.map((b) => b.x.toFixed(2))).size).toBe(3);
    for (const ball of balls) {
      expect(ball.y).toBeGreaterThanOrEqual(-24);
      expect(ball.y).toBeLessThanOrEqual(4);
    }
  });

  it("lets the band's notes rise and fade", () => {
    const low = noteAt(0, 0, 0);
    const high = noteAt(1800, 0, 0);
    expect(high.y).toBeLessThan(low.y);
    expect(high.alpha).toBeLessThan(low.alpha);
  });

  it('spaces the reindeer evenly round the carousel, bobbing as they go', () => {
    const first = reindeerAt(0, 0, 0);
    const second = reindeerAt(0, 0, 1);
    expect(second.angle - first.angle).toBeCloseTo(Math.PI / 3);
    expect(Math.abs(first.bob)).toBeLessThanOrEqual(4);
  });
});
