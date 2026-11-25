import { describe, expect, it } from 'vitest';
import { BOOTH_REQUEST_URL, CHANGE_URL, CLAIM_URL } from './northpole/links';
import { fillVisitHelp } from './visit-help';

/** A help box that keeps its HTML and hands out one season link. */
function helpBox() {
  const season = { href: '' };
  const box = {
    innerHTML: '',
    querySelector: (selector: string) =>
      selector === '.visit-season' && box.innerHTML.includes('visit-season') ? season : null,
  };
  return { box, season, element: box as unknown as Element };
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
