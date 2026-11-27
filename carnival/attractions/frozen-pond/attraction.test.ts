import { describe, expect, it } from 'vitest';
import attraction, { skaterAt } from './attraction';

/** A stand-in canvas that takes every call the pond makes, draws nothing, and keeps what's written. */
class DrawingLog {
  words: string[] = [];
  globalAlpha = 1;
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 1;
  lineCap = '';
  font = '';
  textAlign = '';
  textBaseline = '';
  save() {}
  restore() {}
  scale() {}
  translate() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  quadraticCurveTo() {}
  arc() {}
  ellipse() {}
  roundRect() {}
  rect() {}
  fill() {}
  stroke() {}
  fillRect() {}
  clip() {}
  fillText(text: string) {
    this.words.push(text);
  }
  measureText() {
    return { width: 40 };
  }
  createLinearGradient() {
    return { addColorStop() {} };
  }
  createRadialGradient() {
    return { addColorStop() {} };
  }
}

const canvas = (log: DrawingLog) => log as unknown as CanvasRenderingContext2D;

describe('Frozen Pond', () => {
  it('keeps its id, name and ice-rink landmark', () => {
    expect(attraction.id).toBe('frozen-pond');
    expect(attraction.name).toBe('Frozen Pond');
    expect(attraction.stall?.landmark).toBe('ice-rink');
  });

  it('keeps the skaters on the far side of the pond', () => {
    for (let time = 0; time < 30_000; time += 500) {
      const { x, y } = skaterAt(time, 1);
      expect(x).toBeGreaterThan(20);
      expect(x).toBeLessThan(75);
      expect(y).toBeLessThan(61);
    }
  });

  it('shows the skip playing, then a game from a drag, through to the final card', () => {
    const show = new DrawingLog();
    for (let time = 0; time < 60_000; time += 100) attraction.draw(canvas(show), 300, time);
    expect(show.words).toContain('Curling');
    // Every three seconds a drag back from the stone and let go: it throws when aiming, and sweeps while sliding.
    const game = new DrawingLog();
    let time = 60_000;
    for (; time < 260_000; time += 50) {
      const beat = time % 3_000;
      if (beat === 0)
        attraction.draw(canvas(game), 300, time, { x: 57, y: 198, down: true, presses: 1 });
      else if (beat === 50)
        attraction.draw(canvas(game), 300, time, { x: 20, y: 198, down: true, presses: 0 });
      else attraction.draw(canvas(game), 300, time);
    }
    expect(game.words).toContain('SCORE');
    expect(game.words).toContain('Final score');
    expect(game.words).toContain('Tap to play again');
    const again = new DrawingLog();
    attraction.draw(canvas(again), 300, time, { x: 150, y: 150, down: false, presses: 1 });
    attraction.draw(canvas(again), 300, time + 50);
    expect(again.words).not.toContain('Final score');
    expect(again.words).toContain('END 1/3');
  });
});
