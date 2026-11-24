import { describe, expect, it } from 'vitest';
import {
  earFlick,
  elfWalk,
  flake,
  handoffAt,
  headLift,
  LOOP,
  phase,
  STACK_SIZE,
  stackAt,
  waveAngle,
} from './booth';

describe('the loop', () => {
  it('repeats every 8 seconds', () => {
    expect(LOOP).toBe(8_000);
    expect(phase(LOOP + 1_000)).toBeCloseTo(phase(1_000));
  });
});

describe('waveAngle', () => {
  it('starts and ends at rest, and waves twice', () => {
    expect(waveAngle(0)).toBe(0);
    expect(waveAngle(0.5)).toBe(0);
    expect(waveAngle(0.8)).toBe(0);
    let peaks = 0;
    for (let i = 1; i < 500; i++) {
      const [a, b, c] = [waveAngle((i - 1) / 1000), waveAngle(i / 1000), waveAngle((i + 1) / 1000)];
      if (b > a && b > c && b > 1.5) peaks++;
    }
    expect(peaks).toBe(2);
  });
});

describe('the stack', () => {
  it('goes down by one when an elf picks up a parcel, and a new one drops onto it', () => {
    expect(stackAt(0).settled).toBe(STACK_SIZE);
    expect(stackAt(0.3).settled).toBe(STACK_SIZE - 1);
    expect(stackAt(0.75).falling).not.toBeNull();
    expect(stackAt(0.9)).toEqual({ settled: STACK_SIZE, falling: null });
  });
});

describe('elfWalk', () => {
  it('carries a parcel from the stack to the sleigh and walks back empty-handed', () => {
    expect(elfWalk(0).pos).toBe(0);
    expect(elfWalk(0.3).carrying).toBe(true);
    expect(elfWalk(0.5).pos).toBe(1);
    expect(elfWalk(0.7).carrying).toBe(false);
    expect(elfWalk(0.999).pos).toBeCloseTo(0);
  });

  it('passes the parcel into the sleigh once the elf arrives', () => {
    expect(handoffAt(0.3)).toBeNull();
    expect(handoffAt(0.55)?.stage).toBe('pass');
    expect(handoffAt(0.8)?.stage).toBe('stow');
    expect(handoffAt(0.99)).toBeNull();
  });
});

describe('the reindeer', () => {
  it('grazes, looks up and flicks its ears, then grazes again', () => {
    expect(headLift(0)).toBe(0);
    expect(headLift(0.5)).toBe(1);
    expect(headLift(0.9)).toBe(0);
    expect(earFlick(0.1)).toBe(0);
    expect(Math.abs(earFlick(0.5))).toBeGreaterThan(0);
  });
});

describe('flake', () => {
  it('stays on the square and repeats with the loop', () => {
    for (let n = 0; n < 28; n++) {
      const a = flake(n, 0.3);
      expect(a.y).toBeGreaterThan(0);
      expect(a.y).toBeLessThan(100);
      const wrapped = flake(n, 1.3);
      expect(wrapped.x).toBeCloseTo(a.x);
      expect(wrapped.y).toBeCloseTo(a.y);
    }
  });
});
