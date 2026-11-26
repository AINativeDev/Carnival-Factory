import { describe, expect, it } from 'vitest';
import theAcademy from './attraction';
import { CARDS, SIGN } from './layout';
import { ROUND, roundOf } from './questions';
import { CARDS_UP } from './quiz';
import { CHEER, LIMIT, REVEAL } from './state';

const SIZE = 600;

/** A canvas that draws nothing, measures every character a unit wide and keeps the words it was given. */
function stubCanvas() {
  const calls = { count: 0, texts: [] as string[] };
  const drawn = () => {
    calls.count++;
  };
  const quiet = {
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    fillText(text: string) {
      drawn();
      calls.texts.push(text);
    },
    measureText(text: string) {
      drawn();
      return { width: text.length };
    },
    createLinearGradient() {
      drawn();
      return { addColorStop: () => undefined };
    },
    ...Object.fromEntries(
      'strokeText save restore translate rotate scale beginPath closePath moveTo lineTo arc arcTo ellipse rect fillRect fill stroke clip'
        .split(' ')
        .map((name) => [name, drawn]),
    ),
  };
  return { ctx: quiet as unknown as CanvasRenderingContext2D, calls };
}

const tapOn = (box: { x: number; y: number; w: number; h: number }) => ({
  x: ((box.x + box.w / 2) / 100) * SIZE,
  y: ((box.y + box.h / 2) / 100) * SIZE,
  down: true,
  presses: 1,
});
const card = (n: number) => tapOn(CARDS[n] ?? { x: 0, y: 0, w: 0, h: 0 });

describe('The Academy', () => {
  it('keeps its id, its name and its schoolhouse on the map', () => {
    expect(theAcademy.id).toBe('the-academy');
    expect(theAcademy.name).toBe('The Academy');
    expect(theAcademy.stall).toEqual({
      shape: 'barn',
      roof: 'berry',
      trim: 'cream',
      landmark: 'schoolhouse',
    });
  });

  it('plays a whole game in its drawing, and asks for the Academy only on the frame its sign is tapped', () => {
    const { ctx, calls } = stubCanvas();
    const draw = (time: number, pointer?: ReturnType<typeof card>) => {
      theAcademy.draw(ctx, SIZE, time, pointer);
    };
    draw(0);
    expect(theAcademy.ask?.()).toBeUndefined();
    expect(calls.texts).toContain('Pop quiz!');
    draw(6_000);
    draw(100, tapOn(SIGN));
    expect(theAcademy.ask?.()).toEqual({ open: 0 });
    expect(theAcademy.ask?.()).toBeUndefined();
    let time = 200;
    draw(time, card(0));
    const questions = roundOf(0);
    for (const [n, question] of questions.entries()) {
      time += 500;
      if (n === 1) {
        draw(time, card((question.right + 1) % 3));
        draw((time += 400));
      }
      if (n === 2) {
        draw((time += LIMIT));
        draw((time += REVEAL / 2));
        draw((time += REVEAL));
        continue;
      }
      draw(time, card(question.right));
      draw((time += 300));
      draw((time += CHEER));
    }
    for (const later of [500, 1_500, CARDS_UP + 200]) draw(time + later);
    expect(calls.texts).toContain('REPORT CARD');
    draw(time + CARDS_UP + 300, tapOn({ x: 50, y: 68, w: 46, h: 22 }));
    expect(theAcademy.ask?.()).toEqual({ open: 0 });
    // A second game, lost: every apple gone on wrong cards, and the report card with its crosses.
    time += CARDS_UP + 400;
    draw(time, tapOn({ x: 4, y: 68, w: 42, h: 22 }));
    const next = roundOf(1);
    for (const [n, question] of next.slice(0, 2).entries()) {
      const wrong = [0, 1, 2].filter((c) => c !== question.right);
      for (const c of n === 0 ? wrong : wrong.slice(0, 1)) draw((time += 300), card(c));
      if (n === 0) draw((time += 300), card(question.right));
      draw((time += 600));
      if (n === 1) expect(calls.texts.some((text) => text.startsWith('Out of apples'))).toBe(true);
      draw((time += CHEER));
    }
    for (const later of [2_000, 4_000]) draw(time + later);
    expect(questions).toHaveLength(ROUND);
    expect(calls.count).toBeGreaterThan(1_000);
  });
});
