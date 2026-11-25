/**
 * The panel beside a level's map: a square's visit panel (visit-hud.ts), fitted
 * to a whole level. It shows the level's name, who it's by and its description,
 * then how it was built, Share, a booth first and then a level, and More. A level has
 * no remix, no People's Choice vote and nothing to leave, and the player walks
 * on with the keys while it's open. It stands beside the map rather than over
 * it, and inside one of the level's squares, that square's own panel takes its
 * place (docs/specs/levels.md).
 */
import { LEVEL_REQUEST_URL } from './northpole/links';
import { levelOwner } from './northpole/north-pole-levels';
import { openVisitHud, type VisitHud } from './visit-hud';
import { labelLevel } from './level-hud';

/** What the panel says about a level: its folder's login as `id`, and its own text. */
export interface LevelSummary {
  id: string;
  name: string;
  description: string;
  /** Whether it's ridden on its coaster instead of walked (ADR 0041). */
  ride?: boolean;
}

/** Labels the level's map, and opens its panel beside it, in the map's frame. */
export function openLevelPanel(frame: HTMLElement, level: LevelSummary): VisitHud {
  frame.querySelectorAll('canvas').forEach((map) => {
    labelLevel(map, level, levelOwner(level.id));
  });
  const hud = openVisitHud(frame, {
    kind: 'level',
    square: level,
    invite: false,
    onClose: () => undefined,
    onClaim: () => undefined,
  });
  const { card } = hud;
  // Not `.visit`: that is the panel of the square the player is inside.
  card.className = 'hud hud-level';
  card.querySelectorAll<HTMLElement>('.visit-leave, .visit-map').forEach((part) => {
    part.hidden = true;
  });
  card.querySelectorAll('.visit-title').forEach((title) => {
    const owner = document.createElement('p');
    owner.className = 'level-owner';
    owner.textContent = `A level by ${levelOwner(level.id)}`;
    title.after(owner);
  });
  // A level unlocks once you have a booth (ADR 0048): "Get a booth" stays, and the level comes after.
  card.querySelectorAll('.visit-build').forEach((build) => {
    const next = document.createElement('a');
    next.className = 'visit-level';
    next.href = LEVEL_REQUEST_URL;
    next.target = '_blank';
    next.rel = 'noopener';
    next.textContent = 'a level';
    build.after(' first, then ', next);
  });

  // Beside the map's frame, not over it, so the camera frames the level in the space that's left.
  frame.after(card);
  // The map marks the frame while the player is inside a square: step aside until they leave.
  // The frame changes size either way, and the map fits its canvas again on a resize.
  const follow = () => {
    const inside = frame.dataset.visiting !== undefined;
    if (inside === !card.isConnected) return;
    if (inside) card.remove();
    else frame.after(card);
    window.dispatchEvent(new Event('resize'));
  };
  const watcher = new MutationObserver(follow);
  watcher.observe(frame, { attributes: true, attributeFilter: ['data-visiting'] });
  return {
    close() {
      watcher.disconnect();
      hud.close();
    },
  };
}
