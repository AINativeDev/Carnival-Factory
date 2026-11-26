/**
 * The help at the foot of a square's panel: what someone can do next, which
 * depends on whose square it is. A booth's owner can ask for a change or share
 * it as theirs, and a level's owner can ask for a change to it; anyone can get a booth of their own beside an attraction or
 * from a level, and a stall of The Factory tells its step of the tour. Only fixed text and the repository's own links go in as HTML;
 * the season link's login is set as a property.
 */
import { the } from './dom';
import { isOn } from './feature-flags';
import { fillTourStop } from './factory-tour';
import { BADGE_REQUEST_URL, CHANGE_URL, CLAIM_URL, LEVEL_REQUEST_URL } from './northpole/links';
import type { SquareKind } from './northpole/map-options';
import { isNorthPoleLevel, landmarkLevel } from './northpole/north-pole-levels';
import { levelLink, seasonLink } from './route';

const GET_A_BOOTH = `<a href="${CLAIM_URL}" target="_blank" rel="noopener">Get a booth</a>`;

/** "Built your own factory?" with the badge and the advent calendar, as far as their feature flags are on. */
function factoryLine(): string {
  const links = [
    isOn('elfEngineer') &&
      `<a href="${BADGE_REQUEST_URL}" target="_blank" rel="noopener">Get the Elf Engineer badge</a>`,
    isOn('advent') && `<a href="#/advent">Open the advent calendar</a>`,
  ].filter(Boolean);
  return links.length
    ? `<p><span class="visit-ask">Built your own factory?</span> ${links.join(' <span aria-hidden="true">·</span> ')}</p>`
    : '';
}

/**
 * A booth's owner already has their booth, so what unlocks next is a level of
 * their own (ADR 0048): the panel asks for that instead of "Get a booth".
 */
export function offerLevelNext(card: ParentNode) {
  // Participants' levels wait behind their feature flag (ADR 0055): until then the owner keeps "Get a booth".
  if (!isOn('levels')) return;
  the(card, '.visit-want', HTMLElement).hidden = true;
  the(card, '.visit-next', HTMLElement).hidden = false;
}

/** Puts the next steps for this kind of square, or for a level itself, into its panel's help box. */
export function fillVisitHelp(
  help: Element,
  kind: SquareKind | 'level',
  id: string,
  level?: string,
) {
  if (kind === 'level') {
    help.innerHTML = isNorthPoleLevel(id)
      ? `<p>This level belongs to the North Pole, so only its maintainers change it. ${GET_A_BOOTH} at the North Pole.</p>`
      : `<p><span class="visit-ask">Is this yours?</span> <a href="${LEVEL_REQUEST_URL}" target="_blank" rel="noopener">Ask for a change</a></p>`;
  } else if (level && isNorthPoleLevel(level)) {
    fillTourStop(help, id);
  } else if (level) {
    help.innerHTML = `<p>This square belongs to a participant's own level. ${GET_A_BOOTH} at the North Pole.</p>`;
  } else if (kind === 'booth') {
    help.innerHTML = `<p><span class="visit-ask">Is this yours?</span> <a href="${CHANGE_URL}" target="_blank" rel="noopener">Ask for a change</a> <span aria-hidden="true">·</span> <button class="visit-mine" type="button">Share it as yours</button></p>
      ${factoryLine()}
      <p><a class="visit-season">Your season</a></p>`;
    the(help, '.visit-season', HTMLAnchorElement).href = seasonLink(id);
  } else if (landmarkLevel(kind, id)) {
    help.innerHTML = `<p>This landmark is the way into a level of the North Pole's own. <a href="${levelLink(id)}">Take the sleigh inside</a> <span aria-hidden="true">·</span> ${GET_A_BOOTH}.</p>`;
  } else {
    help.innerHTML = `<p>Attractions belong to the North Pole, so only its maintainers change them. ${GET_A_BOOTH} beside it.</p>`;
  }
}
