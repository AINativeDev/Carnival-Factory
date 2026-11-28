/**
 * What the visitor's keys, mouse and the call to action do on the map: walk
 * with WASD or the arrows, open with E or Enter, let go with Escape, click the
 * ground to walk there and a structure to open it; inside a square a click is
 * the square's. Fingers dragging and pinching the camera are map-touch.ts.
 */
import { BILLBOARD, onBillboard } from './billboard';
import { middle } from './brushes';
import { screenToWorld } from './camera-view';
import { spotUnder } from './map-labels';
import { enter, open, select } from './map-open';
import type { MapRun } from './map-state';
import { KEYS, walkToward } from './map-walk';
import { inviteFor } from './owners';
import { rideKey, rideOnward } from './ride-map';
import { MAX_KEYS, squareKey } from './square-keys';
import { toScreen, toTile, type Tile } from './world';
import { tileOf } from './walking';

/** Whether a key press belongs to a text field. */
export const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/** Whether Enter on `target` already does something of its own, as on a link or a button. */
const pressable = (target: EventTarget | null) =>
  target instanceof HTMLElement && /^(BUTTON|A)$/.test(target.tagName);

/** Where a click or the mouse is, in world pixels. */
export function pointAt(m: MapRun, event: MouseEvent): Tile {
  const box = m.canvas.getBoundingClientRect();
  const centre = m.camera ?? toScreen(m.player);
  return screenToWorld(
    { x: event.clientX - box.left, y: event.clientY - box.top },
    box.width,
    box.height,
    centre,
    m.zoom || 1,
  );
}

/** Whether `point` is on the billboard: a click there opens AI DevCon's room. */
export const billboardUnder = (m: MapRun, point: Tile) =>
  m.world.things.some((thing) => thing.kind === 'billboard' && onBillboard(middle(thing), point));

/** Walk with the keys, open what's invited into with E or Enter, and let go of it with Escape. */
export function onKeyDown(m: MapRun, event: KeyboardEvent) {
  if (typing(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
  if (m.visiting) {
    hearInside(m, event);
    return;
  }
  const name = event.key.toLowerCase();
  const step = KEYS[name];
  // In a ride the walking keys don't walk, so nobody walks off the track (ADR 0041).
  if (m.ride && (rideKey(m, name, pressable(event.target)) || step)) {
    event.preventDefault();
    return;
  }
  const invited = inviteFor(m.selected, m.near);
  if (step) {
    m.held.set(name, step);
    event.preventDefault();
  } else if ((name === 'e' || (name === 'enter' && !pressable(event.target))) && invited) {
    event.preventDefault();
    enter(m, invited);
  } else if (name === 'escape' && m.selected) {
    select(m, undefined);
  }
}

/**
 * Inside a square, the arrows, Enter and Space are the square's (ADR 0064):
 * kept for its next frame, at most a few, and not walking or scrolling the
 * page. Enter on the panel's own buttons and links stays theirs.
 */
function hearInside(m: MapRun, event: KeyboardEvent) {
  const key = squareKey(event.key);
  if (!key || (key === 'enter' && pressable(event.target))) return;
  event.preventDefault();
  if (m.keys.length < MAX_KEYS) m.keys.push(key);
}

/** The call to action, clicked: opens what it invites into. */
export function onPrompt(m: MapRun) {
  const spot = inviteFor(m.selected, m.near);
  if (spot && !m.visiting) enter(m, spot);
}

/**
 * A click walks to the ground clicked, or opens the structure clicked. On a
 * touch screen the first tap on a structure shows its tag, and the second
 * opens it. Inside a square a click is the square's to play with, as is a drag.
 */
export function onClick(m: MapRun, event: MouseEvent) {
  const box = m.canvas.getBoundingClientRect();
  const at = { x: event.clientX - box.left, y: event.clientY - box.top };
  if (!m.pointer.tapped(at)) return;
  if (m.visiting) return;
  const point = pointAt(m, event);
  if (billboardUnder(m, point)) {
    // The billboard is AI DevCon's way in: its room has the tickets (ADR 0058).
    m.options.onOpen('attraction', BILLBOARD.room);
    return;
  }
  const spot = spotUnder(m, point);
  const touch = (event as PointerEvent).pointerType === 'touch';
  if (spot && touch && m.hovered !== spot) {
    m.hovered = spot;
    return;
  }
  if (spot) {
    open(m, spot);
    return;
  }
  m.hovered = undefined;
  // In a ride, a click on the ground rides on instead: nobody walks off the track.
  if (m.ride) {
    rideOnward(m);
    return;
  }
  // Walk to the tile clicked, or the nearest one beside it you can stand on.
  const tile = tileOf(toTile(point));
  const goals: Tile[] = [];
  for (let ring = 0; ring <= 2; ring++)
    for (let dx = -ring; dx <= ring; dx++)
      for (let dy = -ring; dy <= ring; dy++)
        if (Math.max(Math.abs(dx), Math.abs(dy)) === ring)
          goals.push({ x: tile.x + dx, y: tile.y + dy });
  walkToward(m, goals);
}
