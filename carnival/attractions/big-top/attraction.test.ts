import { describe, expect, it } from 'vitest';
import attraction from './attraction';
import { DrawingLog } from './drawing-log';
import {
  acrobatAt,
  BOARD,
  DRUMROLL,
  drumBeats,
  FINALE,
  finaleGlow,
  juggledBall,
  JUGGLE,
  LEAP,
  OPENING,
  RING,
  spotlightOn,
  tapped,
} from './show';

/** What the attraction draws at `time` with `pointer`: every call and setting, in order. */
function drawn(time: number, pointer?: Parameters<typeof attraction.draw>[3]): string[] {
  const canvas = new DrawingLog();
  attraction.draw(canvas as unknown as CanvasRenderingContext2D, 100, time, pointer);
  return canvas.calls;
}

describe('tapped', () => {
  it('leaves the show as it was when nothing was tapped', () => {
    expect(tapped(OPENING, 0, 1_000)).toBe(OPENING);
  });

  it('sends the acrobat off and beats the drum once a tap', () => {
    const show = tapped(OPENING, 2, 1_000);
    expect(show.leapt).toBe(1_000);
    expect(drumBeats(show)).toBe(2);
    expect(show.finale).toBe(-Infinity);
  });

  it('starts the big finish on the tap that fills the drum roll, and starts the roll again', () => {
    const show = tapped(tapped(OPENING, DRUMROLL - 1, 1_000), 1, 2_000);
    expect(show.finale).toBe(2_000);
    expect(drumBeats(show)).toBe(0);
  });

  it('never starts a big finish again while one is playing, so tapping fast cannot flash it', () => {
    const first = tapped(OPENING, DRUMROLL, 1_000);
    expect(tapped(first, DRUMROLL, 1_000 + FINALE / 2).finale).toBe(1_000);
    expect(tapped(first, DRUMROLL, 1_000 + FINALE).finale).toBe(1_000 + FINALE);
  });
});

describe('acrobatAt', () => {
  it('leaves from the springboard and is only in the air during the leap', () => {
    expect(acrobatAt(0)).toMatchObject({ x: BOARD.x, y: BOARD.y });
    expect(acrobatAt(-1)).toBeUndefined();
    expect(acrobatAt(LEAP)).toBeUndefined();
  });

  it('flies high over the ring halfway through, and turns a whole somersault', () => {
    const top = acrobatAt(LEAP / 2);
    expect(top?.y).toBeLessThan(BOARD.y - 30);
    expect(top?.turn).toBeCloseTo(Math.PI);
  });
});

describe('juggledBall', () => {
  it('keeps the balls a third of a turn apart, going round and round', () => {
    const ahead = juggledBall(1, 50, 60, 0);
    const behind = juggledBall(0, 50, 60, JUGGLE / 3);
    expect(ahead.x).toBeCloseTo(behind.x);
    expect(ahead.y).toBeCloseTo(behind.y);
    expect(juggledBall(0, 50, 60, JUGGLE * 2).y).toBeCloseTo(juggledBall(0, 50, 60, 0).y);
  });

  it('throws higher for the big finish', () => {
    const peak = JUGGLE * 0.3;
    expect(juggledBall(0, 50, 60, peak, 6).y).toBeCloseTo(juggledBall(0, 50, 60, peak).y - 6);
  });

  it('brings the ball back low under the hands', () => {
    expect(juggledBall(0, 50, 60, JUGGLE * 0.8).y).toBeGreaterThan(58);
  });
});

describe('spotlightOn', () => {
  it('shines under the pointer inside the ring, at any size', () => {
    expect(spotlightOn({ x: 110, y: 140, down: false, presses: 0 }, 200, 0)).toEqual({
      x: 55,
      y: 70,
    });
  });

  it('stays on the ring when the pointer is outside it', () => {
    const spot = spotlightOn({ x: 100, y: 68, down: false, presses: 0 }, 100, 0);
    expect(spot.x).toBeCloseTo(RING.x + RING.rx);
    expect(spot.y).toBeCloseTo(RING.y);
  });

  it('sweeps round the ring on its own while nobody points', () => {
    const a = spotlightOn(undefined, 100, 0);
    const b = spotlightOn(undefined, 100, 2_000);
    expect(a).not.toEqual(b);
    expect(Math.abs(b.x - RING.x)).toBeLessThanOrEqual(RING.rx);
  });
});

describe('finaleGlow', () => {
  it('rises and falls once, slowly, over the big finish', () => {
    expect(finaleGlow(-1)).toBe(0);
    expect(finaleGlow(FINALE / 2)).toBeCloseTo(1);
    expect(finaleGlow(FINALE)).toBe(0);
  });
});

describe("Santa's Big Top", () => {
  it('keeps its id and stands on the map as a big top', () => {
    expect(attraction.id).toBe('big-top');
    expect(attraction.stall?.landmark).toBe('big-top');
  });

  it('moves the spotlight with the pointer', () => {
    const left = drawn(10_000, { x: 35, y: 68, down: false, presses: 0 });
    const right = drawn(10_000, { x: 65, y: 68, down: false, presses: 0 });
    expect(left).not.toEqual(right);
  });

  it('sends the acrobat flying on a tap, and plays the big finish when the drum roll fills', () => {
    const still = drawn(20_000);
    const tap = { x: 50, y: 50, down: true, presses: 1 };
    expect(drawn(20_000, tap)).not.toEqual(still);
    for (let n = 1; n < DRUMROLL; n++) drawn(20_000 + n * 100, tap);
    const finish = drawn(20_000 + DRUMROLL * 100 + FINALE / 2);
    expect(finish.length).toBeGreaterThan(drawn(20_000 + DRUMROLL * 100 + FINALE * 2).length);
  });
});
