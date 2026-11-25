/**
 * The note over the map for a link to a square that isn't there: on the
 * North Pole, with a way to claim a booth for that login, and in a level.
 * The id comes from the address, so it's only ever set as text.
 */
import { the } from './dom';
import { CLAIM_URL } from './northpole/links';
import { levelOf } from './northpole/levels';
import type { SquareKind } from './northpole/map';

/** The map's note for a deep link to a square that isn't there. The id is only ever set as text. */
export function renderUnknown(note: HTMLElement, focus: { kind: SquareKind; id: string }) {
  if (focus.kind === 'attraction') {
    note.textContent = `The North Pole has no attraction called "${focus.id}".`;
  } else {
    note.textContent = `There's no booth for @${focus.id} yet. `;
    const claim = document.createElement('a');
    claim.href = CLAIM_URL;
    claim.target = '_blank';
    claim.rel = 'noopener';
    claim.textContent = 'Claim it!';
    note.append(claim);
  }
  note.hidden = false;
}

/** A level's note for a link to one of its squares that isn't there. The id is only ever set as text. */
export function renderUnknownInLevel(app: HTMLElement, login: string, id: string) {
  const note = the(app, '.map-note', HTMLElement);
  note.textContent = `${levelOf(login)?.name ?? login} has no square called "${id.slice(0, 40)}".`;
  note.hidden = false;
}
