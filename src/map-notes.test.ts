// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { renderUnknown, renderUnknownInLevel } from './map-notes';
import { CLAIM_URL } from './northpole/links';
import { levelOf } from './northpole/levels';

/** A hidden note over the map, inside the page's app. */
function hiddenNote() {
  document.body.innerHTML = '<div id="app"><p class="map-note" hidden></p></div>';
  const app = document.querySelector<HTMLElement>('#app');
  const note = document.querySelector<HTMLElement>('.map-note');
  if (!app || !note) throw new Error('The test page is missing its parts');
  return { app, note };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe("the note for a link to a square that isn't there", () => {
  it('says the North Pole has no such attraction, with the id only as text', () => {
    const { note } = hiddenNote();
    renderUnknown(note, { kind: 'attraction', id: '<b>wheel</b>' });
    expect(note.hidden).toBe(false);
    expect(note.textContent).toBe('The North Pole has no attraction called "<b>wheel</b>".');
    expect(note.children).toHaveLength(0);
  });

  it('offers a booth for a login that has none yet, in a new tab', () => {
    const { note } = hiddenNote();
    renderUnknown(note, { kind: 'booth', id: 'ana' });
    expect(note.hidden).toBe(false);
    expect(note.textContent).toBe("There's no booth for @ana yet. Get a booth");
    const link = note.querySelector('a');
    expect([link?.href, link?.target, link?.rel, link?.textContent]).toEqual([
      CLAIM_URL,
      '_blank',
      'noopener',
      'Get a booth',
    ]);
  });
});

describe("a level's note for a link to a square it hasn't got", () => {
  it('names the level, and cuts a long id at 40 characters', () => {
    const { app, note } = hiddenNote();
    renderUnknownInLevel(app, 'jedi4ever', `${'x'.repeat(40)}yz`);
    expect(note.hidden).toBe(false);
    expect(note.textContent).toBe(
      `${levelOf('jedi4ever')?.name ?? ''} has no square called "${'x'.repeat(40)}".`,
    );
  });

  it('names the login when it has no level', () => {
    const { app, note } = hiddenNote();
    renderUnknownInLevel(app, 'nobody', 'stall');
    expect(note.textContent).toBe('nobody has no square called "stall".');
  });
});
