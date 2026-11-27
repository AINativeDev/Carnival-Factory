import { describe, expect, it } from 'vitest';
import {
  advance,
  DEMO_ROUNDS,
  GUARD,
  HOME,
  IDLE,
  newEcho,
  nextRound,
  phaseOf,
  timeline,
  type Echo,
} from './echo';
import { instruction, scoreOf } from './hud';
import { lightOf, slotOf, swapOf, TAP_GLOW, whereIs } from './light';
import { SLOTS, slotAt } from './slots';
import { CHEER, LEAD, stepOf, SWAP, SWAP_FROM } from './tune';

/** Where note `note` sits for the echo, on the house. */
const placeOf = (echo: Echo, note: number) =>
  SLOTS.at(echo.places.at(note) ?? 0)?.at ?? { x: 0, y: 0 };

/** Taps the next note of the tune right, at `time`. */
const right = (echo: Echo, time: number) => {
  const at = placeOf(echo, echo.tune.at(echo.echoed) ?? 0);
  return advance(echo, time, at.x, at.y, 1);
};

/** Plays a visitor's game right through `rounds` rounds, from `time`; returns the game and the time. */
function playRounds(rounds: number, from = 0): { echo: Echo; time: number } {
  let time = from;
  let echo = advance(newEcho(time, 'demo', 0), time, 50, 50, 1);
  for (let round = 0; round < rounds; round++) {
    time = timeline(echo).echo;
    for (let n = 0; n < echo.tune.length; n++) echo = right(echo, (time += 10));
    time += CHEER;
    echo = advance(echo, time);
  }
  return { echo, time };
}

describe('a game', () => {
  it('starts with a tap on the demo: a tune of two notes, the house playing first', () => {
    const echo = advance(newEcho(0, 'demo', 0), 100, 50, 50, 3);
    expect(echo.mode).toBe('play');
    expect(echo.tune).toHaveLength(2);
    expect(phaseOf(echo, 200)).toBe('show');
    expect(phaseOf(echo, timeline(echo).echo)).toBe('echo');
    expect(instruction(echo, 'show')).toBe('Watch the house…');
  });

  it('ignores taps while the house plays, and taps off the notes', () => {
    const echo = advance(newEcho(0, 'demo', 0), 0, 50, 50, 1);
    const early = right(echo, LEAD);
    expect(early.echoed).toBe(0);
    expect(early.taps.at(-1)?.kind).toBe('idle');
    const off = advance(echo, timeline(echo).echo, 2, 2, 1);
    expect(off.mode).toBe('play');
    expect(off.taps.at(-1)?.kind).toBe('idle');
  });

  it('adds a note each round, sticks a treat for each right one and keeps the best', () => {
    const { echo } = playRounds(3);
    expect(echo.round).toBe(4);
    expect(echo.tune).toHaveLength(5);
    expect(echo.best).toBe(3);
    expect(echo.treats.count).toBe(2 + 3 + 4);
    expect(scoreOf(echo)).toBe(3);
  });

  it('lets a new note join on its first round, and the mirrors swap two from round 4', () => {
    const { echo } = playRounds(SWAP_FROM - 1);
    expect(echo.round).toBe(SWAP_FROM);
    const moved = echo.before.filter((slot, note) => slot !== echo.places.at(note));
    expect(moved).toHaveLength(2);
    const { played, echo: from } = timeline(echo);
    expect(from - played).toBe(SWAP);
    expect(phaseOf(echo, played + 10)).toBe('swap');
    expect(instruction(echo, 'swap')).toContain('mirrors');
    const joined = playRounds(4).echo;
    expect(joined.tune.at(-1)).toBe(4);
    expect(instruction(joined, 'show')).toContain('new note');
  });

  it('ends on a wrong note, shows the one it should have been, and waits before a new game', () => {
    const { echo: playing, time } = playRounds(2);
    const at = timeline(playing).echo + 10;
    const wanted = playing.tune.at(0) ?? 0;
    const wrong = [0, 1, 2, 3].find((note) => note !== wanted) ?? 0;
    const spot = placeOf(playing, wrong);
    const lost = advance(playing, at, spot.x, spot.y, 1);
    expect(time).toBeGreaterThan(0);
    expect(lost.mode).toBe('over');
    expect(phaseOf(lost, at)).toBe('over');
    expect(lost.missed).toBe(wanted);
    expect(scoreOf(lost)).toBe(2);
    expect(lightOf(lost, wanted, at + 1200)).toBeGreaterThan(0.2);
    expect(advance(lost, at + GUARD / 2, 50, 50, 1).mode).toBe('over');
    const again = advance(lost, at + GUARD, 50, 50, 1);
    expect(again.mode).toBe('play');
    expect(again.best).toBe(2);
    expect(again.places).toEqual(lost.places);
  });

  it('goes back to the demo once a visitor has left', () => {
    const echo = advance(newEcho(0, 'demo', 0), 0, 50, 50, 1);
    expect(advance(echo, IDLE + 10).mode).toBe('demo');
  });
});

describe('the demo', () => {
  it('echoes its own tunes and starts again after a few rounds', () => {
    let echo = newEcho(0, 'demo', 0);
    let rounds = 0;
    for (let time = 0; time < 120_000; time += 50) {
      const next = advance(echo, time);
      if (next.round > echo.round) rounds = Math.max(rounds, next.round);
      echo = next;
    }
    expect(rounds).toBe(DEMO_ROUNDS);
    expect(echo.mode).toBe('demo');
    expect(echo.best).toBe(0);
  });
});

describe('the lights and the mirrors', () => {
  it('lights each note of the tune in turn as the house plays it', () => {
    const echo = { ...newEcho(0, 'play', 0), tune: [2, 0] };
    const step = stepOf(1);
    expect(lightOf(echo, 2, LEAD + step * 0.17)).toBeCloseTo(1);
    expect(lightOf(echo, 0, LEAD + step * 0.17)).toBe(0);
    expect(lightOf(echo, 0, LEAD + step * 1.17)).toBeCloseTo(1);
  });

  it('lights a note you tap, and every note in the cheer', () => {
    const { echo, time } = playRounds(1);
    expect(echo.round).toBe(2);
    const before = { ...echo, doneAt: time - 400, round: 1 };
    expect(lightOf(before, 0, time)).toBeGreaterThan(0);
    const tapped = right(echo, timeline(echo).echo);
    const note = tapped.taps.at(-1)?.note ?? 0;
    expect(lightOf(tapped, note, timeline(echo).echo + TAP_GLOW * 0.2)).toBeCloseTo(1);
  });

  it('carries a swapped pair through the mirrors on arcs, landing in each other’s place', () => {
    const { echo } = playRounds(SWAP_FROM - 1);
    const { played } = timeline(echo);
    const [a = 0, b = 1] = [0, 1, 2, 3].filter(
      (note) => echo.before.at(note) !== echo.places.at(note),
    );
    expect(slotOf(echo, a, played - 1)).toBe(echo.before.at(a));
    expect(slotOf(echo, a, played + 1)).toBe(echo.places.at(a));
    expect(swapOf(echo, played + SWAP)).toBe(1);
    const half = played + SWAP / 2;
    expect(whereIs(echo, a, half).moving).toBeCloseTo(1);
    expect(whereIs(echo, a, half).at).not.toEqual(whereIs(echo, b, half).at);
    expect(whereIs(echo, a, played + SWAP).at).toEqual(SLOTS.at(echo.places.at(a) ?? 0)?.at);
  });

  it('finds the nearest place in use under a tap, or none', () => {
    const door = SLOTS.at(1)?.at ?? { x: 0, y: 0 };
    expect(slotAt(door.x, door.y + 3, HOME.slice(0, 4))).toBe(1);
    expect(slotAt(door.x, door.y, [0, 2])).toBe(-1);
    expect(slotAt(2, 2, HOME)).toBe(-1);
  });

  it('keeps the next round’s notes where the mirrors left them', () => {
    const echo = nextRound({ ...newEcho(0, 'play', 0), round: SWAP_FROM }, 5_000);
    expect(echo.before).toEqual(HOME);
    expect(echo.roundAt).toBe(5_000);
  });
});
