import { describe, expect, it } from 'vitest';
import { restingSpin, stepSpin, TOP_SPEED } from './spin';

describe('the spinning cube', () => {
  it('rests until the pointer goes down', () => {
    const rest = restingSpin();
    expect(stepSpin(rest, 0.016, false).angle).toBe(rest.angle);
  });

  it('speeds up while held, and faster the longer it is held', () => {
    let spin = restingSpin();
    for (let i = 0; i < 30; i++) spin = stepSpin(spin, 0.016, true);
    const early = spin.speed;
    expect(early).toBeGreaterThan(0);
    for (let i = 0; i < 400; i++) spin = stepSpin(spin, 0.016, true);
    expect(spin.speed).toBeGreaterThan(early);
    expect(spin.speed).toBeLessThanOrEqual(TOP_SPEED);
  });

  it('keeps its speed when pressed again while it coasts', () => {
    let spin = { angle: 0, speed: TOP_SPEED, held: 5 };
    spin = stepSpin(spin, 0.016, false);
    const coasting = spin.speed;
    spin = stepSpin(spin, 0.016, true);
    expect(spin.speed).toBeGreaterThanOrEqual(coasting);
  });

  it('slows to a stop once let go', () => {
    let spin = { angle: 0, speed: 10, held: 2 };
    for (let i = 0; i < 600; i++) spin = stepSpin(spin, 0.016, false);
    expect(spin.speed).toBe(0);
    expect(spin.held).toBe(0);
  });
});
