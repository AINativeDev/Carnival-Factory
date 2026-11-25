import { describe, expect, it } from 'vitest';
import { testBoardLines, type TestReport } from './control-panel';

describe('testBoardLines', () => {
  const report: TestReport = {
    test: { spin: 5_000, wobble: 1 },
    since: 1_000,
    stage: 'spin',
    progress: 0.5,
    demo: false,
    best: 0,
  };

  it('asks for parts before anything was let go', () => {
    expect(testBoardLines({ ...report, test: null, stage: 'done', progress: 1 })).toEqual([
      'PICK PARTS',
      'THEN SPIN',
    ]);
  });

  it('says it is testing while the top hops to the mat', () => {
    expect(testBoardLines({ ...report, stage: 'carry' })).toEqual(['TESTING...', '']);
  });

  it('counts the spin while it spins, then rates it with the best so far', () => {
    expect(testBoardLines(report)).toEqual(['2.5s', '']);
    expect(testBoardLines({ ...report, stage: 'rest', best: 6_200 })).toEqual([
      '5.0s WOBBLY',
      'BEST 6.2s',
    ]);
  });

  it("invites a visitor in during the elf's own round", () => {
    expect(testBoardLines({ ...report, demo: true })).toEqual(['2.5s', 'TAP TO BUILD']);
    expect(testBoardLines({ ...report, demo: true, since: -100 })).toEqual([
      'TAP A PART',
      'TO BUILD',
    ]);
  });
});
