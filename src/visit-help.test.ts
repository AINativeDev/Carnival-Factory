import { describe, expect, it } from 'vitest';
import { CHANGE_URL, CLAIM_URL } from './northpole/links';
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
});
