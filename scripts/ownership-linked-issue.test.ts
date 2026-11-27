import { describe, expect, it } from 'vitest';
import { linkedIssue } from './ownership';

/**
 * Which issue a pull request is for, at its edges: the factory's marker with
 * every spacing and name it accepts, each closing word, and everything that
 * only looks like one. A slip here gives a pull request to the wrong person.
 */
const REPO = 'AINativeDev/Carnival-Factory';
const marker = (target: string) => `<!-- tessl-factory:issue: ${target} -->`;

describe('linkedIssue at its edges', () => {
  it('reads a marker with any spacing, and a repository named in any case', () => {
    expect(linkedIssue(`<!--tessl-factory:issue:${REPO}#5-->`, REPO)).toBe(5);
    expect(linkedIssue(`<!--  tessl-factory:issue:   ${REPO}#5   -->`, REPO)).toBe(5);
    expect(linkedIssue(marker('ainativedev/carnival-factory#6'), REPO)).toBe(6);
    expect(linkedIssue(marker('my.org/my_repo-2#7'), 'My.Org/My_Repo-2')).toBe(7);
    expect(linkedIssue(`${marker(`${REPO}#123`)}\n`, REPO)).toBe(123);
  });

  it('never reads a marker that is not one', () => {
    expect(linkedIssue(marker(`${REPO}#x`), REPO)).toBeUndefined();
    expect(linkedIssue(marker(`#5`), REPO)).toBeUndefined();
    expect(linkedIssue(marker(`AINativeDev#5`), REPO)).toBeUndefined();
    expect(linkedIssue(`<!-- tessl-factory:issue ${REPO}#5 -->`, REPO)).toBeUndefined();
    expect(linkedIssue(`<!-- tessl-factory:issue: ${REPO}#5 ->`, REPO)).toBeUndefined();
    expect(linkedIssue(`<!- tessl-factory:issue: ${REPO}#5 -->`, REPO)).toBeUndefined();
  });

  it('gives up on two markers, even for one issue, and on one for another repository', () => {
    const twice = `${marker(`${REPO}#5`)}\n${marker(`${REPO}#5`)}`;
    expect(linkedIssue(twice, REPO)).toBeUndefined();
    expect(linkedIssue(`${marker(`${REPO}#5`)}\n${marker('someone/else#5')}`, REPO)).toBe(
      undefined,
    );
    expect(linkedIssue(`${marker('someone/else#5')}\nCloses #5`, REPO)).toBeUndefined();
  });

  it.each([
    'close',
    'closes',
    'closed',
    'fix',
    'fixes',
    'fixed',
    'resolve',
    'resolves',
    'resolved',
    'CLOSES',
    'Resolved',
  ])('reads "%s #9" as the issue it closes', (word) => {
    expect(linkedIssue(`${word} #9`, REPO)).toBe(9);
    expect(linkedIssue(`It ${word}   #9.`, REPO)).toBe(9);
  });

  it('never reads a closing word inside another word, or a reference without its number', () => {
    expect(linkedIssue('enclose #9', REPO)).toBeUndefined();
    expect(linkedIssue('closesy #9', REPO)).toBeUndefined();
    expect(linkedIssue('closes#9', REPO)).toBeUndefined();
    expect(linkedIssue('closes #', REPO)).toBeUndefined();
    expect(linkedIssue('closes # 9', REPO)).toBeUndefined();
    expect(linkedIssue('closes 9', REPO)).toBeUndefined();
    expect(linkedIssue('closes #9x', REPO)).toBeUndefined();
    expect(linkedIssue('fixd #9', REPO)).toBeUndefined();
    expect(linkedIssue('closes #42 and fixes #7', REPO)).toBeUndefined();
    expect(linkedIssue('', REPO)).toBeUndefined();
  });

  it('reads the whole number', () => {
    expect(linkedIssue('Closes #1234', REPO)).toBe(1234);
  });
});
