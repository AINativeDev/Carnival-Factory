/**
 * A participant's level page: the map walking its world instead of the North
 * Pole's, with its own squares sandboxed on their stalls, its panel beside it
 * and the sleigh home (docs/specs/levels.md). The router (src/router.ts)
 * opens it, and moves the player about in it once it's open.
 */
import { the } from './dom';
import { openLevelPanel } from './level-panel';
import { renderUnknownInLevel } from './map-notes';
import { LEVEL_MAP } from './map-page-markup';
import { backToTheMap, renderMap, travel } from './map-page';
import { closeCard, type Page } from './page';
import { LEVEL_THEMES, levelWorld } from './northpole/level';
import { levelOf } from './northpole/levels';
import { startMap } from './northpole/map';

/**
 * A participant's level, perhaps in front of one of its squares. A level that
 * isn't there, or is closed for repairs, says so on the North Pole's map
 * instead, beside the sleigh station.
 */
export function renderLevel(page: Page, login: string, focus?: string) {
  const { app } = page;
  const entry = levelOf(login);
  if (!entry?.level) {
    renderMap(page);
    const note = the(app, '.map-note', HTMLElement);
    // From the address, so only ever set as text, and no longer than a login.
    const who = login.slice(0, 39);
    note.textContent = entry
      ? `@${who}'s level is closed for repairs.`
      : `There's no level for @${who} yet.`;
    note.hidden = false;
    return;
  }
  const { level } = entry;
  document.body.dataset.view = 'map';
  page.shown = login;
  app.innerHTML = LEVEL_MAP;
  const canvas = the(app, 'canvas', HTMLCanvasElement);
  // The panel beside the map, and the map's label. Its id is the owner's login (validateLevel
  // checks it), and the panel goes with the frame when the next page replaces it.
  /* v8 ignore next -- the page's wiring: openLevelPanel is unit tested, and smoke/levels.spec.ts reads it */
  openLevelPanel(the(app, '.map-frame', HTMLElement), level);
  const known = focus && entry.squares.some((square) => square.id === focus) ? focus : undefined;
  if (focus && !known) renderUnknownInLevel(app, login, focus);
  const started = startMap(
    the(app, '.map-frame', HTMLElement),
    canvas,
    the(app, '.map-prompt', HTMLButtonElement),
    {
      attractions: entry.squares,
      booths: [],
      level: {
        id: login,
        name: level.name,
        world: levelWorld(level),
        tint: LEVEL_THEMES[level.theme].tint,
      },
      onOpen: (_kind, id) => {
        location.hash = `#/level/${login}/${id}`;
      },
      onLeave: () => {
        closeCard(page, true);
      },
      onTravel: travel,
      ...(known ? { focus: { kind: 'attraction' as const, id: known } } : {}),
    },
  );
  page.stop = () => {
    closeCard(page, false);
    started.stop();
  };
  page.map = started;
  backToTheMap(page, canvas);
}

/** In the level on screen, puts the player in front of one of its squares, or says it isn't there. */
export function jumpInLevel(page: Page, login: string, id: string) {
  if (!levelOf(login)?.squares.some((square) => square.id === id)) {
    renderUnknownInLevel(page.app, login, id);
    return;
  }
  the(page.app, '.map-note', HTMLElement).hidden = true;
  page.map?.jumpTo('attraction', id);
}
