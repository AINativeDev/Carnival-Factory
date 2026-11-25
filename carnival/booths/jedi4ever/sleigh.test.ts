import { describe, expect, it } from 'vitest';
import { IN_THE_SACK, LOOP, SLOT } from './letters';
import { jingleAt, JINGLE, sacksFilled } from './sleigh';

describe('jingleAt and sacksFilled', () => {
  const landing = 3 * SLOT + IN_THE_SACK;

  it('jingles just after the round’s last toy lands, gently', () => {
    expect(jingleAt(landing - 1)).toBe(0);
    expect(jingleAt(landing + JINGLE / 2)).toBeCloseTo(1);
    expect(jingleAt(landing + JINGLE)).toBe(0);
    expect(jingleAt(landing + LOOP + JINGLE / 2)).toBeCloseTo(1);
  });

  it('ticks the counter up once per jingle, the first one included', () => {
    const first = landing - LOOP;
    expect(jingleAt(first + JINGLE / 2)).toBeCloseTo(1);
    expect(sacksFilled(0)).toBe(0);
    expect(sacksFilled(first - 1)).toBe(0);
    expect(sacksFilled(first)).toBe(1);
    expect(sacksFilled(landing - 1)).toBe(1);
    expect(sacksFilled(landing)).toBe(2);
    expect(sacksFilled(landing + 2 * LOOP)).toBe(4);
  });

  it('never jingles without the counter moving', () => {
    for (let time = 0; time < 5 * LOOP; time += 50) {
      if (jingleAt(time) > 0) {
        expect(sacksFilled(time)).toBeGreaterThan(sacksFilled(time - JINGLE));
      }
    }
  });
});
