// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  BADGE_REQUEST_URL,
  BOOTH_REQUEST_URL,
  CHANGE_URL,
  CLAIM_URL,
  LEVEL_REQUEST_URL,
} from './northpole/links';
import { fillVisitHelp } from './visit-help';
import { switchFlags } from './test-support/feature-flags';

/** A panel's help box, and the season link it holds once it's filled. */
function helpBox() {
  const box = document.createElement('div');
  const season = {
    get href() {
      return box.querySelector('.visit-season')?.getAttribute('href');
    },
  };
  return { box, season, element: box };
}

describe('fillVisitHelp', () => {
  it("offers a booth's owner a change, sharing it as theirs, and their season", () => {
    const { box, season, element } = helpBox();
    fillVisitHelp(element, 'booth', 'ana');
    expect(box.innerHTML).toContain(CHANGE_URL);
    expect(box.innerHTML).toContain('Share it as yours');
    expect(season.href).toBe('#/season/ana');
  });

  it('offers a booth of your own beside an attraction, and from a level', () => {
    const attraction = helpBox();
    fillVisitHelp(attraction.element, 'attraction', 'big-top');
    expect(attraction.box.innerHTML).toContain('only its maintainers change them');
    expect(attraction.box.innerHTML).toContain(CLAIM_URL);
    const level = helpBox();
    fillVisitHelp(level.element, 'attraction', 'hut', 'bo');
    expect(level.box.innerHTML).toContain("participant's own level");
  });

  it("offers a level's owner a change, and says the North Pole's own levels are its maintainers'", () => {
    const mine = helpBox();
    fillVisitHelp(mine.element, 'level', 'bo');
    expect(mine.box.innerHTML).toContain(LEVEL_REQUEST_URL);
    expect(mine.box.innerHTML).toContain('Ask for a change');
    const northPole = helpBox();
    fillVisitHelp(northPole.element, 'level', 'the-factory');
    expect(northPole.box.innerHTML).toContain('only its maintainers change it');
    expect(northPole.box.innerHTML).toContain(CLAIM_URL);
  });

  it("takes the sleigh in from a landmark's room", () => {
    const landmark = helpBox();
    fillVisitHelp(landmark.element, 'attraction', 'the-factory');
    expect(landmark.box.innerHTML).toContain('href="#/level/the-factory"');
  });

  it("tells a Factory stall's step of the tour, with its link", () => {
    const stall = helpBox();
    fillVisitHelp(stall.element, 'attraction', 'letter-box', 'the-factory');
    expect(stall.box.innerHTML).toContain('booth form');
    expect(stall.box.innerHTML).toContain(BOOTH_REQUEST_URL);
    expect(stall.box.innerHTML).toContain('#/factory');
    const workshop = helpBox();
    fillVisitHelp(workshop.element, 'attraction', 'workshop', 'the-factory');
    expect(workshop.box.innerHTML).toContain('carnival/booths/&lt;login&gt;/');
    const unknown = helpBox();
    fillVisitHelp(unknown.element, 'attraction', 'storeroom', 'the-factory');
    expect(unknown.box.innerHTML).toContain('North Pole’s own level');
  });
});

describe("the factory line in a booth's help, by feature flag", () => {
  const line = () => {
    const { box } = helpBox();
    fillVisitHelp(box, 'booth', 'ana');
    return box.innerHTML;
  };

  it('is left out while the Elf Engineer badge and the advent calendar are off', () => {
    expect(line()).not.toContain('Built your own factory?');
  });

  describe('with the advent calendar on', () => {
    switchFlags({ advent: true });
    it('offers only the advent calendar', () => {
      expect(line()).toContain('href="#/advent"');
      expect(line()).not.toContain(BADGE_REQUEST_URL);
    });
  });

  describe('with both on', () => {
    switchFlags({ advent: true, elfEngineer: true });
    it('offers the badge and the advent calendar', () => {
      expect(line()).toContain(BADGE_REQUEST_URL);
      expect(line()).toContain('href="#/advent"');
    });
  });
});
