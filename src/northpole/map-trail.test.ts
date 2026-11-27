import { afterEach, describe, expect, it, vi } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import { drawEdgeArrow, drawFootprints, drawTrail } from './map-trail';
import type { MapRun } from './map-state';
import type { Tile } from './world';

/** The few parts of a running map the trail reads: its canvas, its footprints and the walk ahead. */
type TrailRun = Pick<MapRun, 'ctx' | 'footprints' | 'trailing' | 'path'>;

const runOn = (ctx: CanvasRenderingContext2D, run: Omit<TrailRun, 'ctx'>) => {
  const m: TrailRun = { ctx, ...run };
  return m as MapRun;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the footprints left walking to claim a spot', () => {
  it('fade as they fill with snow, left and right foot, and are gone after nine seconds', () => {
    vi.spyOn(performance, 'now').mockReturnValue(10_000);
    const footprints = [
      { at: { x: 3, y: 4 }, time: 1000, side: 0 },
      { at: { x: 3.5, y: 4 }, time: 1001, side: 1 },
      { at: { x: 4, y: 4.5 }, time: 7000, side: 0 },
      { at: { x: 4, y: 5 }, time: 10_000, side: 2 },
    ];
    let left: MapRun['footprints'] = [];
    const calls = drawingOf((ctx) => {
      const m = runOn(ctx, { footprints, trailing: false, path: [] });
      drawFootprints(m);
      left = m.footprints;
    });
    expect(left.map((print) => print.time)).toEqual([1001, 7000, 10_000]);
    expect(calls.filter(([name]) => name === '=globalAlpha')).toEqual([
      ['=globalAlpha', 0.000067],
      ['=globalAlpha', 0.4],
      ['=globalAlpha', 0.6],
    ]);
    expect(fingerprint(calls)).toMatchInlineSnapshot(`"fa0ac1ef5cf6fa03 (15 calls)"`);
  });
});

describe('the way ahead to a picked square', () => {
  const path: Tile[] = [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
  ];

  it('shows as faint footprints, one foot after the other, while walking there', () => {
    const calls = drawingOf((ctx) => {
      drawTrail(runOn(ctx, { footprints: [], trailing: true, path }));
    });
    expect(fingerprint(calls)).toMatchInlineSnapshot(`"3672abc8466dab7c (11 calls)"`);
  });

  it('shows nothing on any other walk', () => {
    const calls = drawingOf((ctx) => {
      drawTrail(runOn(ctx, { footprints: [], trailing: false, path }));
    });
    expect(calls).toEqual([]);
  });
});

describe('the arrow at the edge of the screen', () => {
  const arrow = (at: Tile) =>
    drawingOf((ctx) => {
      drawEdgeArrow(ctx, at, 400, 300);
    });

  it('stays away while the square is on screen, inside the margin', () => {
    expect(arrow({ x: 29, y: 29 })).toEqual([]);
    expect(arrow({ x: 371, y: 271 })).toEqual([]);
  });

  it('points toward a square off screen, or within the margin of an edge', () => {
    const prints = [
      { x: 28, y: 150 },
      { x: 372, y: 150 },
      { x: 200, y: 28 },
      { x: 200, y: 272 },
      { x: 900, y: 150 },
      { x: 200, y: -500 },
      { x: -300, y: 700 },
      { x: 1000, y: -40 },
    ].map((at) => fingerprint(arrow(at)));
    expect(prints).toMatchInlineSnapshot(`
      [
        "a309546dc2018732 (18 calls)",
        "5f3ff59977bca18b (18 calls)",
        "9d40549c4498fa6b (18 calls)",
        "9103487e6b6dd7de (18 calls)",
        "5f3ff59977bca18b (18 calls)",
        "9d40549c4498fa6b (18 calls)",
        "aaa2209951b8aac1 (18 calls)",
        "c65ca296163082b8 (18 calls)",
      ]
    `);
  });
});
