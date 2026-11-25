import { describe, expect, it } from 'vitest';
import { MAX_SPEED, onLogo, REST, stepSpin } from './spin';

describe('stepSpin', () => {
  it('stays still when nobody holds it', () => {
    const next = stepSpin(REST, false, 1_000);
    expect(next.angle).toBe(0);
    expect(next.speed).toBe(0);
  });

  it('speeds up while held, up to the top speed', () => {
    let spin = stepSpin(REST, true, 0);
    for (let time = 16; time < 5_000; time += 16) spin = stepSpin(spin, true, time);
    expect(spin.speed).toBe(MAX_SPEED);
    expect(spin.angle).toBeGreaterThan(1);
  });

  it('slows to a stop once let go', () => {
    let spin = { angle: 0, speed: MAX_SPEED, at: 0 };
    spin = stepSpin(spin, false, 50);
    expect(spin.speed).toBeLessThan(MAX_SPEED);
    expect(spin.speed).toBeGreaterThan(0);
    for (let time = 100; time < 6_000; time += 50) spin = stepSpin(spin, false, time);
    expect(spin.speed).toBe(0);
  });

  it('ignores a long gap between frames', () => {
    const next = stepSpin({ angle: 0, speed: MAX_SPEED, at: 0 }, true, 60_000);
    expect(next.angle).toBeLessThan(MAX_SPEED * 100 + 0.001);
  });
});

describe('onLogo', () => {
  it('is true on the plaque and false beside it', () => {
    expect(onLogo(90, 42)).toBe(true);
    expect(onLogo(50, 42)).toBe(false);
    expect(onLogo(90, 60)).toBe(false);
  });
});
