import { describe, expect, it } from 'vitest';
import { branchIssue, countFindings, decisionOf, squaresTouched } from './github-requests.ts';
import { pull, thread } from './test-support/github-requests.ts';

describe('squaresTouched', () => {
  it('finds the booths and attractions a change touches, once each', () => {
    expect(
      squaresTouched([
        'carnival/booths/Ana/booth.ts',
        'carnival/booths/ana/README.md',
        'carnival/attractions/ferris-wheel/attraction.ts',
        'src/northpole/map.ts',
        'carnival/booths/README.md',
      ]),
    ).toEqual(['attraction/ferris-wheel', 'booth/ana']);
  });
  it('reads pull requests from before the squares moved into carnival/', () => {
    expect(squaresTouched(['booths/ana/booth.ts', 'attractions/big-top/attraction.ts'])).toEqual([
      'attraction/big-top',
      'booth/ana',
    ]);
  });
  it("finds a level from any file in its folder, its squares' too", () => {
    expect(squaresTouched(['carnival/levels/Ana/squares/igloo/square.ts'])).toEqual(['level/ana']);
  });
});

describe('branchIssue', () => {
  it('reads the issue from a factory branch, and nothing from any other', () => {
    expect(branchIssue('tessl/issue-76')).toBe(76);
    expect(branchIssue('answer-by-reply')).toBeUndefined();
    expect(branchIssue('tessl/issue-76-copy')).toBeUndefined();
  });
});

describe('decisionOf', () => {
  it('tells what the assessment decided', () => {
    expect(decisionOf(['booth-request', 'declined'], false)).toBe('declined');
    expect(decisionOf(['booth-request', 'needs-info'], false)).toBe('question');
    expect(decisionOf(['booth-request', 'tessl'], false)).toBe('accepted');
    expect(decisionOf([], true)).toBe('accepted');
    expect(decisionOf(['booth-request'], false)).toBe('waiting');
  });
});

describe('countFindings', () => {
  it("counts the reviewer's threads, and the resolved ones as fixed", () => {
    const pr = pull(1, 'tessl/issue-1', [], {
      reviewThreads: {
        nodes: [
          thread('tessl-reviewer', true),
          thread('tessl-reviewer[bot]', false),
          thread('someone', true),
        ],
      },
    });
    expect(countFindings(pr)).toEqual({ findings: 2, fixed: 1 });
  });
});

describe('the edges of what is read off a request', () => {
  it('finds squares and factory branches only from the start', () => {
    expect(squaresTouched(['docs/booths/ana/booth.ts'])).toEqual([]);
    expect(branchIssue('old-tessl/issue-5')).toBeUndefined();
  });

  it('takes [bot] off the end of a login only, and passes over threads with no author', () => {
    const odd = (login: string | null, comments = true) => ({
      isResolved: false,
      comments: { nodes: comments ? [{ author: login === null ? null : { login } }] : [] },
    });
    const threads = [odd('[bot]tessl-reviewer'), odd(null), odd('x', false)];
    expect(
      countFindings(pull(1, 'tessl/issue-1', [], { reviewThreads: { nodes: threads } })),
    ).toEqual({ findings: 0, fixed: 0 });
  });
});
