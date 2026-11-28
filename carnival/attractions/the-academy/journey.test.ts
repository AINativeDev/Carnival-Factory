import { describe, expect, it } from 'vitest';
import { BUGS, bugPlace } from './bugs';
import { advance, kindOf, LIVE_GUARD } from './journey';
import { ACTION, BACK, type Box, CHOICES, LIVE_NEXT, SCENE } from './layout';
import { BIG_NUDGES, ideaLink, QUIET_NUDGES } from './nudges';
import { IDLE_RESET, newVisit, type Visit } from './state';
import { STEPS } from './steps';

const SIZE = 500;
const NOWHERE: Box = { x: 0, y: 0, w: 0, h: 0 };
/** A tap at `x`, `y` in the square's 0 to 100 units. */
const at = (x: number, y: number) => ({
  x: (x / 100) * SIZE,
  y: (y / 100) * SIZE,
  down: true,
  presses: 1,
});
const on = (box: Box) => at(box.x + box.w / 2, box.y + box.h / 2);
const play = (visit: Visit, pointer: ReturnType<typeof at>, time: number) =>
  advance(visit, time, pointer, SIZE);
const stepOf = (kind: string) => STEPS.findIndex((step) => step.kind === kind);
const visitAt = (kind: string, changes: Partial<Visit> = {}): Visit => ({
  ...newVisit(0),
  step: stepOf(kind),
  playedAt: 0,
  ...changes,
});

describe('the journey', () => {
  it('waits on the first screen for ever, until a tap starts it', () => {
    const first = newVisit(0);
    expect(advance(first, IDLE_RESET * 5, undefined, SIZE).visit).toBe(first);
    expect(advance(first, 10, { ...on(ACTION), presses: 0 }, SIZE).visit).toBe(first);
    expect(advance(first, 10, on(ACTION), 0).visit).toBe(first);
    const started = play(first, on(ACTION), 100).visit;
    expect(started).toMatchObject({ step: 1, beat: 0, at: 100, from: 0, playedAt: 100 });
    expect(kindOf(started)).toBe('booth');
  });

  it('waits on each pick for a card, or picks from the clock with Surprise me', () => {
    const booth = visitAt('booth');
    expect(play(booth, at(50, 10), 5).visit).toMatchObject({ step: booth.step, playedAt: 5 });
    const picked = play(booth, on(CHOICES[2] ?? NOWHERE), 5).visit;
    expect(picked).toMatchObject({ booth: 2, step: stepOf('look') });
    expect(play(picked, on(CHOICES[1] ?? NOWHERE), 6).visit).toMatchObject({ look: 1, booth: 2 });
    expect(play(booth, on(ACTION), 97 * 2).visit.booth).toBe(2);
    expect(play(visitAt('look'), on(ACTION), 97 * 4).visit.look).toBe(1);
  });

  it('goes a beat at a time, by the button or the board, and on to the next step', () => {
    const assess = visitAt('assess');
    const stamped = play(assess, on(ACTION), 10).visit;
    expect(stamped).toMatchObject({ step: assess.step, beat: 1, at: 10 });
    expect(play(stamped, on(SCENE), 20).visit).toMatchObject({ step: stepOf('build'), beat: 0 });
    expect(play(stamped, at(50, 99), 20).visit).toMatchObject({ beat: 1, playedAt: 20 });
  });

  it('squashes the bug tapped, or the next one, and only then moves on', () => {
    const checks = visitAt('checks');
    const bug = bugPlace(1, 50);
    const one = play(checks, at(bug.x, bug.y), 50).visit;
    expect(one).toMatchObject({ squashed: [1], beat: 1 });
    expect(play(one, at(8, 12), 60).visit).toMatchObject({ squashed: [1], beat: 1 });
    const two = play(one, on(ACTION), 70).visit;
    const three = play(two, on(ACTION), 80).visit;
    expect(three).toMatchObject({ squashed: [1, 0, 2], beat: BUGS });
    expect(play(three, on(SCENE), 90).visit.step).toBe(stepOf('review'));
  });

  it('goes back a beat, or a step, the bugs coming back at the checks', () => {
    expect(play(visitAt('gate', { beat: 3 }), on(BACK), 5).visit).toMatchObject({ beat: 2 });
    const review = visitAt('review', { squashed: [0, 1, 2] });
    expect(play(review, on(BACK), 5).visit).toMatchObject({ step: stepOf('checks'), squashed: [] });
    const checks = visitAt('checks', { beat: 2, squashed: [0, 1] });
    expect(play(checks, on(BACK), 5).visit).toMatchObject({ step: stepOf('build'), beat: 0 });
    expect(play(visitAt('booth'), on(BACK), 5).visit.step).toBe(0);
    expect(play(newVisit(0), on(BACK), 5).visit.step).toBe(0);
  });

  it('lights the gate’s lamps a tap each, then rolls onto the map, where a quick tap does nothing', () => {
    let visit = visitAt('gate');
    for (let n = 0; n < 8; n++) visit = play(visit, on(ACTION), n * 10).visit;
    expect(kindOf(visit)).toBe('live');
    expect(play(visit, on(LIVE_NEXT), 70 + LIVE_GUARD / 2).visit.step).toBe(visit.step);
    const repo = play(visit, on(LIVE_NEXT), 70 + LIVE_GUARD).visit;
    expect(kindOf(repo)).toBe('repo');
    const again = play(repo, on(ACTION), 9_000).visit;
    expect(again).toMatchObject({ step: 0, booth: 0, squashed: [], playedAt: 9_000 });
  });

  it('goes on with →, Enter or Space, back with ←, and ignores ↑ and ↓', () => {
    const keyed = (visit: Visit, keys: Parameters<typeof advance>[4], time = 5) =>
      advance(visit, time, undefined, SIZE, keys).visit;
    expect(keyed(newVisit(0), ['right'])).toMatchObject({ step: 1, from: 0, playedAt: 5 });
    expect(keyed(visitAt('assess'), ['enter']).beat).toBe(1);
    expect(keyed(visitAt('assess'), ['space', 'space'])).toMatchObject({ step: stepOf('build') });
    expect(keyed(visitAt('assess'), ['up', 'down'])).toMatchObject({ step: stepOf('assess') });
    const back = keyed(visitAt('build'), ['left']);
    expect(back).toMatchObject({ step: stepOf('assess'), from: stepOf('build') });
    expect(keyed(newVisit(0), ['left'])).toMatchObject({ step: 0, playedAt: 5 });
  });

  it('picks a surprise or squashes the next bug with a key, as the gold button does', () => {
    const picked = advance(visitAt('booth'), 97 * 2, undefined, SIZE, ['right']).visit;
    expect(picked).toMatchObject({ booth: 2, step: stepOf('look') });
    const checks = advance(visitAt('checks'), 5, undefined, SIZE, ['enter', 'enter']).visit;
    expect(checks).toMatchObject({ squashed: [0, 1], beat: 2 });
  });

  it('keeps the map card still for a moment, then a key goes on to your repo and none goes back', () => {
    const live = visitAt('live', { at: 0 });
    const early = advance(live, LIVE_GUARD / 2, undefined, SIZE, ['right']).visit;
    expect(early.step).toBe(live.step);
    expect(advance(live, LIVE_GUARD, undefined, SIZE, ['left']).visit.step).toBe(live.step);
    expect(kindOf(advance(live, LIVE_GUARD, undefined, SIZE, ['right']).visit)).toBe('repo');
    const repo = visitAt('repo');
    expect(kindOf(advance(repo, 5, undefined, SIZE, ['left']).visit)).toBe('live');
  });

  it('comes back to the first screen after a minute with nobody tapping', () => {
    const idle = advance(visitAt('review'), IDLE_RESET + 1, undefined, SIZE).visit;
    expect(idle).toMatchObject({ step: 0, at: IDLE_RESET + 1 });
  });
});

describe('the nudges', () => {
  it('ask the page from the one quiet link during the journey, without moving it', () => {
    const asks = QUIET_NUDGES.map((nudge) => play(visitAt('build'), on(nudge.box), 5));
    expect(asks.map((played) => played.ask)).toEqual([{ open: 0 }]);
    expect(asks.at(0)?.visit).toMatchObject({ step: stepOf('build'), beat: 0, playedAt: 5 });
    expect(play(visitAt('build'), on(ACTION), 5).ask).toBeUndefined();
  });

  it('ask from the big ones on the map card, once it is ready, with the booth form the hero', () => {
    const live = visitAt('live', { at: 0 });
    expect(play(live, on(BIG_NUDGES[0]?.box ?? NOWHERE), 10).ask).toBeUndefined();
    const asks = BIG_NUDGES.map((nudge) => play(live, on(nudge.box), LIVE_GUARD).ask);
    expect(asks).toEqual([
      { open: 5 },
      { open: 0 },
      { visit: 'the-factory' },
      { open: 2 },
      { open: 3 },
      { open: 4 },
    ]);
    expect(BIG_NUDGES.map((nudge) => nudge.rank)).toEqual([
      'hero',
      'button',
      'button',
      'link',
      'link',
      'link',
    ]);
    expect(BIG_NUDGES.at(0)?.label).toBe('Want a real one? Ask for a booth ↗');
    expect(BIG_NUDGES.find((n) => 'visit' in n.ask)?.label).toBe('Why a factory? →');
  });

  it("open the booth form filled in with the ticket's own booth in its own look", () => {
    const hero = on(BIG_NUDGES[0]?.box ?? NOWHERE);
    const ask = (booth: number, look: number) =>
      play(visitAt('live', { at: 0, booth, look }), hero, LIVE_GUARD).ask;
    expect(ask(0, 2)).toEqual({ open: 7 });
    expect(ask(1, 0)).toEqual({ open: 8 });
    expect(ask(2, 1)).toEqual({ open: 12 });
    expect([ideaLink(0, 0), ideaLink(2, 2)]).toEqual([5, 13]);
  });
});
