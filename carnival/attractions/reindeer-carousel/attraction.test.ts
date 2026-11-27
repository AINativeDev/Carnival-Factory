import { describe, expect, it } from 'vitest';
import attraction from './attraction';

/** A stand-in canvas that takes every call the carousel makes, keeps its words and draws nothing. */
class DrawingLog {
  texts: string[] = [];
  globalAlpha = 1;
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 1;
  lineCap = '';
  font = '';
  textAlign = '';
  textBaseline = '';
  fillText(text: string) {
    this.texts.push(text);
  }
  save() {}
  restore() {}
  scale() {}
  translate() {}
  fillRect() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  arcTo() {}
  ellipse() {}
  fill() {}
  stroke() {}
  clip() {}
  rotate() {}
  quadraticCurveTo() {}
  rect() {}
  createLinearGradient() {
    return { addColorStop() {} };
  }
  createRadialGradient() {
    return { addColorStop() {} };
  }
}

describe('the carousel', () => {
  const log = new DrawingLog();
  const ctx = log as unknown as CanvasRenderingContext2D;
  const tap = { x: 100, y: 180, down: true, presses: 1 };
  const draw = (time: number, presses = 0) => {
    log.texts.length = 0;
    attraction.draw(ctx, 200, time, presses ? { ...tap, presses } : undefined);
    return log.texts.join(' | ');
  };

  it('keeps its id, name and the merry-go-round landmark', () => {
    expect(attraction.id).toBe('reindeer-carousel');
    expect(attraction.name).toBe('Reindeer Carousel');
    expect(attraction.stall).toEqual({
      shape: 'carousel',
      roof: 'berry',
      trim: 'snow',
      landmark: 'merry-go-round',
    });
  });

  it('plays its demo, then a ride a tap starts, until three misses end it', () => {
    expect(draw(0)).toContain('Ring Grab');
    // The demo's elf grabs its rings as the carousel goes round.
    let caught = false;
    for (let time = 0; time < 20_000; time += 50) caught ||= draw(time).includes('+');
    expect(caught).toBe(true);
    expect(draw(20_000, 1)).toContain('0 rings');
    // Taps keep coming until three of them miss.
    let said = '';
    let time = 20_000;
    while (!said.includes('Ride over!') && time < 60_000) {
      time += 300;
      draw(time, 1);
      said = draw((time += 400));
    }
    expect(said).toContain('Ride over!');
    for (let t = time; t < time + 1_500; t += 100) draw(t);
    expect(draw(time + 1_500)).toContain('Tap to ride again');
    expect(draw(time + 1_600, 1)).toContain('0 rings');
  });
});
