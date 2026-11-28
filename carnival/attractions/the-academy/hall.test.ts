import { describe, expect, it } from 'vitest';
import { BAYS, bayOf, cameraAt, PAN, spotOf, ticketAt } from './camera';
import { hintFor } from './footer';
import { eyebrowFor } from './header';
import { shake } from './juice';
import { newVisit, type Visit } from './state';
import { STEPS } from './steps';
import { SLAM, ticketLook } from './traveller';

const stepOf = (kind: string) => STEPS.findIndex((step) => step.kind === kind);
const visitAt = (kind: string, changes: Partial<Visit> = {}): Visit => ({
  ...newVisit(0),
  step: stepOf(kind),
  from: stepOf(kind),
  ...changes,
});

describe('the hall', () => {
  it('gives each station a bay of its own, in order, with the entrance first', () => {
    const bays = STEPS.map((step) => bayOf(step.kind));
    expect(bays.at(0)).toBe(0);
    expect(bays).toEqual([...bays].sort((a, b) => a - b));
    expect(new Set(bays).size).toBe(BAYS);
    for (const step of STEPS) if (step.station > 0) expect(bayOf(step.kind)).toBe(step.station);
  });

  it('slides the camera from the bay the visitor came from, and stays put within a bay', () => {
    const walked = visitAt('build', { from: stepOf('assess') });
    expect(cameraAt(walked, 0)).toBe(200);
    expect(cameraAt(walked, PAN / 2)).toBe(250);
    expect(cameraAt(walked, PAN * 2)).toBe(300);
    const back = visitAt('assess', { from: stepOf('build') });
    expect(cameraAt(back, 0)).toBe(300);
    expect(cameraAt(visitAt('look', { from: stepOf('booth') }), 0)).toBe(100);
  });

  it('walks the ticket from its last spot with a hop, or pops it in where it had none', () => {
    const walked = visitAt('build', { from: stepOf('assess') });
    expect(ticketAt(walked, PAN)).toMatchObject({ ...spotOf('build'), grow: 1 });
    const halfway = ticketAt(walked, PAN / 4);
    expect(halfway?.y).toBeLessThan(spotOf('build')?.y ?? 0);
    const gone = visitAt('live', { from: stepOf('gate') });
    expect(ticketAt(gone, PAN)?.x).toBe(spotOf('live')?.x);
    expect(ticketAt(visitAt('booth'), 0)).toBeUndefined();
    expect(ticketAt(visitAt('repo'), 0)).toBeUndefined();
    const born = visitAt('ticket', { from: stepOf('look') });
    expect(ticketAt(born, 0)?.grow).toBe(0);
    expect(ticketAt(born, 1_000)?.grow).toBe(1);
    const fromCards = visitAt('assess', { from: stepOf('look') });
    expect(ticketAt(fromCards, PAN / 2)?.grow).toBe(0);
  });
});

describe('the ticket', () => {
  it('picks up booth-request, then tessl and the ACCEPTED stamp once the elf’s stamp lands', () => {
    expect(ticketLook(newVisit(0), 0)).toEqual({ labels: [], stamp: 0 });
    expect(ticketLook(visitAt('ticket'), 0).labels).toEqual(['booth-request']);
    expect(ticketLook(visitAt('assess'), 5_000).stamp).toBe(0);
    expect(ticketLook(visitAt('assess', { beat: 1 }), SLAM - 1).stamp).toBe(0);
    expect(ticketLook(visitAt('assess', { beat: 1 }), SLAM)).toEqual({
      labels: ['booth-request', 'tessl'],
      stamp: 1,
    });
    expect(ticketLook(visitAt('gate'), 0).labels).toEqual(['booth-request', 'tessl']);
    expect(ticketLook(visitAt('live'), 0)).toEqual({ labels: ['tessl'], stamp: 1 });
  });
});

describe('the words round the scene', () => {
  it('say which station the ticket is at, in the eyebrow', () => {
    expect(eyebrowFor(0)).toBe('7 stations, 1 ticket');
    expect(eyebrowFor(stepOf('checks'))).toBe('Station 4 of 7 · Check');
    expect(eyebrowFor(stepOf('repo'))).toBe('After the map');
    expect(eyebrowFor(99)).toBe('7 stations, 1 ticket');
  });

  it('name the tap and the key that go on, in the hint', () => {
    expect(hintFor(newVisit(0))).toBe('Tap or → to start');
    expect(hintFor(visitAt('look'))).toBe('Tap a card, or → for a surprise');
    expect(hintFor(visitAt('checks', { squashed: [0] }))).toBe('Tap a bug, or → to squash one');
    expect(hintFor(visitAt('checks', { squashed: [0, 1, 2] }))).toBe('Tap or → to go on');
    expect(hintFor(visitAt('repo'))).toBe('Tap or → to start over');
    expect(hintFor(visitAt('review'))).toBe('Tap or → to go on');
  });
});

describe('the juice', () => {
  it('shakes only for a moment, dying away, and never before it starts', () => {
    expect(shake(-1, 1)).toEqual({ x: 0, y: 0 });
    expect(shake(320, 1)).toEqual({ x: 0, y: 0 });
    const early = shake(20, 1);
    const late = shake(280, 1);
    expect(Math.hypot(early.x, early.y)).toBeGreaterThan(Math.hypot(late.x, late.y));
    expect(Math.hypot(early.x, early.y)).toBeLessThanOrEqual(1.2);
  });
});
