import { describe, expect, it } from 'vitest';
import { APPLAUSE_FOR, CHEER_FOR, lookOf, type Mood, poseOf, SEATS } from './crowd';

const calm: Mood = {
  askers: [],
  cheers: [],
  applauseAt: -Infinity,
  ovationAt: Infinity,
  quiet: false,
};

describe('the seats', () => {
  it('fill four rows either side of the aisle, nearer rows bigger', () => {
    expect(SEATS).toHaveLength(44);
    for (const seat of SEATS) expect(Math.abs(seat.x - 50)).toBeGreaterThan(4);
    const sizes = SEATS.map((seat) => seat.s);
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
  });

  it('each have a look of their own, the same every frame', () => {
    const looks = SEATS.map(lookOf);
    expect(looks).toEqual(SEATS.map(lookOf));
    expect(new Set(looks.map((look) => look.hat)).size).toBeGreaterThan(2);
    expect(looks.some((look) => look.laptop)).toBe(true);
  });
});

describe('the poses', () => {
  it('nod along gently with nothing going on', () => {
    const pose = poseOf(5, calm, 1_000);
    expect(pose.hands).toBe('down');
    expect(Math.abs(pose.nod)).toBeLessThan(0.5);
    expect(poseOf(999, calm, 0)).toEqual({ lift: 0, hands: 'down', lit: 0, nod: 0 });
  });

  it('put a hand up to ask', () => {
    expect(poseOf(5, { ...calm, askers: [5] }, 1_000).hands).toBe('ask');
  });

  it('cheer with the mic, and the clap and badge glow spread out from there', () => {
    const mood = { ...calm, cheers: [{ seat: 5, at: 1_000 }] };
    expect(poseOf(5, mood, 1_200)).toMatchObject({ hands: 'up', lit: 1 });
    expect(poseOf(5, mood, 1_000 + CHEER_FOR).hands).not.toBe('up');
    const far = SEATS.length - 1;
    expect(poseOf(far, mood, 1_000).hands).toBe('down');
    const reached = Array.from({ length: 100 }, (_, k) => poseOf(far, mood, 1_000 + k * 30));
    expect(reached.some((pose) => pose.hands === 'clap' && pose.lit > 0)).toBe(true);
  });

  it('clap the next speaker on', () => {
    const mood = { ...calm, applauseAt: 1_000 };
    expect(poseOf(5, mood, 1_500).hands).toBe('clap');
    expect(poseOf(5, mood, 1_000 + APPLAUSE_FOR).hands).toBe('down');
  });

  it('rise for a standing ovation, and hang their heads in a quiet room', () => {
    const ovation = poseOf(5, { ...calm, ovationAt: 1_000 }, 3_000);
    expect(ovation).toMatchObject({ hands: 'up', lit: 1 });
    expect(ovation.lift).toBeGreaterThan(0);
    expect(poseOf(5, { ...calm, quiet: true, askers: [5] }, 3_000).hands).toBe('down');
  });
});
