import { describe, expect, it } from 'vitest';
import { RIDE_LEVEL, RIDE_TRACK } from '../test-support/ride-fixtures';
import { rideLevelProblems, rideProblems } from './coaster-rules';
import type { LevelProp, NorthPoleLevel } from './level';
import type { Stand } from './level-check-places';

describe('the rules of a coaster', () => {
  const prop = (kind: LevelProp['kind'], x: number, y: number): LevelProp => ({ kind, x, y });

  it('passes a ride whose pieces join, with its loops on straight runs', () => {
    expect(
      rideProblems([
        prop('coaster', 0, 0),
        prop('pine', 9, 9),
        prop('coaster-loop', 0, 1),
        prop('coaster', 0, 2),
        prop('coaster', 1, 2),
      ]),
    ).toEqual([]);
    expect(rideProblems([])).toEqual([]);
  });

  it("finds a piece that doesn't join the one before it, and a loop on a corner", () => {
    expect(
      rideProblems([
        prop('coaster', 0, 0),
        prop('coaster', 2, 0),
        prop('coaster-loop', 3, 0),
        prop('coaster', 3, 1),
      ]),
    ).toEqual([
      "prop 1, a coaster, doesn't join prop 0, the coaster piece before it",
      'prop 2, a coaster-loop, must stand on a straight run of track',
    ]);
  });
});

describe('the rules of a ride level', () => {
  /** The test level's squares' and sleigh home's doors, as the check finds them. */
  const STANDS: Stand[] = [
    { what: 'square "skates"', box: { x: 1, y: 2, w: 2, h: 2 }, door: { x: 3, y: 2 } },
    { what: 'square "cocoa"', box: { x: 6, y: 5, w: 2, h: 2 }, door: { x: 8, y: 5 } },
    { what: 'exit 0', box: { x: 1, y: 7, w: 2, h: 2 }, door: { x: 3, y: 7 } },
  ];
  const riding = (change: Partial<NorthPoleLevel>) => ({ ...RIDE_LEVEL, ...change });

  it('passes a ride that runs round from where visitors arrive, with a station at every door', () => {
    expect(rideLevelProblems(RIDE_LEVEL, STANDS)).toEqual([]);
  });

  it('asks nothing of a level that is walked', () => {
    const walked: NorthPoleLevel = { ...RIDE_LEVEL };
    delete walked.ride;
    expect(rideLevelProblems(walked, [])).toEqual([]);
    expect(rideLevelProblems(riding({ ride: false }), [])).toEqual([]);
  });

  it('wants ride to be true or false', () => {
    expect(rideLevelProblems(riding({ ride: 'yes' as unknown as boolean }), STANDS)).toEqual([
      'its ride must be true or false',
    ]);
  });

  it('wants the track to start with a station', () => {
    const plain = RIDE_TRACK.map((prop): LevelProp => ({ ...prop, kind: 'coaster' }));
    expect(rideLevelProblems(riding({ props: plain }), STANDS)).toEqual([
      "a ride level's track must start with a coaster-station",
    ]);
    const bare: NorthPoleLevel = { ...RIDE_LEVEL };
    delete bare.props;
    expect(rideLevelProblems(bare, STANDS)).toEqual([
      "a ride level's track must start with a coaster-station",
    ]);
  });

  it('wants visitors to arrive at the first station, and the track to run round', () => {
    expect(
      rideLevelProblems(
        riding({ arrival: { x: 4, y: 4 }, props: RIDE_TRACK.slice(0, -2) }),
        STANDS,
      ),
    ).toEqual([
      'visitors must arrive on the first coaster-station',
      "a ride level's track must run round: its last piece must join its first",
    ]);
    const short = RIDE_TRACK.slice(0, 2);
    expect(rideLevelProblems(riding({ props: short }), [])).toContain(
      "a ride level's track must run round: its last piece must join its first",
    );
  });

  it('wants every station at a door, and every door with a station', () => {
    const astray = RIDE_TRACK.map((prop): LevelProp =>
      prop.x === 8 && prop.y === 5 ? { ...prop, kind: 'coaster' } : prop,
    ).map((prop): LevelProp =>
      prop.x === 8 && prop.y === 7 ? { ...prop, kind: 'coaster-station' } : prop,
    );
    expect(rideLevelProblems(riding({ props: astray }), STANDS)).toEqual([
      "prop 17, a coaster-station, must stand at a square's or an exit's door",
      'square "cocoa" needs a coaster-station at its door',
    ]);
  });
});
