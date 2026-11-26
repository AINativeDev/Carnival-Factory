import { describe, expect, it } from 'vitest';
import attraction from './attraction';
import { badgeSwing, DROP } from './badge';
import { micAt, waitColor } from './bubbles';
import { SIGN } from './buttons';
import { hypeColor } from './hall';
import { EVENT, KEYNOTE, PER_TALK, pointsShown, talkAfter, talkOf, TALKS } from './program';
import { howToShows, screen } from './screen';
import { BADGE_FOR, type Game, newGame } from './state';

const SIZE = 500;

/** A stand-in canvas that writes down the words drawn on it and how many calls it got. */
class DrawingLog {
  readonly texts: string[] = [];
  calls = 0;
  fillStyle: unknown = '';
  strokeStyle: unknown = '';
  lineWidth = 1;
  lineCap = 'butt';
  globalAlpha = 1;
  font = '';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  private readonly count = () => {
    this.calls++;
  };
  save = this.count;
  restore = this.count;
  scale = this.count;
  translate = this.count;
  rotate = this.count;
  beginPath = this.count;
  closePath = this.count;
  moveTo = this.count;
  lineTo = this.count;
  quadraticCurveTo = this.count;
  arc = this.count;
  ellipse = this.count;
  rect = this.count;
  roundRect = this.count;
  fillRect = this.count;
  fill = this.count;
  stroke = this.count;
  clip = this.count;
  createLinearGradient = () => ({ addColorStop: this.count });
  fillText = (text: string) => {
    this.calls++;
    this.texts.push(text);
  };
}

/** A fresh stand-in canvas, as the drawing code takes it. */
function canvas() {
  const fake = new DrawingLog();
  return {
    ctx: fake as unknown as CanvasRenderingContext2D,
    texts: fake.texts,
    calls: () => fake.calls,
  };
}

/** Draws a frame at `time`, with a tap at `x`, `y` in the 0 to 100 units if given. */
function frame(time: number, tap?: [number, number]) {
  const drawn = canvas();
  const pointer = tap && {
    x: (tap[0] / 100) * SIZE,
    y: (tap[1] / 100) * SIZE,
    down: true,
    presses: 1,
  };
  attraction.draw(drawn.ctx, SIZE, time, pointer);
  return drawn;
}

describe('AI DevCon', () => {
  it('is the North Pole attraction ai-devcon', () => {
    expect(attraction.id).toBe('ai-devcon');
    expect(attraction.name).toBe('AI DevCon');
    expect(attraction.description.length).toBeGreaterThan(20);
  });

  it('plays its demo with nobody there, says how to play and where tickets are', () => {
    let texts: string[] = [];
    for (let t = 0; t <= 9_000; t += 250) texts = texts.concat(frame(t).texts);
    expect(texts).toContain('Keep the room buzzing');
    expect(texts).toContain('Tap to play');
    expect(texts).toContain(EVENT.tickets);
    expect(texts).toContain(TALKS[0]?.title);
    expect(attraction.ask?.()).toBeUndefined();
  });

  it('starts a round on a tap, hands out a badge, and draws it being played', () => {
    const start = frame(10_000, [50, 70]);
    expect(start.calls()).toBeGreaterThan(500);
    let texts: string[] = [];
    for (let t = 10_100; t <= 14_000; t += 100) texts = texts.concat(frame(t).texts);
    expect(texts).toContain('ATTENDEE');
    expect(texts).toContain('Talk 1 of 6');
  });

  it('asks the page for the tickets, once, after a tap on the tickets sign', () => {
    frame(15_000, [SIGN.x + SIGN.w / 2, SIGN.y + SIGN.h / 2]);
    expect(attraction.ask?.()).toEqual({ open: 0 });
    expect(attraction.ask?.()).toBeUndefined();
  });

  it('goes quiet when nobody keeps the hype up, and shows the end card', () => {
    let texts: string[] = [];
    for (let t = 15_100; t <= 45_000; t += 200) texts = texts.concat(frame(t).texts);
    expect(texts).toContain('The room went quiet');
    expect(texts).toContain(EVENT.when);
    expect(texts).toContain('Tap anywhere else to play again');
  });
});

describe('the end card', () => {
  it('shows a standing ovation, the score, the dates and the big tickets button', () => {
    const drawn = canvas();
    const won: Game = { ...newGame(0), mode: 'won', endedAt: 0, score: 420, best: 420 };
    screen(drawn.ctx, won, 2_000);
    expect(drawn.texts).toContain('Standing ovation!');
    expect(drawn.texts).toContain('Score 420 · Best 420');
    expect(drawn.texts).toContain(EVENT.tickets);
  });
});

describe('the keynote', () => {
  it('has six talks of three points, each with a speaker and no names', () => {
    expect(TALKS).toHaveLength(6);
    for (const talk of TALKS) expect(talk.speaker).toMatch(/^an? /);
    expect(talkOf(99)).toBe(TALKS[0]);
  });

  it('moves on a talk every few good questions, a point at a time', () => {
    expect(talkAfter(0)).toBe(0);
    expect(talkAfter(PER_TALK)).toBe(1);
    expect(talkAfter(KEYNOTE)).toBe(TALKS.length - 1);
    expect([0, 1, 2, 3, 4].map(pointsShown)).toEqual([0, 1, 2, 3, 3]);
    expect(pointsShown(KEYNOTE)).toBe(3);
  });

  it('says what the billboard says about the conference', () => {
    expect(EVENT).toMatchObject({
      title: 'AI DevCon',
      next: 'Next in London',
      when: '7–8 June 2027 · The Brewery',
    });
    expect(EVENT.when).toBe(`${EVENT.date} · ${EVENT.place}`);
  });
});

describe('the small touches', () => {
  it('drop the badge in, swing it, settle it and put it away', () => {
    expect(badgeSwing(-1)).toBeUndefined();
    expect(badgeSwing(BADGE_FOR)).toBeUndefined();
    const settled = badgeSwing(DROP * 4);
    expect(settled?.reach).toBeCloseTo(14);
    expect(Math.abs(settled?.angle ?? 1)).toBeLessThan(0.1);
    expect(badgeSwing(0)?.reach).toBe(-40);
  });

  it('fly the mic from its stand to whoever gets it', () => {
    const stand = micAt([], 0);
    const cheers = [{ seat: 3, at: 1_000 }];
    expect(micAt(cheers, 1_000)).toEqual(stand);
    expect(micAt(cheers, 1_200).y).toBeLessThan(stand.y);
    expect(micAt(cheers, 1_500)).not.toEqual(stand);
    expect(micAt(cheers, 9_000)).toEqual(stand);
    expect(micAt([{ seat: 999, at: 1_000 }], 1_200)).toEqual(stand);
  });

  it('colour the wait and the hype from mint down to berry', () => {
    expect(new Set([waitColor(0.9), waitColor(0.4), waitColor(0.1)]).size).toBe(3);
    expect(new Set([hypeColor(90), hypeColor(45), hypeColor(10)]).size).toBe(3);
  });

  it("switch the demo's screen between how to play and the talk", () => {
    expect(howToShows(1_000)).toBe(true);
    expect(howToShows(8_000)).toBe(false);
  });
});
