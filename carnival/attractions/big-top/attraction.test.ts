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
  LAMP_FADE,
  lampsAt,
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

describe('lampsAt', () => {
  it('fades a lamp on over the drum after each beat', () => {
    const show = tapped(OPENING, 2, 1_000);
    expect(lampsAt(show, 1_000)).toEqual([0, 0, 0, 0]);
    expect(lampsAt(show, 1_000 + LAMP_FADE / 2)).toEqual([0.5, 0.5, 0, 0]);
    expect(lampsAt(show, 1_000 + LAMP_FADE)).toEqual([1, 1, 0, 0]);
  });

  it('fades the lamps out when the drum roll starts again', () => {
    const full = tapped(OPENING, DRUMROLL - 1, 1_000);
    const again = tapped(full, 1, 1_000 + LAMP_FADE);
    expect(lampsAt(again, 1_000 + LAMP_FADE)).toEqual([1, 1, 1, 1]);
    expect(lampsAt(again, 1_000 + LAMP_FADE * 2)).toEqual([0, 0, 0, 0]);
  });

  it('never blinks the lamps, however fast and however many the taps', () => {
    let show = OPENING;
    let before = lampsAt(show, 0);
    for (let n = 1; n <= 40; n++) {
      const time = n * 50;
      show = tapped(show, n % 2 ? DRUMROLL - 1 : 1, time);
      const now = lampsAt(show, time);
      now.forEach((bright, lamp) => {
        expect(Math.abs(bright - (before.at(lamp) ?? 0))).toBeLessThanOrEqual(
          50 / LAMP_FADE + 1e-9,
        );
      });
      before = lampsAt(show, time + 50);
    }
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
    // Only the acrobat turns as it draws, so a rotate in the log is the acrobat in the air.
    const tumbles = (calls: string[]) => calls.some((call) => call.startsWith('rotate('));
    const tap = { x: 50, y: 50, down: true, presses: 1 };
    expect(tumbles(drawn(20_000, { ...tap, down: false, presses: 0 }))).toBe(false);
    expect(tumbles(drawn(20_000, tap))).toBe(true);
    expect(tumbles(drawn(20_000 + LEAP))).toBe(false);
    drawn(30_000, tap);
    for (let n = 1; n < DRUMROLL; n++) drawn(30_000 + n * 100, tap);
    const finish = drawn(30_000 + DRUMROLL * 100 + FINALE / 2);
    expect(finish.length).toBeGreaterThan(drawn(30_000 + DRUMROLL * 100 + FINALE * 2).length);
  });
});
